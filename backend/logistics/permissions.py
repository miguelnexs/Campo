from rest_framework.permissions import BasePermission


def get_user_role(user) -> str:
    if not user or not user.is_authenticated:
        return 'Anónimo'
    if user.is_superuser or user.groups.filter(name='Administrador').exists():
        return 'Administrador'
    if user.groups.filter(name='OperadorDespacho').exists():
        return 'Operador de Despacho'
    return 'Operador de Despacho'


class IsAdminRole(BasePermission):
    """Solo permite acceso a usuarios con rol Administrador (pagos Escrow y cambio de precios)."""

    message = 'Acción restringida: solo un Administrador puede liberar pagos o modificar precios.'

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and get_user_role(request.user) == 'Administrador'
        )


class IsDispatcherOrAdmin(BasePermission):
    """Permite acceso a Operadores de Despacho y Administradores."""

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)
