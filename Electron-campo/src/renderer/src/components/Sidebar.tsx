import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Compass,
  MessageSquareText,
  Truck,
  Scale,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Clock,
  Sun,
  Moon,
} from 'lucide-react'
import { useAgroControl } from '../context/AgroControlContext'
import { useTheme } from './ThemeProvider'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [colombiaTime, setColombiaTime] = useState('')
  const { theme, setTheme } = useTheme()
  const {
    currentUser,
    isAdmin,
    logout,
    offers,
    routeStops,
    escrowOrders,
    actors,
    alerts,
  } = useAgroControl()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setColombiaTime(
        now.toLocaleTimeString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }
    updateClock()
    const id = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(id)
  }, [])

  const pendingOffersCount = offers.filter((o) => o.status === 'Pendiente Moderar').length
  const pendingEscrowCount = escrowOrders.filter((o) => o.status !== 'Pagado').length
  const blockedActorsCount = actors.filter((a) => a.kycStatus !== 'Vigente').length

  const navItems = [
    {
      to: '/',
      label: 'Mi Finca Hoy',
      shortcut: 'Alt+1',
      icon: Compass,
      badge: alerts.length > 0 ? alerts.length : null,
      badgeTone: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    {
      to: '/ofertas',
      label: 'Cosechas WhatsApp',
      shortcut: 'Alt+2',
      icon: MessageSquareText,
      badge: pendingOffersCount > 0 ? pendingOffersCount : offers.length || null,
      badgeTone:
        pendingOffersCount > 0
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          : 'bg-primary/15 text-primary border-primary/25',
    },
    {
      to: '/despacho',
      label: 'Rutas y Camiones',
      shortcut: 'Alt+3',
      icon: Truck,
      badge: routeStops.length > 0 ? routeStops.length : null,
      badgeTone: 'bg-primary/15 text-primary border-primary/25',
    },
    {
      to: '/pagos',
      label: 'Pagos y Báscula',
      shortcut: 'Alt+4',
      icon: Scale,
      badge: pendingEscrowCount > 0 ? pendingEscrowCount : null,
      badgeTone: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      to: '/actores',
      label: 'Campesinos y Clientes',
      shortcut: 'Alt+5',
      icon: Users,
      badge: blockedActorsCount > 0 ? blockedActorsCount : actors.length || null,
      badgeTone:
        blockedActorsCount > 0
          ? 'bg-red-500/20 text-red-400 border-red-500/30'
          : 'bg-secondary text-muted-foreground border-border',
    },
  ]

  return (
    <aside
      className={`${
        collapsed ? 'w-[74px]' : 'w-64'
      } bg-card border-r border-border flex flex-col justify-between transition-all duration-200 shrink-0 select-none`}
    >
      {/* Top Collapse + Navigation */}
      <div className="p-3 space-y-2 overflow-y-auto">
        <div className="flex items-center justify-between px-2 pb-1">
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Módulos de Campo
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-auto"
            title={collapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all border ${
                    isActive
                      ? 'bg-primary/15 text-primary border-primary/30 shadow-sm'
                      : 'text-muted-foreground border-transparent hover:bg-secondary/70 hover:text-foreground'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="block truncate">{item.label}</span>
                      <span className="block text-[10px] font-mono text-muted-foreground/75">
                        {item.shortcut}
                      </span>
                    </div>
                    {item.badge !== null && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border tabular-nums ${item.badgeTone}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Bottom Theme Switch, Clock & User Profile */}
      <div className="p-3 border-t border-border space-y-2.5">
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center px-2' : 'justify-between px-3'
          } py-2 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border text-xs font-semibold text-foreground transition-colors`}
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-amber-800 shrink-0" />
            )}
            {!collapsed && <span>{theme === 'dark' ? 'Tema Claro' : 'Tema Oscuro'}</span>}
          </span>
          {!collapsed && (
            <span className="text-[10px] font-medium text-muted-foreground">
              {theme === 'dark' ? 'Oscuro' : 'Claro'}
            </span>
          )}
        </button>

        {!collapsed && (
          <div className="px-3 py-2 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Colombia (UTC-5)
            </span>
            <span className="font-mono font-bold text-foreground tabular-nums">{colombiaTime}</span>
          </div>
        )}

        {currentUser && (
          <div className="p-2.5 rounded-2xl bg-secondary/60 border border-border space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 text-primary font-extrabold text-xs flex items-center justify-center shrink-0">
                {currentUser.fullName.slice(0, 2).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">
                    {currentUser.fullName}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                      isAdmin
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-amber-500/15 text-amber-500'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {currentUser.role}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={logout}
              title="Cerrar Sesión"
              className="w-full flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-background/80 hover:bg-destructive/15 hover:text-destructive border border-border text-xs font-semibold text-muted-foreground transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span>Cerrar Sesión</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
