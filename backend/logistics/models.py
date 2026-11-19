from django.db import models


class CorridorMetric(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=120)
    region_badge = models.CharField(max_length=80)
    active_farms = models.IntegerField(default=0)
    offered_bultos = models.IntegerField(default=0)
    assigned_trucks = models.IntegerField(default=0)
    total_trucks = models.IntegerField(default=0)
    occupancy_pct = models.FloatField(default=0.0)
    eta_status = models.CharField(max_length=40, default='A tiempo')
    eta_delta_text = models.CharField(max_length=120)
    gps_online_count = models.IntegerField(default=0)
    shadow_zone_note = models.CharField(max_length=200)
    escrow_cop = models.BigIntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.id} - {self.name}"


class FarmerOffer(models.Model):
    QUALITY_CHOICES = [
        ('Primera', 'Primera'),
        ('Segunda', 'Segunda'),
        ('Tercera', 'Tercera'),
    ]
    STATUS_CHOICES = [
        ('Pendiente Moderar', 'Pendiente Moderar'),
        ('Publicada en Catálogo', 'Publicada en Catálogo'),
        ('Foto Solicitada', 'Foto Solicitada'),
        ('Asignada a Ruta', 'Asignada a Ruta'),
    ]
    ACCESS_CHOICES = [
        ('Solo 4x4', 'Solo 4x4'),
        ('Entra Turbo', 'Entra Turbo'),
        ('Vía Pavimentada', 'Vía Pavimentada'),
    ]

    id = models.CharField(max_length=20, primary_key=True)
    received_at = models.CharField(max_length=20)
    minutes_ago = models.IntegerField(default=0)
    farmer_name = models.CharField(max_length=120)
    farmer_phone = models.CharField(max_length=30)
    farmer_score = models.FloatField(default=5.0)
    compliance_rate = models.FloatField(default=100.0)
    farm_name = models.CharField(max_length=120)
    vereda = models.CharField(max_length=120)
    municipio = models.CharField(max_length=120)
    corridor = models.CharField(max_length=120)
    altitude_msnm = models.IntegerField(default=2500)
    gps_coords = models.CharField(max_length=80)
    road_access = models.CharField(max_length=30, choices=ACCESS_CHOICES, default='Entra Turbo')
    audio_duration = models.CharField(max_length=10, default='0:20')
    transcript = models.TextField()
    highlighted_entities = models.JSONField(default=dict)
    photos_count = models.IntegerField(default=1)
    exif_verified = models.BooleanField(default=True)
    product = models.CharField(max_length=120)
    bultos = models.IntegerField(default=1)
    weight_kg = models.IntegerField(default=50)
    validated_quality = models.CharField(max_length=20, choices=QUALITY_CHOICES, default='Primera')
    price_per_bulto_cop = models.IntegerField(default=80000)
    market_ref_price_cop = models.IntegerField(default=90000)
    pickup_window = models.CharField(max_length=60)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Pendiente Moderar')
    map_pos_x = models.IntegerField(default=50)
    map_pos_y = models.IntegerField(default=50)

    class Meta:
        ordering = ['minutes_ago', 'id']

    def __str__(self) -> str:
        return f"{self.id} - {self.farmer_name} ({self.product})"


