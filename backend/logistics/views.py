import random
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsAdminRole, get_user_role
from .models import (
    CorridorMetric,
    FarmerOffer,
    VehicleFleet,
    RouteStop,
    EscrowOrder,
    NetworkActor,
    CriticalAlert,
)
from .serializers import (
    CorridorMetricSerializer,
    FarmerOfferSerializer,
    VehicleFleetSerializer,
    RouteStopSerializer,
    EscrowOrderSerializer,
    NetworkActorSerializer,
    CriticalAlertSerializer,
)


def _recalculate_route_weights():
    stops = list(RouteStop.objects.order_by('order', 'id'))
    running_kg = 0
    for idx, stop in enumerate(stops, start=1):
        running_kg = max(0, running_kg + stop.delta_weight_kg)
        stop.order = idx
        stop.cumulative_weight_kg = running_kg
        stop.save(update_fields=['order', 'cumulative_weight_kg'])
    return stops


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    username = str(request.data.get('username', '')).strip().lower()
    password = str(request.data.get('password', '')).strip()
    user = authenticate(username=username, password=password)
    if not user:
        return Response(
            {'detail': 'Usuario o contraseña incorrectos.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh = RefreshToken.for_user(user)
    role = get_user_role(user)
    full_name = user.get_full_name() or user.username
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'fullName': full_name,
            'role': role,
        },
    })


@api_view(['GET'])
def me_view(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'fullName': user.get_full_name() or user.username,
        'role': get_user_role(user),
    })


@api_view(['GET'])
def control_tower_state(request):
    """Retorna el estado completo sincronizado de los 5 módulos de la Torre de Control."""
    return Response({
        'corridors': CorridorMetricSerializer(CorridorMetric.objects.all(), many=True).data,
        'offers': FarmerOfferSerializer(FarmerOffer.objects.all(), many=True).data,
        'vehicles': VehicleFleetSerializer(VehicleFleet.objects.all(), many=True).data,
        'routeStops': RouteStopSerializer(RouteStop.objects.all(), many=True).data,
        'escrowOrders': EscrowOrderSerializer(EscrowOrder.objects.all(), many=True).data,
        'actors': NetworkActorSerializer(NetworkActor.objects.all(), many=True).data,
        'alerts': CriticalAlertSerializer(CriticalAlert.objects.filter(resolved=False), many=True).data,
    })


