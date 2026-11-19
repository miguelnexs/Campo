from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('auth/login/', views.login_view, name='auth-login'),
    path('auth/me/', views.me_view, name='auth-me'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('catalog/', views.public_catalog, name='public-catalog'),
    path('catalog/order/', views.place_catalog_order, name='place-catalog-order'),
    path('state/', views.control_tower_state, name='control-tower-state'),
    path('offers/create/', views.create_offer, name='create-offer'),
    path('offers/<str:offer_id>/approve/', views.approve_offer, name='approve-offer'),
    path('offers/<str:offer_id>/request-photo/', views.request_offer_photo, name='request-offer-photo'),
    path('offers/<str:offer_id>/update-draft/', views.update_offer_draft, name='update-offer-draft'),
    path('offers/<str:offer_id>/add-to-route/', views.add_offer_to_route, name='add-offer-to-route'),
    path('routes/stops/<str:stop_id>/move/', views.move_route_stop, name='move-route-stop'),
    path('vehicles/create/', views.create_vehicle, name='create-vehicle'),
    path('vehicles/<str:vehicle_id>/dispatch/', views.dispatch_vehicle, name='dispatch-vehicle'),
    path('escrow/create/', views.create_escrow_order, name='create-escrow-order'),
    path('escrow/<str:order_id>/release/', views.release_escrow, name='release-escrow'),
    path('escrow/<str:order_id>/recalculate-release/', views.recalculate_and_release_escrow, name='recalculate-escrow'),
    path('escrow/<str:order_id>/dispute/', views.flag_escrow_dispute, name='flag-escrow-dispute'),
    path('actors/create/', views.create_actor, name='create-actor'),
    path('actors/<str:actor_id>/approve-docs/', views.approve_actor_docs, name='approve-actor-docs'),
    path('alerts/<str:alert_id>/resolve/', views.resolve_alert, name='resolve-alert'),
]
