from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group


class Command(BaseCommand):
    help = 'Crea los roles (Administrador, OperadorDespacho) y usuarios iniciales en PostgreSQL'

    def handle(self, *args, **options):
        admin_group, _ = Group.objects.get_or_create(name='Administrador')
        dispatch_group, _ = Group.objects.get_or_create(name='OperadorDespacho')

        for username, first_name, last_name, pwd in [
            ('admin', 'Carlos', 'Mendoza', 'AgroAdmin2026*'),
            ('miguel', 'Miguel', '', 'migel457'),
        ]:
            u, _ = User.objects.get_or_create(
                username=username,
                defaults={'first_name': first_name, 'last_name': last_name, 'is_staff': True, 'is_superuser': True},
            )
            u.set_password(pwd)
            u.is_staff = True
            u.is_superuser = True
            u.save()
            u.groups.add(admin_group)

        dispatch_user, _ = User.objects.get_or_create(
            username='despacho',
            defaults={'first_name': 'Lucía', 'last_name': 'Rojas', 'is_staff': False, 'is_superuser': False},
        )
        dispatch_user.set_password('AgroRuta2026*')
        dispatch_user.save()
        dispatch_user.groups.add(dispatch_group)

        self.stdout.write(self.style.SUCCESS('✅ Usuarios creados/verificados: miguel, admin y despacho'))
