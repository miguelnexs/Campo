import React, { useMemo, useState } from 'react'
import {
  Truck,
  MapPin,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Send,
  Weight,
  Clock,
  Mountain,
  Store,
  Sprout,
  X,
  Route,
  CheckCircle2,
} from 'lucide-react'
import { useAgroControl } from '../context/AgroControlContext'
import { GoogleAgroMap, parseGpsCoords, type AgroMapMarker } from '../components/GoogleAgroMap'

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function DispatchRoutesPage() {
  const {
    vehicles,
    routeStops,
    selectedCorridor,
    moveRouteStop,
    dispatchVehicle,
    createVehicle,
  } = useAgroControl()

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) => selectedCorridor === 'Todos los Corredores' || v.corridor === selectedCorridor
      ),
    [vehicles, selectedCorridor]
  )

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [highlightedStopId, setHighlightedStopId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [vehForm, setVehForm] = useState({
    plate: '',
    type: 'Turbo 4x4 Estacas',
    traction: '4x4',
    capacityKg: '4500',
    capacityM3: '18',
    driverName: '',
    driverPhone: '+57 312 ',
    driverWallet: 'Daviplata •••• 4820',
    soatDaysLeft: '240',
    tecnoDaysLeft: '190',
    corridor: 'Corredor Cundiboyacense → Bogotá',
    freightCostCop: '480000',
  })

  const activeVehicle = useMemo(
    () =>
      filteredVehicles.find((v) => v.id === selectedVehicleId) ?? filteredVehicles[0] ?? null,
    [filteredVehicles, selectedVehicleId]
  )

  const sortedStops = useMemo(
    () => [...routeStops].sort((a, b) => a.order - b.order),
    [routeStops]
  )

  const routeNeeds4x4 = sortedStops.some((s) => s.requires4x4)
  const peakLoadKg = sortedStops.reduce((max, s) => Math.max(max, s.cumulativeWeightKg), 0)

  const docsBlocked =
    activeVehicle !== null &&
    (activeVehicle.soatStatus === 'Vencido' || activeVehicle.tecnoStatus === 'Vencido')
  const tractionMismatch =
    activeVehicle !== null && routeNeeds4x4 && activeVehicle.traction.toLowerCase() !== '4x4'
  const overweight =
    activeVehicle !== null && peakLoadKg > activeVehicle.capacityKg

  const canDispatch =
    activeVehicle !== null && !docsBlocked && !tractionMismatch && !overweight

  const loadPct = activeVehicle
    ? Math.min(100, Math.round((peakLoadKg / Math.max(1, activeVehicle.capacityKg)) * 100))
    : 0

  const mapMarkers: AgroMapMarker[] = useMemo(() => {
    return sortedStops.map((stop) => {
      const isDelivery = stop.operationType.toLowerCase().includes('entrega')
      const [lat, lng] = parseGpsCoords(
        stop.gpsCoords,
        isDelivery ? 4.6518 : 5.36,
        isDelivery ? -74.0554 : -73.52
      )
      return {
        id: stop.id,
        lat,
        lng,
        label: stop.actorName,
        sublabel: stop.locationLabel,
        detail: `${stop.cargoDescription} (${stop.timeWindow})`,
        type: isDelivery ? 'delivery' : 'pickup',
        orderNumber: stop.order,
      }
    })
  }, [sortedStops])

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    await createVehicle({
      ...vehForm,
      capacityKg: parseInt(vehForm.capacityKg, 10) || 4500,
      capacityM3: parseFloat(vehForm.capacityM3) || 18,
      soatDaysLeft: parseInt(vehForm.soatDaysLeft, 10) || 180,
      tecnoDaysLeft: parseInt(vehForm.tecnoDaysLeft, 10) || 180,
      freightCostCop: parseInt(vehForm.freightCostCop, 10) || 480000,
    })
    setModalOpen(false)
    setVehForm((prev) => ({ ...prev, plate: '', driverName: '' }))
  }

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Rutas Milk-Run y Flota Rural
          </h1>
          <p className="text-xs text-muted-foreground">
            Trazado vial real OSRM, validación automática SOAT/4x4 y secuencia interactiva paso a paso.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo Camión
        </button>
      </div>

      {/* Organic Split Workspace: Map + Fleet (Left 7 cols) | Visual Timeline (Right 5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: Real Road Map + Fleet Cards & Dispatch Control */}
        <div className="xl:col-span-7 space-y-4">
          <GoogleAgroMap
            markers={mapMarkers}
            showPolyline={true}
            selectedMarkerId={highlightedStopId}
            onSelectMarker={setHighlightedStopId}
            heightClass="h-[430px]"
            title="Ruta Vial Milk-Run en Vivo (Esri + OSRM)"
          />

          {/* Fleet Selector Strip */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  Flota Disponible en Corredor
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Selecciona un camión para validar capacidad, tracción 4x4 y documentación RUNT
                </p>
              </div>
              {routeNeeds4x4 && (
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold flex items-center gap-1">
                  <Mountain className="w-3.5 h-3.5" />
                  Ruta exige 4x4
                </span>
              )}
            </div>

            {filteredVehicles.length === 0 ? (
              <div className="py-8 text-center space-y-2.5 border border-dashed border-border rounded-2xl">
                <p className="text-xs text-muted-foreground">
                  No hay camiones registrados en este corredor aún.
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar Primer Camión
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredVehicles.map((veh) => {
                  const selected = activeVehicle?.id === veh.id
                  const isBlocked = veh.soatStatus === 'Vencido' || veh.tecnoStatus === 'Vencido'
                  return (
                    <button
                      key={veh.id}
                      type="button"
                      onClick={() => setSelectedVehicleId(veh.id)}
                      className={`text-left p-3.5 rounded-2xl border transition-all space-y-2 ${
                        selected
                          ? 'bg-primary/12 border-primary shadow-sm'
                          : 'bg-secondary/40 border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-extrabold text-sm text-foreground">
                          {veh.plate}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isBlocked
                              ? 'bg-red-500/20 text-red-400'
                              : veh.currentStatus === 'En Ruta Milk-Run'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {veh.currentStatus}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground space-y-0.5">
                        <p className="font-semibold text-foreground/90">
                          {veh.type} • Tracción {veh.traction}
                        </p>
                        <p>
                          Cond: {veh.driverName} • Cap: {veh.capacityKg.toLocaleString()} kg
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] font-bold">
                        <span
                          className={
                            veh.soatStatus === 'Vencido' ? 'text-red-400' : 'text-emerald-400'
                          }
                        >
                          SOAT: {veh.soatStatus} ({veh.soatDaysLeft}d)
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          Flete {formatCop(veh.freightCostCop)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Compliance Check & Dispatch Action */}
            {activeVehicle && (
              <div className="pt-3 border-t border-border space-y-3">
                {/* Load Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Weight className="w-3.5 h-3.5 text-primary" />
                      Carga Pico en Ruta ({activeVehicle.plate})
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        overweight ? 'text-red-400' : 'text-foreground'
                      }`}
                    >
                      {peakLoadKg.toLocaleString()} / {activeVehicle.capacityKg.toLocaleString()} kg ({loadPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        overweight ? 'bg-red-500' : loadPct > 85 ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${loadPct}%` }}
                    />
                  </div>
                </div>

                {/* Warnings if blocked */}
                {(docsBlocked || tractionMismatch || overweight) && (
                  <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      Bloqueo de Seguridad Operativa
                    </p>
                    {docsBlocked && (
                      <p>• SOAT o Tecnomecánica vencidos. Valida RUNT en el módulo de Actores.</p>
                    )}
                    {tractionMismatch && (
                      <p>
                        • Una finca de la ruta exige vehículo <strong>4x4</strong> y este camión es{' '}
                        {activeVehicle.traction}.
                      </p>
                    )}
                    {overweight && (
                      <p>• La carga supera la capacidad máxima en kg del vehículo.</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Billetera conductor: <strong className="text-foreground">{activeVehicle.driverWallet}</strong>
                  </div>
                  <button
                    type="button"
                    disabled={!canDispatch}
                    onClick={() => dispatchVehicle(activeVehicle.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-45 disabled:cursor-not-allowed text-primary-foreground text-xs font-bold shadow-sm transition-all"
                  >
                    {activeVehicle.currentStatus === 'En Ruta Milk-Run' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Ya en Ruta Milk-Run
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Despachar Camión {activeVehicle.plate}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Intuitive Step-by-Step Visual Timeline */}
        <div className="xl:col-span-5 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Itinerario Paso a Paso ({sortedStops.length} paradas)
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Haz clic en cualquier parada para enfocarla en el mapa o reordena con las flechas
              </p>
            </div>
          </div>

          {sortedStops.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-xs text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto opacity-40" />
              <p>Aún no hay paradas en esta ruta.</p>
              <p>Agrega cosechas desde WhatsApp o recibe un pedido desde el Catálogo Web.</p>
            </div>
          ) : (
            <div className="relative space-y-3 max-h-[680px] overflow-y-auto pr-1">
              {/* Vertical timeline rail */}
              <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border pointer-events-none" />

              {sortedStops.map((stop, idx) => {
                const isDelivery = stop.operationType.toLowerCase().includes('entrega')
                const isSelected = highlightedStopId === stop.id

                return (
                  <div
                    key={stop.id}
                    onClick={() => setHighlightedStopId(stop.id)}
                    className={`relative pl-12 pr-3.5 py-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/12 border-primary shadow-md'
                        : 'bg-secondary/35 border-border hover:border-primary/40 hover:bg-secondary/55'
                    }`}
                  >
                    {/* Numbered Node Dot */}
                    <div
                      className={`absolute left-2.5 top-4 w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-xs font-extrabold text-white shadow ${
                        isDelivery ? 'bg-amber-600' : 'bg-emerald-600'
                      }`}
                    >
                      {stop.order}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isDelivery
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {isDelivery ? (
                              <Store className="w-3 h-3" />
                            ) : (
                              <Sprout className="w-3 h-3" />
                            )}
                            {isDelivery ? 'Entrega Restaurante' : 'Recolección Finca'}
                          </span>

                          {stop.requires4x4 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold">
                              Solo 4x4
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-extrabold text-foreground leading-snug">
                          {stop.actorName}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          {stop.locationLabel}
                        </p>
                        <p className="text-[11px] font-semibold text-foreground/90 pt-0.5">
                          {stop.cargoDescription}
                        </p>
                      </div>

                      {/* Reorder Controls */}
                      <div
                        className="flex flex-col gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveRouteStop(stop.id, 'up')}
                          title="Subir parada"
                          className="p-1 rounded-lg bg-background/80 hover:bg-primary hover:text-primary-foreground border border-border disabled:opacity-30 transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === sortedStops.length - 1}
                          onClick={() => moveRouteStop(stop.id, 'down')}
                          title="Bajar parada"
                          className="p-1 rounded-lg bg-background/80 hover:bg-primary hover:text-primary-foreground border border-border disabled:opacity-30 transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Footer telemetry strip */}
                    <div className="mt-2.5 pt-2 border-t border-border/70 flex flex-wrap items-center justify-between gap-2 text-[10px] tabular-nums">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3 text-primary" />
                        {stop.timeWindow} • ETA {stop.eta}
                      </span>
                      <div className="flex items-center gap-2 font-bold">
                        <span
                          className={
                            stop.deltaWeightKg >= 0 ? 'text-emerald-400' : 'text-amber-400'
                          }
                        >
                          {stop.deltaWeightKg >= 0 ? '+' : ''}
                          {stop.deltaWeightKg} kg
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-background border border-border text-foreground">
                          Acum: {stop.cumulativeWeightKg} kg
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Vehicle Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground">Registrar Nuevo Camión</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateVehicle} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Placa *</span>
                  <input
                    required
                    value={vehForm.plate}
                    onChange={(e) => setVehForm({ ...vehForm, plate: e.target.value })}
                    placeholder="Ej. WXZ-904"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border uppercase"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Conductor *</span>
                  <input
                    required
                    value={vehForm.driverName}
                    onChange={(e) => setVehForm({ ...vehForm, driverName: e.target.value })}
                    placeholder="Ej. Carlos Méndez"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Tipo de Vehículo</span>
                  <input
                    value={vehForm.type}
                    onChange={(e) => setVehForm({ ...vehForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Tracción</span>
                  <select
                    value={vehForm.traction}
                    onChange={(e) => setVehForm({ ...vehForm, traction: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  >
                    <option value="4x4">4x4 (Trocha Rural)</option>
                    <option value="4x2">4x2 (Carretera)</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Capacidad (kg)</span>
                  <input
                    type="number"
                    value={vehForm.capacityKg}
                    onChange={(e) => setVehForm({ ...vehForm, capacityKg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Flete Base (COP)</span>
                  <input
                    type="number"
                    step={10000}
                    value={vehForm.freightCostCop}
                    onChange={(e) => setVehForm({ ...vehForm, freightCostCop: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Días vigentes SOAT</span>
                  <input
                    type="number"
                    value={vehForm.soatDaysLeft}
                    onChange={(e) => setVehForm({ ...vehForm, soatDaysLeft: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Días vigentes Tecno</span>
                  <input
                    type="number"
                    value={vehForm.tecnoDaysLeft}
                    onChange={(e) => setVehForm({ ...vehForm, tecnoDaysLeft: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Guardar Camión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
