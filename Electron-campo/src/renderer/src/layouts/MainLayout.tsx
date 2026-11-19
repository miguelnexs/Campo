import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  Compass,
  MessageSquareText,
  Truck,
  Scale,
  Users,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
} from 'lucide-react'
import { TitleBar } from '../components/TitleBar'
import { Sidebar } from '../components/Sidebar'
import { useAgroControl } from '../context/AgroControlContext'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    banner,
    backendConnected,
    lastSyncedAt,
    offers,
    vehicles,
    actors,
    escrowOrders,
  } = useAgroControl()

  const [query, setQuery] = useState('')

  // Global keyboard shortcuts: Alt+1..5 and Ctrl+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
        return
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false)
        return
      }
      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault()
          navigate('/')
        } else if (e.key === '2') {
          e.preventDefault()
          navigate('/ofertas')
        } else if (e.key === '3') {
          e.preventDefault()
          navigate('/despacho')
        } else if (e.key === '4') {
          e.preventDefault()
          navigate('/pagos')
        } else if (e.key === '5') {
          e.preventDefault()
          navigate('/actores')
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen, navigate])

  const paletteResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    const quickModules = [
      { label: 'Mi Finca Hoy (Centro de Mando)', sub: 'Alt+1', route: '/', icon: Compass },
      { label: 'Cosechas WhatsApp (Moderación)', sub: 'Alt+2', route: '/ofertas', icon: MessageSquareText },
      { label: 'Rutas y Camiones (Despacho Milk-Run)', sub: 'Alt+3', route: '/despacho', icon: Truck },
      { label: 'Pagos y Báscula (Auditoría Escrow)', sub: 'Alt+4', route: '/pagos', icon: Scale },
      { label: 'Campesinos y Clientes (Directorio CRM)', sub: 'Alt+5', route: '/actores', icon: Users },
    ]

    if (!q) return quickModules

    const items: Array<{ label: string; sub: string; route: string; icon: typeof Compass }> = []
    quickModules.forEach((m) => {
      if (m.label.toLowerCase().includes(q)) items.push(m)
    })
    offers.forEach((o) => {
      if (
        o.product.toLowerCase().includes(q) ||
        o.farmerName.toLowerCase().includes(q) ||
        o.farmName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      ) {
        items.push({
          label: `${o.id} • ${o.product} (${o.bultos} bultos)`,
          sub: `${o.farmName} — ${o.farmerName}`,
          route: '/ofertas',
          icon: MessageSquareText,
        })
      }
    })
    vehicles.forEach((v) => {
      if (v.plate.toLowerCase().includes(q) || v.driverName.toLowerCase().includes(q)) {
        items.push({
          label: `Camión ${v.plate} (${v.type})`,
          sub: `Conductor: ${v.driverName} • ${v.currentStatus}`,
          route: '/despacho',
          icon: Truck,
        })
      }
    })
    escrowOrders.forEach((e) => {
      if (
        e.id.toLowerCase().includes(q) ||
        e.restaurantName.toLowerCase().includes(q) ||
        e.farmerName.toLowerCase().includes(q)
      ) {
        items.push({
          label: `${e.id} • ${e.restaurantName}`,
          sub: `${e.productSummary} — ${e.status}`,
          route: '/pagos',
          icon: Scale,
        })
      }
    })
    actors.forEach((a) => {
      if (a.name.toLowerCase().includes(q) || a.docId.toLowerCase().includes(q)) {
        items.push({
          label: `${a.name} (${a.role})`,
          sub: `${a.docId} • ${a.locationDetails}`,
          route: '/actores',
          icon: Users,
        })
      }
    })

    return items.slice(0, 12)
  }, [query, offers, vehicles, escrowOrders, actors])

  const BannerIcon =
    banner?.tone === 'success'
      ? CheckCircle2
      : banner?.tone === 'warning'
        ? AlertTriangle
        : banner?.tone === 'error'
          ? XCircle
          : Info

  const bannerColors =
    banner?.tone === 'success'
      ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-400'
      : banner?.tone === 'warning'
        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
        : banner?.tone === 'error'
          ? 'bg-red-500/15 border-red-500/40 text-red-400'
          : 'bg-primary/15 border-primary/40 text-primary'

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
      <TitleBar />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
          {/* Action Toast Banner */}
          {banner && (
            <div className="px-5 pt-3 shrink-0">
              <div
                className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold shadow-sm ${bannerColors}`}
              >
                <BannerIcon className="w-4 h-4 shrink-0" />
                <span>{banner.text}</span>
              </div>
            </div>
          )}

          {/* Main Scrollable Page Viewport */}
          <main className="flex-1 overflow-y-auto p-5">{children}</main>

          {/* Bottom Telemetry Status Bar */}
          <footer className="h-7 px-4 bg-card border-t border-border flex items-center justify-between text-[11px] text-muted-foreground shrink-0 select-none">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <Database className="w-3 h-3" />
                Django API (:8001) {backendConnected ? 'Conectado' : 'Reconectando...'}
              </span>
              {lastSyncedAt && (
                <span className="hidden sm:inline font-mono text-[10px] opacity-80">
                  Última sync: {lastSyncedAt}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span>PostgreSQL 16 (:5438)</span>
              <span className="hidden md:inline">• Atajos: Alt+1..5 | Ctrl+K</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Command Palette Modal (Ctrl+K) */}
      {commandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-primary" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar módulo, campesino, placa, restaurante u orden..."
                className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {paletteResults.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No se encontraron coincidencias para "{query}"
                </p>
              ) : (
                paletteResults.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={`${item.label}-${idx}`}
                      type="button"
                      onClick={() => {
                        navigate(item.route)
                        setCommandPaletteOpen(false)
                        setQuery('')
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary text-left transition-colors"
                    >
                      <div className="p-2 rounded-xl bg-primary/15 text-primary shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.sub}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