class VehicleFleet(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    plate = models.CharField(max_length=15, unique=True)
    vehicle_type = models.CharField(max_length=60)
    traction = models.CharField(max_length=10, default='4x4')
    capacity_kg = models.IntegerField(default=4500)
    capacity_m3 = models.FloatField(default=18.0)
    driver_name = models.CharField(max_length=120)
    driver_phone = models.CharField(max_length=30)
    driver_wallet = models.CharField(max_length=60)
    soat_status = models.CharField(max_length=20, default='Vigente')
    soat_days_left = models.IntegerField(default=100)
    tecno_status = models.CharField(max_length=20, default='Vigente')
    tecno_days_left = models.IntegerField(default=100)
    corridor = models.CharField(max_length=120)
    current_status = models.CharField(max_length=40, default='Disponible en Acopio')
    gps_signal = models.CharField(max_length=30, default='Online')
    last_ping = models.CharField(max_length=80)
    freight_cost_cop = models.IntegerField(default=400000)
    backhaul_efficiency_pct = models.IntegerField(default=20)

    def __str__(self) -> str:
        return f"{self.plate} - {self.driver_name}"


class RouteStop(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    order = models.IntegerField(default=1)
    operation_type = models.CharField(max_length=40)
    actor_name = models.CharField(max_length=140)
    location_label = models.CharField(max_length=140)
    gps_coords = models.CharField(max_length=80)
    cargo_description = models.CharField(max_length=160)
    quality = models.CharField(max_length=20, blank=True, null=True)
    delta_weight_kg = models.IntegerField(default=0)
    cumulative_weight_kg = models.IntegerField(default=0)
    volume_m3 = models.FloatField(default=0.0)
    time_window = models.CharField(max_length=60)
    eta = models.CharField(max_length=30)
    eta_status = models.CharField(max_length=20, default='OK')
    requires_4x4 = models.BooleanField(default=False)
    map_pos_x = models.IntegerField(default=50)
    map_pos_y = models.IntegerField(default=50)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self) -> str:
        return f"#{self.order} {self.actor_name}"


class EscrowOrder(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    route_id = models.CharField(max_length=20)
    corridor = models.CharField(max_length=120)
    farmer_name = models.CharField(max_length=120)
    farmer_wallet_type = models.CharField(max_length=20, default='Nequi')
    farmer_wallet_masked = models.CharField(max_length=40)
    driver_name = models.CharField(max_length=120)
    driver_plate = models.CharField(max_length=15)
    driver_wallet_type = models.CharField(max_length=20, default='Daviplata')
    driver_wallet_masked = models.CharField(max_length=40)
    restaurant_name = models.CharField(max_length=140)
    product_summary = models.CharField(max_length=160)
    quality = models.CharField(max_length=20, default='Primera')
    farm_photos_count = models.IntegerField(default=4)
    scale_ticket_photo = models.BooleanField(default=True)
    exif_gps_match = models.BooleanField(default=True)
    declared_weight_kg = models.IntegerField(default=1000)
    scale_weight_kg = models.IntegerField(default=1000)
    qr_status = models.CharField(max_length=40, default='QR Validado')
    qr_timestamp = models.CharField(max_length=40)
    farmer_net_cop = models.IntegerField(default=0)
    driver_freight_cop = models.IntegerField(default=0)
    platform_fee_cop = models.IntegerField(default=0)
    status = models.CharField(max_length=30, default='Listo para Liberar')
    tx_hash = models.CharField(max_length=60, blank=True, null=True)
    dispute_reason = models.TextField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.id} - {self.farmer_name} ({self.status})"


class NetworkActor(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=140)
    doc_id = models.CharField(max_length=80)
    role = models.CharField(max_length=30)
    corridor = models.CharField(max_length=120)
    location_details = models.CharField(max_length=180)
    kyc_status = models.CharField(max_length=20, default='Vigente')
    kyc_detail_text = models.CharField(max_length=200)
    operational_profile = models.CharField(max_length=180)
    compliance_score_pct = models.FloatField(default=100.0)
    completed_ops_count = models.IntegerField(default=0)
    wallet_or_credit_label = models.CharField(max_length=120)
    credit_used_cop = models.BigIntegerField(blank=True, null=True)
    credit_limit_cop = models.BigIntegerField(blank=True, null=True)
    last_activity = models.CharField(max_length=80)
    phone = models.CharField(max_length=30)

    def __str__(self) -> str:
        return f"{self.id} - {self.name} ({self.role})"


class CriticalAlert(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    severity = models.CharField(max_length=20, default='warning')
    title = models.CharField(max_length=160)
    corridor = models.CharField(max_length=120)
    location = models.CharField(max_length=140)
    time_ago = models.CharField(max_length=40)
    detail = models.TextField()
    truck_plate = models.CharField(max_length=20, blank=True, null=True)
    action_label = models.CharField(max_length=80)
    target_module = models.CharField(max_length=40, default='/')
    resolved = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.id} - {self.title}"