@api_view(['POST'])
def approve_offer(request, offer_id):
    offer = get_object_or_404(FarmerOffer, id=offer_id)
    quality = request.data.get('quality', offer.validated_quality)
    price = int(request.data.get('pricePerBultoCop', offer.price_per_bulto_cop))
    if price != offer.price_per_bulto_cop and get_user_role(request.user) != 'Administrador':
        return Response(
            {'detail': 'Solo el Administrador puede cambiar precios.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    offer.validated_quality = quality
    offer.price_per_bulto_cop = price
    offer.status = 'Publicada en Catálogo'
    offer.save()
    return Response(FarmerOfferSerializer(offer).data)


@api_view(['POST'])
def request_offer_photo(request, offer_id):
    offer = get_object_or_404(FarmerOffer, id=offer_id)
    offer.status = 'Foto Solicitada'
    offer.save(update_fields=['status'])
    return Response(FarmerOfferSerializer(offer).data)


@api_view(['PATCH'])
def update_offer_draft(request, offer_id):
    offer = get_object_or_404(FarmerOffer, id=offer_id)
    if 'pricePerBultoCop' in request.data:
        new_price = int(request.data['pricePerBultoCop'])
        if new_price != offer.price_per_bulto_cop and get_user_role(request.user) != 'Administrador':
            return Response(
                {'detail': 'Solo el Administrador puede modificar precios.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        offer.price_per_bulto_cop = new_price
    if 'quality' in request.data:
        offer.validated_quality = request.data['quality']
    offer.save()
    return Response(FarmerOfferSerializer(offer).data)


@api_view(['POST'])
def add_offer_to_route(request, offer_id):
    offer = get_object_or_404(FarmerOffer, id=offer_id)
    offer.status = 'Asignada a Ruta'
    offer.save(update_fields=['status'])

    next_order = RouteStop.objects.count() + 1
    new_id = f"STP-{next_order:02d}"
    while RouteStop.objects.filter(id=new_id).exists():
        next_order += 1
        new_id = f"STP-{next_order:02d}"

    RouteStop.objects.create(
        id=new_id,
        order=next_order,
        operation_type='Recolección (Milk-Run)',
        actor_name=f"{offer.farm_name} ({offer.farmer_name})",
        location_label=f"{offer.vereda}, {offer.municipio}",
        gps_coords=offer.gps_coords,
        cargo_description=f"{offer.bultos} Bultos {offer.product}",
        quality=offer.validated_quality,
        delta_weight_kg=offer.weight_kg,
        cumulative_weight_kg=offer.weight_kg,
        volume_m3=14.8,
        time_window=offer.pickup_window.replace('Hoy ', ''),
        eta='09:50 AM',
        eta_status='OK',
        requires_4x4=(offer.road_access == 'Solo 4x4'),
        map_pos_x=offer.map_pos_x,
        map_pos_y=offer.map_pos_y,
    )
    stops = _recalculate_route_weights()
    return Response({
        'offer': FarmerOfferSerializer(offer).data,
        'routeStops': RouteStopSerializer(stops, many=True).data,
    })


@api_view(['POST'])
def move_route_stop(request, stop_id):
    direction = request.data.get('direction')
    stops = list(RouteStop.objects.order_by('order', 'id'))
    idx = next((i for i, s in enumerate(stops) if s.id == stop_id), None)
    if idx is None:
        return Response({'detail': 'Parada no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    target_idx = idx - 1 if direction == 'up' else idx + 1
    if 0 <= target_idx < len(stops):
        stops[idx], stops[target_idx] = stops[target_idx], stops[idx]
        for i, s in enumerate(stops, start=1):
            s.order = i
            s.save(update_fields=['order'])
    updated = _recalculate_route_weights()
    return Response(RouteStopSerializer(updated, many=True).data)


@api_view(['POST'])
def dispatch_vehicle(request, vehicle_id):
    vehicle = get_object_or_404(VehicleFleet, id=vehicle_id)
    if vehicle.soat_status == 'Vencido' or vehicle.tecno_status == 'Vencido':
        return Response(
            {'detail': f'Vehículo {vehicle.plate} bloqueado por documentos vencidos.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    vehicle.current_status = 'En Ruta Milk-Run'
    vehicle.save(update_fields=['current_status'])
    return Response(VehicleFleetSerializer(vehicle).data)


@api_view(['POST'])
@permission_classes([IsAdminRole])
def release_escrow(request, order_id):
    order = get_object_or_404(EscrowOrder, id=order_id)
    tx_hash = f"NEQ-{random.randint(1000000, 9999999)}-OK"
    order.status = 'Pagado'
    order.tx_hash = tx_hash
    order.save(update_fields=['status', 'tx_hash'])
    return Response(EscrowOrderSerializer(order).data)


@api_view(['POST'])
@permission_classes([IsAdminRole])
def recalculate_and_release_escrow(request, order_id):
    order = get_object_or_404(EscrowOrder, id=order_id)
    ratio = order.scale_weight_kg / order.declared_weight_kg if order.declared_weight_kg else 1
    adjusted_cop = round((order.farmer_net_cop * ratio) / 1000) * 1000
    tx_hash = f"ADJ-{random.randint(1000000, 9999999)}-OK"

    order.farmer_net_cop = int(adjusted_cop)
    order.status = 'Pagado'
    order.tx_hash = tx_hash
    order.dispute_reason = (
        f"Liquidado por peso real en báscula ({order.scale_weight_kg} kg). "
        "Soporte enviado a WhatsApp."
    )
    order.save()
    return Response(EscrowOrderSerializer(order).data)


@api_view(['POST'])
@permission_classes([IsAdminRole])
def flag_escrow_dispute(request, order_id):
    order = get_object_or_404(EscrowOrder, id=order_id)
    note = request.data.get('note', 'Bloqueado manualmente por auditoría.')
    order.status = 'Disputa por Merma'
    order.dispute_reason = note
    order.save(update_fields=['status', 'dispute_reason'])
    return Response(EscrowOrderSerializer(order).data)


@api_view(['POST'])
def approve_actor_docs(request, actor_id):
    actor = get_object_or_404(NetworkActor, id=actor_id)
    actor.kyc_status = 'Vigente'
    actor.kyc_detail_text = '🟢 Póliza SOAT y Tecnomecánica renovadas y verificadas en RUNT (365d)'
    actor.save(update_fields=['kyc_status', 'kyc_detail_text'])

    for veh in VehicleFleet.objects.all():
        if veh.plate in actor.doc_id or veh.driver_name == actor.name:
            veh.soat_status = 'Vigente'
            veh.soat_days_left = 365
            veh.tecno_status = 'Vigente'
            veh.current_status = 'Disponible en Acopio'
            veh.save()

    return Response({
        'actor': NetworkActorSerializer(actor).data,
        'vehicles': VehicleFleetSerializer(VehicleFleet.objects.all(), many=True).data,
    })


@api_view(['POST'])
def resolve_alert(request, alert_id):
    alert = get_object_or_404(CriticalAlert, id=alert_id)
    alert.resolved = True
    alert.save(update_fields=['resolved'])
    return Response({'id': alert.id, 'resolved': True})


@api_view(['POST'])
def create_offer(request):
    data = request.data
    next_num = 4100 + FarmerOffer.objects.count() + 1
    offer_id = f"OFR-{next_num}"
    while FarmerOffer.objects.filter(id=offer_id).exists():
        next_num += 1
        offer_id = f"OFR-{next_num}"

    bultos = int(data.get('bultos', 10))
    weight_kg = int(data.get('weightKg', bultos * 50))
    product = data.get('product', 'Papa Pastusa')
    vereda = data.get('vereda', 'Vda. Centro')
    quality = data.get('validatedQuality', 'Primera')
    pickup_window = data.get('pickupWindow', 'Hoy 08:00 – 11:00 AM')

    offer = FarmerOffer.objects.create(
        id=offer_id,
        received_at=data.get('receivedAt', 'Ahora'),
        minutes_ago=0,
        farmer_name=data.get('farmerName', 'Campesino'),
        farmer_phone=data.get('farmerPhone', '+57 300 000 0000'),
        farmer_score=5.0,
        compliance_rate=100.0,
        farm_name=data.get('farmName', 'Finca La Esperanza'),
        vereda=vereda,
        municipio=data.get('municipio', 'Ventaquemada, Boyacá'),
        corridor=data.get('corridor', 'Corredor Cundiboyacense → Bogotá'),
        altitude_msnm=int(data.get('altitudeMsnm', 2600)),
        gps_coords=data.get('gpsCoords', '5.3600° N, 73.5200° W'),
        road_access=data.get('roadAccess', 'Entra Turbo'),
        audio_duration=data.get('audioDuration', '0:15'),
        transcript=data.get(
            'transcript',
            f"Registro manual: {bultos} bultos de {product} ({quality}) en {vereda}."
        ),
        highlighted_entities={
            'volume': f"{bultos} bultos ({weight_kg} kg)",
            'product': product,
            'qualityClaim': quality,
            'vereda': vereda,
            'window': pickup_window,
        },
        photos_count=int(data.get('photosCount', 1)),
        exif_verified=True,
        product=product,
        bultos=bultos,
        weight_kg=weight_kg,
        validated_quality=quality,
        price_per_bulto_cop=int(data.get('pricePerBultoCop', 80000)),
        market_ref_price_cop=int(data.get('marketRefPriceCop', 90000)),
        pickup_window=pickup_window,
        status='Pendiente Moderar',
        map_pos_x=random.randint(18, 60),
        map_pos_y=random.randint(22, 75),
    )
    return Response(FarmerOfferSerializer(offer).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def create_vehicle(request):
    data = request.data
    next_num = VehicleFleet.objects.count() + 1
    veh_id = f"VEH-{next_num:02d}"
    while VehicleFleet.objects.filter(id=veh_id).exists():
        next_num += 1
        veh_id = f"VEH-{next_num:02d}"

    plate = str(data.get('plate', 'ABC-123')).upper().strip()
    if VehicleFleet.objects.filter(plate=plate).exists():
        return Response(
            {'detail': f'Ya existe un camión con la placa {plate}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    soat_days = int(data.get('soatDaysLeft', 180))
    tecno_days = int(data.get('tecnoDaysLeft', 180))
    soat_status = 'Vencido' if soat_days <= 0 else ('Por Vencer' if soat_days <= 15 else 'Vigente')
    tecno_status = 'Vencido' if tecno_days <= 0 else ('Por Vencer' if tecno_days <= 15 else 'Vigente')

    vehicle = VehicleFleet.objects.create(
        id=veh_id,
        plate=plate,
        vehicle_type=data.get('type', 'Turbo 4x4 Estacas'),
        traction=data.get('traction', '4x4'),
        capacity_kg=int(data.get('capacityKg', 4500)),
        capacity_m3=float(data.get('capacityM3', 18)),
        driver_name=data.get('driverName', 'Conductor'),
        driver_phone=data.get('driverPhone', '+57 300 000 0000'),
        driver_wallet=data.get('driverWallet', 'Nequi •••• 0000'),
        soat_status=soat_status,
        soat_days_left=soat_days,
        tecno_status=tecno_status,
        tecno_days_left=tecno_days,
        corridor=data.get('corridor', 'Corredor Cundiboyacense → Bogotá'),
        current_status='Bloqueado Docs' if (soat_status == 'Vencido' or tecno_status == 'Vencido') else 'Disponible en Acopio',
        gps_signal='Online',
        last_ping='Recién registrado',
        freight_cost_cop=int(data.get('freightCostCop', 450000)),
        backhaul_efficiency_pct=int(data.get('backhaulEfficiencyPct', 20)),
    )
    return Response(VehicleFleetSerializer(vehicle).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def create_actor(request):
    data = request.data
    next_num = 100 + NetworkActor.objects.count() + 1
    actor_id = f"ACT-{next_num}"
    while NetworkActor.objects.filter(id=actor_id).exists():
        next_num += 1
        actor_id = f"ACT-{next_num}"

    kyc_status = data.get('kycStatus', 'Vigente')
    actor = NetworkActor.objects.create(
        id=actor_id,
        name=data.get('name', 'Nuevo Actor'),
        doc_id=data.get('docId', 'CC 00.000.000'),
        role=data.get('role', 'Campesino'),
        corridor=data.get('corridor', 'Corredor Cundiboyacense → Bogotá'),
        location_details=data.get('locationDetails', 'Vereda Centro'),
        kyc_status=kyc_status,
        kyc_detail_text=data.get('kycDetailText', '🟢 Verificado en registro inicial'),
        operational_profile=data.get('operationalProfile', 'Producción / Operación estándar'),
        compliance_score_pct=100.0,
        completed_ops_count=0,
        wallet_or_credit_label=data.get('walletOrCreditLabel', 'Nequi •••• 0000'),
        credit_used_cop=0 if data.get('role') == 'Restaurante B2B' else None,
        credit_limit_cop=int(data.get('creditLimitCop', 10000000)) if data.get('role') == 'Restaurante B2B' else None,
        last_activity='Recién registrado',
        phone=data.get('phone', '+57 300 000 0000'),
    )
    return Response(NetworkActorSerializer(actor).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def create_escrow_order(request):
    data = request.data
    next_num = 9925 + EscrowOrder.objects.count() + 1
    order_id = f"ESC-{next_num}"
    while EscrowOrder.objects.filter(id=order_id).exists():
        next_num += 1
        order_id = f"ESC-{next_num}"

    declared_kg = int(data.get('declaredWeightKg', 1000))
    scale_kg = int(data.get('scaleWeightKg', declared_kg))

    order = EscrowOrder.objects.create(
        id=order_id,
        route_id=data.get('routeId', 'RUT-001'),
        corridor=data.get('corridor', 'Corredor Cundiboyacense → Bogotá'),
        farmer_name=data.get('farmerName', 'Campesino'),
        farmer_wallet_type=data.get('farmerWalletType', 'Nequi'),
        farmer_wallet_masked=data.get('farmerWalletMasked', 'Nequi •••• 0000'),
        driver_name=data.get('driverName', 'Conductor'),
        driver_plate=str(data.get('driverPlate', 'KLM-842')).upper(),
        driver_wallet_type=data.get('driverWalletType', 'Daviplata'),
        driver_wallet_masked=data.get('driverWalletMasked', 'Daviplata •••• 0000'),
        restaurant_name=data.get('restaurantName', 'Restaurante B2B'),
        product_summary=data.get('productSummary', '20 Bultos Papa Pastusa'),
        quality=data.get('quality', 'Primera'),
        farm_photos_count=int(data.get('farmPhotosCount', 4)),
        scale_ticket_photo=True,
        exif_gps_match=True,
        declared_weight_kg=declared_kg,
        scale_weight_kg=scale_kg,
        qr_status=data.get('qrStatus', 'QR Validado'),
        qr_timestamp='Hoy ahora',
        farmer_net_cop=int(data.get('farmerNetCop', 1500000)),
        driver_freight_cop=int(data.get('driverFreightCop', 250000)),
        platform_fee_cop=int(data.get('platformFeeCop', 150000)),
        status='Disputa por Merma' if abs((scale_kg - declared_kg) / max(1, declared_kg)) > 0.03 else 'Listo para Liberar',
    )
    return Response(EscrowOrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def public_catalog(request):
    """Devuelve las cosechas aprobadas y disponibles para compra directa de restaurantes."""
    offers = FarmerOffer.objects.filter(status='Publicada en Catálogo', bultos__gt=0)
    return Response(FarmerOfferSerializer(offers, many=True).data)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def place_catalog_order(request):
    """Permite a un restaurante comprar bultos del catálogo con pago contraentrega y sincroniza CRM, Ruta y Escrow."""
    data = request.data
    offer_id = data.get('offerId')
    offer = get_object_or_404(FarmerOffer, id=offer_id)

    qty_bultos = int(data.get('bultos', 1))
    if qty_bultos < 1 or qty_bultos > offer.bultos:
        return Response(
            {'detail': f'Cantidad inválida. Hay {offer.bultos} bultos disponibles.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    restaurant_name = str(data.get('restaurantName', '')).strip() or 'Restaurante B2B'
    contact_name = str(data.get('contactName', '')).strip() or 'Encargado de Cocina'
    doc_id = str(data.get('docId', '')).strip() or 'NIT Pendiente'
    phone = str(data.get('phone', '')).strip() or '+57 300 000 0000'
    city = str(data.get('city', '')).strip() or 'Bogotá D.C.'
    address = str(data.get('address', '')).strip() or 'Dirección por confirmar'
    delivery_slot = str(data.get('deliverySlot', '')).strip() or 'Hoy 11:00 AM – 01:00 PM'
    payment_method = str(data.get('paymentMethod', 'Contraentrega Nequi/Daviplata al recibir'))

    existing_actor = NetworkActor.objects.filter(name__iexact=restaurant_name).first()
    if not existing_actor:
        act_num = 100 + NetworkActor.objects.count() + 1
        act_id = f"ACT-{act_num}"
        while NetworkActor.objects.filter(id=act_id).exists():
            act_num += 1
            act_id = f"ACT-{act_num}"
        NetworkActor.objects.create(
            id=act_id,
            name=restaurant_name,
            doc_id=f"{doc_id} • Contacto: {contact_name}",
            role='Restaurante B2B',
            corridor=offer.corridor,
            location_details=f"{address} ({city})",
            kyc_status='Vigente',
            kyc_detail_text=f"Pedido Web Verificado • Recibe: {contact_name}",
            operational_profile=f"Pedido directo: {qty_bultos} bultos {offer.product} ({delivery_slot})",
            compliance_score_pct=100.0,
            completed_ops_count=1,
            wallet_or_credit_label=payment_method,
            last_activity=f"Pedido Web Hoy ({qty_bultos} bultos)",
            phone=phone,
        )
    else:
        existing_actor.location_details = f"{address} ({city})"
        existing_actor.phone = phone
        existing_actor.completed_ops_count += 1
        existing_actor.last_activity = f"Pedido Web Hoy ({qty_bultos} bultos)"
        existing_actor.wallet_or_credit_label = payment_method
        existing_actor.save()

    kg_per_bulto = offer.weight_kg / max(1, offer.bultos)
    ordered_kg = int(round(qty_bultos * kg_per_bulto))
    farmer_net = int(qty_bultos * offer.price_per_bulto_cop)
    driver_freight = int(qty_bultos * 9500)
    platform_fee = int(round(farmer_net * 0.08))

    offer.bultos -= qty_bultos
    offer.weight_kg = max(0, offer.weight_kg - ordered_kg)
    if offer.bultos == 0:
        offer.status = 'Asignada a Ruta'
    offer.save()

    next_stop_order = RouteStop.objects.count() + 1
    stop_id = f"STP-{next_stop_order:02d}"
    while RouteStop.objects.filter(id=stop_id).exists():
        next_stop_order += 1
        stop_id = f"STP-{next_stop_order:02d}"

    RouteStop.objects.create(
        id=stop_id,
        order=next_stop_order,
        operation_type='Entrega B2B (Ciudad)',
        actor_name=f"{restaurant_name} ({contact_name})",
        location_label=f"{address}, {city}",
        gps_coords='4.6518° N, 74.0554° W',
        cargo_description=f"Entregar: {qty_bultos} Bultos {offer.product} ({payment_method})",
        quality=offer.validated_quality,
        delta_weight_kg=-ordered_kg,
        cumulative_weight_kg=0,
        volume_m3=round(qty_bultos * 0.14, 1),
        time_window=delivery_slot,
        eta='Por despachar',
        eta_status='OK',
        requires_4x4=False,
        map_pos_x=78,
        map_pos_y=36,
    )
    _recalculate_route_weights()

    next_num = 9925 + EscrowOrder.objects.count() + 1
    order_id = f"ESC-{next_num}"
    while EscrowOrder.objects.filter(id=order_id).exists():
        next_num += 1
        order_id = f"ESC-{next_num}"

    order = EscrowOrder.objects.create(
        id=order_id,
        route_id='RUT-WEB',
        corridor=offer.corridor,
        farmer_name=offer.farmer_name,
        farmer_wallet_type='Nequi',
        farmer_wallet_masked=f"Nequi •••• {offer.farmer_phone[-4:] if len(offer.farmer_phone) >= 4 else '0000'}",
        driver_name='Por asignar en Despacho',
        driver_plate='MILK-RUN',
        driver_wallet_type='Daviplata',
        driver_wallet_masked='Daviplata •••• 0000',
        restaurant_name=f"{restaurant_name} — {address}, {city}",
        product_summary=f"{qty_bultos} Bultos {offer.product} ({payment_method})",
        quality=offer.validated_quality,
        farm_photos_count=offer.photos_count,
        scale_ticket_photo=False,
        exif_gps_match=offer.exif_verified,
        declared_weight_kg=ordered_kg,
        scale_weight_kg=ordered_kg,
        qr_status='En Tránsito',
        qr_timestamp=f"Entrega: {delivery_slot}",
        farmer_net_cop=farmer_net,
        driver_freight_cop=driver_freight,
        platform_fee_cop=platform_fee,
        status='En Tránsito / Pesaje',
    )

    return Response(
        {
            'order': EscrowOrderSerializer(order).data,
            'qrCode': f"CAMPOVIVO-{order.id}-{offer.id}",
            'remainingBultos': offer.bultos,
        },
        status=status.HTTP_201_CREATED,
    )
