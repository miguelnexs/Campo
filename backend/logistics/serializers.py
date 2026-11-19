from rest_framework import serializers
from .models import (
    CorridorMetric,
    FarmerOffer,
    VehicleFleet,
    RouteStop,
    EscrowOrder,
    NetworkActor,
    CriticalAlert,
)


class CorridorMetricSerializer(serializers.ModelSerializer):
    regionBadge = serializers.CharField(source='region_badge')
    activeFarms = serializers.IntegerField(source='active_farms')
    offeredBultos = serializers.IntegerField(source='offered_bultos')
    assignedTrucks = serializers.IntegerField(source='assigned_trucks')
    totalTrucks = serializers.IntegerField(source='total_trucks')
    occupancyPct = serializers.FloatField(source='occupancy_pct')
    etaStatus = serializers.CharField(source='eta_status')
    etaDeltaText = serializers.CharField(source='eta_delta_text')
    gpsOnlineCount = serializers.IntegerField(source='gps_online_count')
    shadowZoneNote = serializers.CharField(source='shadow_zone_note')
    escrowCop = serializers.IntegerField(source='escrow_cop')

    class Meta:
        model = CorridorMetric
        fields = [
            'id', 'name', 'regionBadge', 'activeFarms', 'offeredBultos',
            'assignedTrucks', 'totalTrucks', 'occupancyPct', 'etaStatus',
            'etaDeltaText', 'gpsOnlineCount', 'shadowZoneNote', 'escrowCop',
        ]


class FarmerOfferSerializer(serializers.ModelSerializer):
    receivedAt = serializers.CharField(source='received_at')
    minutesAgo = serializers.IntegerField(source='minutes_ago')
    farmerName = serializers.CharField(source='farmer_name')
    farmerPhone = serializers.CharField(source='farmer_phone')
    farmerScore = serializers.FloatField(source='farmer_score')
    complianceRate = serializers.FloatField(source='compliance_rate')
    farmName = serializers.CharField(source='farm_name')
    altitudeMsnm = serializers.IntegerField(source='altitude_msnm')
    gpsCoords = serializers.CharField(source='gps_coords')
    roadAccess = serializers.CharField(source='road_access')
    audioDuration = serializers.CharField(source='audio_duration')
    highlightedEntities = serializers.JSONField(source='highlighted_entities')
    photosCount = serializers.IntegerField(source='photos_count')
    exifVerified = serializers.BooleanField(source='exif_verified')
    weightKg = serializers.IntegerField(source='weight_kg')
    validatedQuality = serializers.CharField(source='validated_quality')
    pricePerBultoCop = serializers.IntegerField(source='price_per_bulto_cop')
    marketRefPriceCop = serializers.IntegerField(source='market_ref_price_cop')
    pickupWindow = serializers.CharField(source='pickup_window')
    mapPos = serializers.SerializerMethodField()

    class Meta:
        model = FarmerOffer
        fields = [
            'id', 'receivedAt', 'minutesAgo', 'farmerName', 'farmerPhone',
            'farmerScore', 'complianceRate', 'farmName', 'vereda', 'municipio',
            'corridor', 'altitudeMsnm', 'gpsCoords', 'roadAccess', 'audioDuration',
            'transcript', 'highlightedEntities', 'photosCount', 'exifVerified',
            'product', 'bultos', 'weightKg', 'validatedQuality',
            'pricePerBultoCop', 'marketRefPriceCop', 'pickupWindow', 'status', 'mapPos',
        ]

    def get_mapPos(self, obj: FarmerOffer) -> dict:
        return {'x': obj.map_pos_x, 'y': obj.map_pos_y}


class VehicleFleetSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='vehicle_type')
    capacityKg = serializers.IntegerField(source='capacity_kg')
    capacityM3 = serializers.FloatField(source='capacity_m3')
    driverName = serializers.CharField(source='driver_name')
    driverPhone = serializers.CharField(source='driver_phone')
    driverWallet = serializers.CharField(source='driver_wallet')
    soatStatus = serializers.CharField(source='soat_status')
    soatDaysLeft = serializers.IntegerField(source='soat_days_left')
    tecnoStatus = serializers.CharField(source='tecno_status')
    tecnoDaysLeft = serializers.IntegerField(source='tecno_days_left')
    currentStatus = serializers.CharField(source='current_status')
    gpsSignal = serializers.CharField(source='gps_signal')
    lastPing = serializers.CharField(source='last_ping')
    freightCostCop = serializers.IntegerField(source='freight_cost_cop')
    backhaulEfficiencyPct = serializers.IntegerField(source='backhaul_efficiency_pct')

    class Meta:
        model = VehicleFleet
        fields = [
            'id', 'plate', 'type', 'traction', 'capacityKg', 'capacityM3',
            'driverName', 'driverPhone', 'driverWallet', 'soatStatus', 'soatDaysLeft',
            'tecnoStatus', 'tecnoDaysLeft', 'corridor', 'currentStatus',
            'gpsSignal', 'lastPing', 'freightCostCop', 'backhaulEfficiencyPct',
        ]


