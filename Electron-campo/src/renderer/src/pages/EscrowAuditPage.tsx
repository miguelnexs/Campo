import React, { useMemo, useState } from 'react'
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Plus,
  QrCode,
  Wallet,
  X,
  FileWarning,
  Calculator,
} from 'lucide-react'
import { useAgroControl } from '../context/AgroControlContext'
import type { EscrowOrder } from '../types/agro'

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function EscrowAuditPage() {
  const {
    escrowOrders,
    selectedCorridor,
    isAdmin,
    releaseEscrow,
    recalculateAndReleaseEscrow,
    flagEscrowDispute,
    createEscrowOrder,
  } = useAgroControl()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [disputeNote, setDisputeNote] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const [formState, setFormState] = useState({
    routeId: 'RUT-009',
    corridor: 'Corredor Cundiboyacense → Bogotá',
    farmerName: '',
    farmerWalletMasked: 'Nequi •••• 4412',
    driverName: '',
    driverPlate: 'KLM-842',
    restaurantName: '',
    productSummary: '20 Bultos Papa Pastusa',
    declaredWeightKg: '1000',
    scaleWeightKg: '1000',
    farmerNetCop: '1560000',
    driverFreightCop: '190000',
    platformFeeCop: '124800',
  })

  const filteredOrders = useMemo(
    () =>
      escrowOrders.filter(
        (o) => selectedCorridor === 'Todos los Corredores' || o.corridor === selectedCorridor
      ),
    [escrowOrders, selectedCorridor]
  )

  const selectedOrder: EscrowOrder | null = useMemo(
    () => filteredOrders.find((o) => o.id === selectedId) ?? filteredOrders[0] ?? null,
    [filteredOrders, selectedId]
  )

  const totals = useMemo(() => {
    let totalCustodia = 0
    let readyCount = 0
    let disputeCount = 0
    let paidCop = 0
    for (const o of filteredOrders) {
      const sum = o.farmerNetCop + o.driverFreightCop + o.platformFeeCop
      totalCustodia += sum
      if (o.status === 'Listo para Liberar') readyCount += 1
      if (o.status === 'Disputa por Merma') disputeCount += 1
      if (o.status === 'Pagado') paidCop += sum
    }
    return { totalCustodia, readyCount, disputeCount, paidCop }
  }, [filteredOrders])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createEscrowOrder({
      ...formState,
      declaredWeightKg: parseInt(formState.declaredWeightKg, 10) || 1000,
      scaleWeightKg: parseInt(formState.scaleWeightKg, 10) || 1000,
      farmerNetCop: parseInt(formState.farmerNetCop, 10) || 1500000,
      driverFreightCop: parseInt(formState.driverFreightCop, 10) || 190000,
      platformFeeCop: parseInt(formState.platformFeeCop, 10) || 120000,
    })
    setModalOpen(false)
    setFormState((prev) => ({ ...prev, farmerName: '', driverName: '', restaurantName: '' }))
  }

  const diffKg = selectedOrder ? selectedOrder.scaleWeightKg - selectedOrder.declaredWeightKg : 0
  const mermaPct = selectedOrder
    ? Math.abs(diffKg / Math.max(1, selectedOrder.declaredWeightKg)) * 100
    : 0

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Pagos y Báscula — Auditoría Escrow (Nequi / Daviplata)
          </h1>
          <p className="text-xs text-muted-foreground">
            Cruce forense de peso declarado vs báscula de entrega, validación QR y dispersión directa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden Escrow
        </button>
      </div>

      {/* Role Warning Banner for Non-Admin */}
      {!isAdmin && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/35 text-amber-400 text-xs font-semibold flex items-center gap-2.5">
          <Lock className="w-4 h-4 shrink-0" />
          Modo Lectura Financiera: Tu rol (Operador de Despacho) puede auditar básculas y QR, pero solo el Administrador puede liberar o recalcular pagos Escrow.
        </div>
      )}

      {/* Financial Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-card border border-border rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-muted-foreground">Volumen Total Escrow</span>
          <p className="text-xl font-extrabold text-foreground mt-1 tabular-nums">
            {formatCop(totals.totalCustodia)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-muted-foreground">Listas para Liberar</span>
          <p className="text-xl font-extrabold text-emerald-500 mt-1 tabular-nums">
            {totals.readyCount} órdenes
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-muted-foreground">En Disputa / Merma</span>
          <p className="text-xl font-extrabold text-red-400 mt-1 tabular-nums">
            {totals.disputeCount} órdenes
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-muted-foreground">Dispersado a Billeteras</span>
          <p className="text-xl font-extrabold text-primary mt-1 tabular-nums">
            {formatCop(totals.paidCop)}
          </p>
        </div>
      </div>

      {/* Split: 10-Column Table + Forensic Comparator Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-8 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/45 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-3 font-bold">Orden / Ruta</th>
                  <th className="py-3 px-3 font-bold">Campesino</th>
                  <th className="py-3 px-3 font-bold">Transportador</th>
                  <th className="py-3 px-3 font-bold">Restaurante / Destino</th>
                  <th className="py-3 px-3 font-bold">Carga y Pago</th>
                  <th className="py-3 px-3 font-bold">Declarado</th>
                  <th className="py-3 px-3 font-bold">Báscula</th>
                  <th className="py-3 px-3 font-bold">QR</th>
                  <th className="py-3 px-3 font-bold">Neto Finca</th>
                  <th className="py-3 px-3 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      No hay órdenes de custodia registradas.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const isSelected = selectedOrder?.id === ord.id
                    const delta = ord.scaleWeightKg - ord.declaredWeightKg
                    const statusBadge =
                      ord.status === 'Pagado'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : ord.status === 'Disputa por Merma'
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : ord.status === 'Listo para Liberar'
                            ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedId(ord.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/12' : 'hover:bg-secondary/35'
                        }`}
                      >
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold block text-foreground">{ord.id}</span>
                          <span className="text-[10px] text-muted-foreground">{ord.routeId}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold block text-foreground">
                            {ord.farmerName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {ord.farmerWalletMasked}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-semibold block">{ord.driverName}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {ord.driverPlate}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-[180px]">
                          <span className="font-semibold block text-foreground truncate" title={ord.restaurantName}>
                            {ord.restaurantName}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-[180px]">
                          <span className="text-[11px] block truncate" title={ord.productSummary}>
                            {ord.productSummary}
                          </span>
                        </td>
                        <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                          {ord.declaredWeightKg} kg
                        </td>
                        <td
                          className={`py-3 px-3 font-bold tabular-nums whitespace-nowrap ${
                            delta < -20 ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {ord.scaleWeightKg} kg
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-[11px]">{ord.qrStatus}</td>
                        <td className="py-3 px-3 font-bold tabular-nums whitespace-nowrap text-emerald-500">
                          {formatCop(ord.farmerNetCop)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBadge}`}
                          >
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Forensic Comparator Panel */}
        <div className="xl:col-span-4 bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          {!selectedOrder ? (
            <p className="py-12 text-center text-xs text-muted-foreground">
              Selecciona una orden Escrow para revisar báscula y liberar pagos.
            </p>
          ) : (
            <>
              <div className="pb-3 border-b border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">
                    {selectedOrder.id} • {selectedOrder.routeId}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <QrCode className="w-3.5 h-3.5" />
                    {selectedOrder.qrStatus}
                  </span>
                </div>
                <h2 className="text-sm font-extrabold text-foreground">
                  {selectedOrder.restaurantName}
                </h2>
                <p className="text-xs text-muted-foreground">{selectedOrder.productSummary}</p>
              </div>

              {/* Scale Weight Comparator */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
                  <span className="text-[10px] font-semibold text-muted-foreground block">
                    Peso Declarado Finca
                  </span>
                  <span className="text-lg font-extrabold text-foreground tabular-nums">
                    {selectedOrder.declaredWeightKg} kg
                  </span>
                </div>
                <div
                  className={`p-3 rounded-2xl border ${
                    mermaPct > 3
                      ? 'bg-red-500/10 border-red-500/35'
                      : 'bg-emerald-500/10 border-emerald-500/35'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground block">
                    Peso Real Báscula
                  </span>
                  <span
                    className={`text-lg font-extrabold tabular-nums ${
                      mermaPct > 3 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedOrder.scaleWeightKg} kg
                  </span>
                </div>
              </div>

              {mermaPct > 3 && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Diferencia detectada de <strong>{diffKg} kg ({mermaPct.toFixed(1)}%)</strong>.
                    Se recomienda recalcular el pago neto según peso real en báscula.
                  </span>
                </div>
              )}

              {/* Split Disbursement Breakdown */}
              <div className="p-3.5 rounded-2xl bg-secondary/45 border border-border space-y-2 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  Dispersión Automática
                </p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Campesino ({selectedOrder.farmerWalletMasked})
                  </span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {formatCop(selectedOrder.farmerNetCop)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Flete ({selectedOrder.driverWalletMasked})
                  </span>
                  <span className="font-bold text-foreground tabular-nums">
                    {formatCop(selectedOrder.driverFreightCop)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comisión Campo Vivo</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {formatCop(selectedOrder.platformFeeCop)}
                  </span>
                </div>
              </div>

              {selectedOrder.txHash && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-xs text-emerald-400 flex items-center gap-2 font-mono font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Comprobante: {selectedOrder.txHash}
                </div>
              )}

              {selectedOrder.disputeReason && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                  <strong>Nota de auditoría:</strong> {selectedOrder.disputeReason}
                </div>
              )}

              {/* Financial Action Buttons (Admin-locked) */}
              {selectedOrder.status !== 'Pagado' && (
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => releaseEscrow(selectedOrder.id)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-45 disabled:cursor-not-allowed text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isAdmin ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    Liberar Pago Completo (Nequi / Daviplata)
                  </button>

                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => recalculateAndReleaseEscrow(selectedOrder.id)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-45 disabled:cursor-not-allowed border border-emerald-500/35 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    Recalcular por Báscula y Pagar
                  </button>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={disputeNote}
                      onChange={(e) => setDisputeNote(e.target.value)}
                      placeholder="Motivo de disputa..."
                      className="flex-1 px-3 py-2 rounded-xl bg-secondary/70 border border-border text-xs disabled:opacity-50"
                    />
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => {
                        flagEscrowDispute(
                          selectedOrder.id,
                          disputeNote.trim() || 'Bloqueado por diferencia en báscula.'
                        )
                        setDisputeNote('')
                      }}
                      className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 disabled:opacity-45 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1"
                    >
                      <FileWarning className="w-3.5 h-3.5" />
                      Disputa
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Escrow Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground">
                Nueva Orden de Custodia Escrow
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Campesino *</span>
                  <input
                    required
                    value={formState.farmerName}
                    onChange={(e) => setFormState({ ...formState, farmerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Restaurante *</span>
                  <input
                    required
                    value={formState.restaurantName}
                    onChange={(e) =>
                      setFormState({ ...formState, restaurantName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Conductor *</span>
                  <input
                    required
                    value={formState.driverName}
                    onChange={(e) => setFormState({ ...formState, driverName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Producto y Bultos</span>
                  <input
                    value={formState.productSummary}
                    onChange={(e) =>
                      setFormState({ ...formState, productSummary: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Peso Declarado (kg)</span>
                  <input
                    type="number"
                    value={formState.declaredWeightKg}
                    onChange={(e) =>
                      setFormState({ ...formState, declaredWeightKg: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Peso en Báscula (kg)</span>
                  <input
                    type="number"
                    value={formState.scaleWeightKg}
                    onChange={(e) =>
                      setFormState({ ...formState, scaleWeightKg: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Neto Campesino (COP)</span>
                  <input
                    type="number"
                    value={formState.farmerNetCop}
                    onChange={(e) => setFormState({ ...formState, farmerNetCop: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Flete Conductor (COP)</span>
                  <input
                    type="number"
                    value={formState.driverFreightCop}
                    onChange={(e) =>
                      setFormState({ ...formState, driverFreightCop: e.target.value })
                    }
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
                  Crear Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
