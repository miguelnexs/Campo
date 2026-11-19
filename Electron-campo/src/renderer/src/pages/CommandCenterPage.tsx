import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sprout,
  MessageSquareText,
  Truck,
  Wallet,
  AlertTriangle,
  Users,
  CheckCircle2,
  ArrowUpRight,
  Radio,
  MapPin,
} from 'lucide-react'
import { useAgroControl } from '../context/AgroControlContext'
import { GoogleAgroMap, parseGpsCoords, type AgroMapMarker } from '../components/GoogleAgroMap'

function formatCopCompact(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function CommandCenterPage() {
  const navigate = useNavigate()
  const {
    selectedCorridor,
    corridors,
    offers,
    vehicles,
    routeStops,
    escrowOrders,
    actors,
    alerts,
    resolveAlert,
  } = useAgroControl()

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)

  const matchCorridor = (corridor: string) =>
    selectedCorridor === 'Todos los Corredores' || corridor === selectedCorridor

  const filteredCorridors = useMemo(
    () => corridors.filter((c) => matchCorridor(c.name)),
    [corridors, selectedCorridor]
  )
  const filteredOffers = useMemo(
    () => offers.filter((o) => matchCorridor(o.corridor)),
    [offers, selectedCorridor]
  )
  const filteredVehicles = useMemo(
    () => vehicles.filter((v) => matchCorridor(v.corridor)),
    [vehicles, selectedCorridor]
  )
  const filteredEscrow = useMemo(
    () => escrowOrders.filter((e) => matchCorridor(e.corridor)),
    [escrowOrders, selectedCorridor]
  )
  const filteredAlerts = useMemo(
    () => alerts.filter((a) => matchCorridor(a.corridor)),
    [alerts, selectedCorridor]
  )

  const totalBultos = filteredOffers.reduce((acc, o) => acc + o.bultos, 0)
  const totalKg = filteredOffers.reduce((acc, o) => acc + o.weightKg, 0)
  const pendingOffers = filteredOffers.filter((o) => o.status === 'Pendiente Moderar').length
  const activeVehicles = filteredVehicles.filter((v) => v.currentStatus !== 'Bloqueado Docs').length
  const totalEscrowCop = filteredEscrow.reduce(
    (acc, e) => acc + e.farmerNetCop + e.driverFreightCop + e.platformFeeCop,
    0
  )
  const verifiedActors = actors.filter((a) => a.kycStatus === 'Vigente').length

  const mapMarkers: AgroMapMarker[] = useMemo(() => {
    const farmMarkers: AgroMapMarker[] = filteredOffers.map((o) => {
      const [lat, lng] = parseGpsCoords(o.gpsCoords, 5.36, -73.52)
      return {
        id: o.id,
        lat,
        lng,
        label: `${o.farmName}`,
        sublabel: `${o.vereda}, ${o.municipio} (${o.altitudeMsnm} m)`,
        detail: `${o.bultos} bultos ${o.product} • ${o.status}`,
        type: 'pickup',
      }
    })

    const deliveryMarkers: AgroMapMarker[] = routeStops
      .filter((s) => s.operationType.toLowerCase().includes('entrega'))
      .map((s) => {
        const [lat, lng] = parseGpsCoords(s.gpsCoords, 4.6518, -74.0554)
        return {
          id: s.id,
          lat,
          lng,
          label: s.actorName,
          sublabel: s.locationLabel,
          detail: s.cargoDescription,
          type: 'delivery',
        }
      })

    return [...farmMarkers, ...deliveryMarkers]
  }, [filteredOffers, routeStops])

  const jumpToModule = (target: string) => {
    const lower = target.toLowerCase()
    if (lower.includes('oferta') || lower.includes('whatsapp')) navigate('/ofertas')
    else if (lower.includes('despacho') || lower.includes('ruta')) navigate('/despacho')
    else if (lower.includes('pago') || lower.includes('escrow')) navigate('/pagos')
    else if (lower.includes('actor') || lower.includes('crm')) navigate('/actores')
    else navigate('/')
  }

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            Mi Finca Hoy — Panorama Agro-Logístico
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitoreo en tiempo real de cosechas rurales, camiones Milk-Run y custodia financiera.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-primary/10 border border-primary/25 text-xs font-semibold text-primary self-start">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          Corredor activo: {selectedCorridor}
        </span>
      </div>

      {/* 6 Organic KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Cosecha Hoy</span>
            <Sprout className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2 tabular-nums">
            {totalBultos} <span className="text-xs font-semibold text-muted-foreground">bultos</span>
          </p>
          <p className="text-[11px] text-emerald-500 font-semibold mt-0.5 tabular-nums">
            {(totalKg / 1000).toFixed(1)} toneladas aprox.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/ofertas')}
          className="text-left bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-amber-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Por Moderar</span>
            <MessageSquareText className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2 tabular-nums">
            {pendingOffers}
          </p>
          <p className="text-[11px] text-amber-500 font-semibold mt-0.5">
            De {filteredOffers.length} ofertas totales
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/despacho')}
          className="text-left bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Flota Operativa</span>
            <Truck className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2 tabular-nums">
            {activeVehicles}/{filteredVehicles.length}
          </p>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
            {routeStops.length} paradas en ruta
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/pagos')}
          className="text-left bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-emerald-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Custodia Escrow</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2 tabular-nums">
            {formatCopCompact(totalEscrowCop)}
          </p>
          <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">
            {filteredEscrow.length} órdenes trazadas
          </p>
        </button>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Alertas Activas</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2 tabular-nums">
            {filteredAlerts.length}
          </p>
          <p className="text-[11px] text-red-400 font-semibold mt-0.5">
            {filteredAlerts.filter((a) => a.severity === 'CRITICA').length} críticas en curso
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/actores')}
          className="text-left bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Red Verificada</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2 tabular-nums">
            {verifiedActors}/{actors.length}
          </p>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
            Fincas, camiones y clientes
          </p>
        </button>
      </section>

      {/* Map + Alerts Feed Split */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8">
          <GoogleAgroMap
            markers={mapMarkers}
            showPolyline={false}
            selectedMarkerId={selectedMarkerId}
            onSelectMarker={setSelectedMarkerId}
            heightClass="h-[420px]"
            title="Mapa Vivo de Fincas y Entregas B2B"
          />
        </div>

        {/* Critical Alerts Feed */}
        <div className="xl:col-span-4 bg-card border border-border rounded-2xl p-4 flex flex-col h-[420px]">
          <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Novedades y Alertas de Ruta
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Desvíos GPS, vencimientos SOAT o mermas
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 tabular-nums">
              {filteredAlerts.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
            {filteredAlerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/80" />
                <p className="text-sm font-bold text-foreground">Operación limpia y sin novedades</p>
                <p className="text-xs text-muted-foreground">
                  Todas las alertas críticas de los corredores están atendidas.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isCrit = alert.severity === 'CRITICA'
                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-2xl border space-y-2 transition-colors ${
                      isCrit
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isCrit
                            ? 'bg-red-500/25 text-red-300'
                            : 'bg-amber-500/25 text-amber-300'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{alert.timeAgo}</span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-foreground leading-snug">
                        {alert.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {alert.location}
                        {alert.truckPlate ? ` • Placa ${alert.truckPlate}` : ''}
                      </p>
                      <p className="text-[11px] text-foreground/80 mt-1.5 leading-relaxed">
                        {alert.detail}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => jumpToModule(alert.targetModule)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-background/80 hover:bg-background border border-border text-[11px] font-bold text-foreground transition-colors"
                      >
                        {alert.actionLabel}
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveAlert(alert.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[11px] font-bold transition-colors"
                      >
                        Resolver
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* 7-Column Corridors Monitoring Table */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Estado de Corredores Agro-Logísticos
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Disponibilidad de carga, ocupación de camiones y saldo en custodia por región
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4 font-bold">Corredor</th>
                <th className="py-3 px-4 font-bold">Fincas Activas</th>
                <th className="py-3 px-4 font-bold">Bultos Ofertados</th>
                <th className="py-3 px-4 font-bold">Flota Asignada</th>
                <th className="py-3 px-4 font-bold">Ocupación</th>
                <th className="py-3 px-4 font-bold">ETA y Señal GPS</th>
                <th className="py-3 px-4 font-bold text-right">Custodia Escrow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredCorridors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Sin corredores registrados aún en la base de datos.
                  </td>
                </tr>
              ) : (
                filteredCorridors.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/35 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-foreground">{c.name}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold">
                        {c.regionBadge}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold tabular-nums">{c.activeFarms}</td>
                    <td className="py-3 px-4 font-bold text-emerald-500 tabular-nums">
                      {c.offeredBultos} bultos
                    </td>
                    <td className="py-3 px-4 tabular-nums">
                      {c.assignedTrucks} / {c.totalTrucks} camiones
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, c.occupancyPct)}%` }}
                          />
                        </div>
                        <span className="font-bold tabular-nums">{c.occupancyPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-foreground">{c.etaDeltaText}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.gpsOnlineCount} GPS activos • {c.shadowZoneNote}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-foreground tabular-nums">
                      {formatCopCompact(c.escrowCop)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
