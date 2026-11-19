from django.contrib import admin
from .models import (
    CorridorMetric,
    FarmerOffer,
    VehicleFleet,
    RouteStop,
    EscrowOrder,
    NetworkActor,
    CriticalAlert,
)

admin.site.register(CorridorMetric)
admin.site.register(FarmerOffer)
admin.site.register(VehicleFleet)
admin.site.register(RouteStop)
admin.site.register(EscrowOrder)
admin.site.register(NetworkActor)
admin.site.register(CriticalAlert)