class RouteStopSerializer(serializers.ModelSerializer):
    operationType = serializers.CharField(source='operation_type')
    actorName = serializers.CharField(source='actor_name')
    locationLabel = serializers.CharField(source='location_label')
    gpsCoords = serializers.CharField(source='gps_coords')
    cargoDescription = serializers.CharField(source='cargo_description')
    deltaWeightKg = serializers.IntegerField(source='delta_weight_kg')
    cumulativeWeightKg = serializers.IntegerField(source='cumulative_weight_kg')
    volumeM3 = serializers.FloatField(source='volume_m3')
    timeWindow = serializers.CharField(source='time_window')
    etaStatus = serializers.CharField(source='eta_status')
    requires4x4 = serializers.BooleanField(source='requires_4x4')
    mapPos = serializers.SerializerMethodField()

    class Meta:
        model = RouteStop
        fields = [
            'id', 'order', 'operationType', 'actorName', 'locationLabel',
            'gpsCoords', 'cargoDescription', 'quality', 'deltaWeightKg',
            'cumulativeWeightKg', 'volumeM3', 'timeWindow', 'eta', 'etaStatus',
            'requires4x4', 'mapPos',
        ]

    def get_mapPos(self, obj: RouteStop) -> dict:
        return {'x': obj.map_pos_x, 'y': obj.map_pos_y}


class EscrowOrderSerializer(serializers.ModelSerializer):
    routeId = serializers.CharField(source='route_id')
    farmerName = serializers.CharField(source='farmer_name')
    farmerWalletType = serializers.CharField(source='farmer_wallet_type')
    farmerWalletMasked = serializers.CharField(source='farmer_wallet_masked')
    driverName = serializers.CharField(source='driver_name')
    driverPlate = serializers.CharField(source='driver_plate')
    driverWalletType = serializers.CharField(source='driver_wallet_type')
    driverWalletMasked = serializers.CharField(source='driver_wallet_masked')
    restaurantName = serializers.CharField(source='restaurant_name')
    productSummary = serializers.CharField(source='product_summary')
    farmPhotosCount = serializers.IntegerField(source='farm_photos_count')
    scaleTicketPhoto = serializers.BooleanField(source='scale_ticket_photo')
    exifGpsMatch = serializers.BooleanField(source='exif_gps_match')
    declaredWeightKg = serializers.IntegerField(source='declared_weight_kg')
    scaleWeightKg = serializers.IntegerField(source='scale_weight_kg')
    qrStatus = serializers.CharField(source='qr_status')
    qrTimestamp = serializers.CharField(source='qr_timestamp')
    farmerNetCop = serializers.IntegerField(source='farmer_net_cop')
    driverFreightCop = serializers.IntegerField(source='driver_freight_cop')
    platformFeeCop = serializers.IntegerField(source='platform_fee_cop')
    txHash = serializers.CharField(source='tx_hash', allow_null=True)
    disputeReason = serializers.CharField(source='dispute_reason', allow_null=True)

    class Meta:
        model = EscrowOrder
        fields = [
            'id', 'routeId', 'corridor', 'farmerName', 'farmerWalletType',
            'farmerWalletMasked', 'driverName', 'driverPlate', 'driverWalletType',
            'driverWalletMasked', 'restaurantName', 'productSummary', 'quality',
            'farmPhotosCount', 'scaleTicketPhoto', 'exifGpsMatch',
            'declaredWeightKg', 'scaleWeightKg', 'qrStatus', 'qrTimestamp',
            'farmerNetCop', 'driverFreightCop', 'platformFeeCop', 'status',
            'txHash', 'disputeReason',
        ]


class NetworkActorSerializer(serializers.ModelSerializer):
    docId = serializers.CharField(source='doc_id')
    locationDetails = serializers.CharField(source='location_details')
    kycStatus = serializers.CharField(source='kyc_status')
    kycDetailText = serializers.CharField(source='kyc_detail_text')
    operationalProfile = serializers.CharField(source='operational_profile')
    complianceScorePct = serializers.FloatField(source='compliance_score_pct')
    completedOpsCount = serializers.IntegerField(source='completed_ops_count')
    walletOrCreditLabel = serializers.CharField(source='wallet_or_credit_label')
    creditUsedCop = serializers.IntegerField(source='credit_used_cop', allow_null=True)
    creditLimitCop = serializers.IntegerField(source='credit_limit_cop', allow_null=True)
    lastActivity = serializers.CharField(source='last_activity')

    class Meta:
        model = NetworkActor
        fields = [
            'id', 'name', 'docId', 'role', 'corridor', 'locationDetails',
            'kycStatus', 'kycDetailText', 'operationalProfile',
            'complianceScorePct', 'completedOpsCount', 'walletOrCreditLabel',
            'creditUsedCop', 'creditLimitCop', 'lastActivity', 'phone',
        ]


class CriticalAlertSerializer(serializers.ModelSerializer):
    timeAgo = serializers.CharField(source='time_ago')
    truckPlate = serializers.CharField(source='truck_plate', allow_null=True)
    actionLabel = serializers.CharField(source='action_label')
    targetModule = serializers.CharField(source='target_module')

    class Meta:
        model = CriticalAlert
        fields = [
            'id', 'severity', 'title', 'corridor', 'location',
            'timeAgo', 'detail', 'truckPlate', 'actionLabel', 'targetModule',
        ]
