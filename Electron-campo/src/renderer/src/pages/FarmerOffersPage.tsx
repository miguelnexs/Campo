import React, { useEffect, useMemo, useState } from 'react'
import {
  MessageSquareText,
  CheckCircle2,
  Camera,
  Truck,
  Plus,
  Play,
  Pause,
  MapPin,
  Lock,
  Sparkles,
  X,
  ShieldCheck,
  Save,
} from 'lucide-react'
import { useAgroControl } from '../context/AgroControlContext'
import type { FarmerOffer } from '../types/agro'

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function FarmerOffersPage() {
  const {
    offers,
    selectedCorridor,
    isAdmin,
    approveOffer,
    requestOfferPhoto,
    updateOfferDraft,
    addOfferToRoute,
    createOffer,
  } = useAgroControl()

  const [statusFilter, setStatusFilter] = useState<string>('Todas')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState(false)

  // Draft editing state inside drawer
  const [draftQuality, setDraftQuality] = useState<string>('Primera')
  const [draftPrice, setDraftPrice] = useState<number>(80000)

  // Modal Create Offer
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [formState, setFormState] = useState({
    farmerName: '',
    farmerPhone: '+57 310 ',
    farmName: '',
    vereda: '',
    municipio: 'Ventaquemada, Boyacá',
    corridor: 'Corredor Cundiboyacense → Bogotá',
    altitudeMsnm: '2680',
    gpsCoords: '5.3680° N, 73.5210° W',
    roadAccess: 'Entra Turbo',
    product: 'Papa Pastusa',
    bultos: '25',
    validatedQuality: 'Primera',
    pricePerBultoCop: '78000',
    marketRefPriceCop: '95000',
    pickupWindow: 'Hoy 07:00 – 10:30 AM',
  })

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const okCorridor =
        selectedCorridor === 'Todos los Corredores' || o.corridor === selectedCorridor
      const okStatus = statusFilter === 'Todas' || o.status === statusFilter
      return okCorridor && okStatus
    })
  }, [offers, selectedCorridor, statusFilter])

  const selectedOffer: FarmerOffer | null = useMemo(
    () => filteredOffers.find((o) => o.id === selectedId) ?? filteredOffers[0] ?? null,
    [filteredOffers, selectedId]
  )

  useEffect(() => {
    if (selectedOffer) {
      setDraftQuality(selectedOffer.validatedQuality)
      setDraftPrice(selectedOffer.pricePerBultoCop)
      setPlayingAudio(false)
    }
  }, [selectedOffer?.id, selectedOffer?.validatedQuality, selectedOffer?.pricePerBultoCop])

  // Keyboard shortcuts while inspecting an offer (Space play audio, 1/2/3 quality, A approve, R photo)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || createModalOpen) return
      if (!selectedOffer) return

      if (e.code === 'Space') {
        e.preventDefault()
        setPlayingAudio((p) => !p)
      } else if (e.key === '1') {
        setDraftQuality('Extra')
      } else if (e.key === '2') {
        setDraftQuality('Primera')
      } else if (e.key === '3') {
        setDraftQuality('Segunda')
      } else if (e.key.toLowerCase() === 'a') {
        approveOffer(selectedOffer.id, draftQuality, isAdmin ? draftPrice : selectedOffer.pricePerBultoCop)
      } else if (e.key.toLowerCase() === 'r') {
        requestOfferPhoto(selectedOffer.id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedOffer, draftQuality, draftPrice, isAdmin, createModalOpen, approveOffer, requestOfferPhoto])

  const handleBulkApprove = async () => {
    const pendings = filteredOffers.filter((o) => o.status === 'Pendiente Moderar')
    for (const o of pendings) {
      await approveOffer(o.id, o.validatedQuality, o.pricePerBultoCop)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const bultosNum = parseInt(formState.bultos, 10) || 10
    await createOffer({
      ...formState,
      bultos: bultosNum,
      weightKg: bultosNum * 50,
      altitudeMsnm: parseInt(formState.altitudeMsnm, 10) || 2600,
      pricePerBultoCop: parseInt(formState.pricePerBultoCop, 10) || 78000,
      marketRefPriceCop: parseInt(formState.marketRefPriceCop, 10) || 95000,
    })
    setCreateModalOpen(false)
    setFormState((prev) => ({ ...prev, farmerName: '', farmName: '', vereda: '' }))
  }

  const pendingCount = filteredOffers.filter((o) => o.status === 'Pendiente Moderar').length

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-primary" />
            Cosechas WhatsApp — Moderación Multimodal
          </h1>
          <p className="text-xs text-muted-foreground">
            Atajos: <kbd className="px-1 rounded bg-secondary">Espacio</kbd> audio •{' '}
            <kbd className="px-1 rounded bg-secondary">1/2/3</kbd> calidad •{' '}
            <kbd className="px-1 rounded bg-secondary">A</kbd> publicar en catálogo •{' '}
            <kbd className="px-1 rounded bg-secondary">R</kbd> pedir foto
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleBulkApprove}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/35 text-emerald-400 text-xs font-bold transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aprobar Pendientes ({pendingCount})
            </button>
          )}
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar Cosecha
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {['Todas', 'Pendiente Moderar', 'Publicada en Catálogo', 'Asignada a Ruta', 'Foto Solicitada'].map(
          (st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                statusFilter === st
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {st}
            </button>
          )
        )}
      </div>

      {/* Main Split: 10-column Table + Multimodal Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-8 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/45 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-3 font-bold">ID / Hora</th>
                  <th className="py-3 px-3 font-bold">Productor</th>
                  <th className="py-3 px-3 font-bold">Finca / Vereda</th>
                  <th className="py-3 px-3 font-bold">Producto</th>
                  <th className="py-3 px-3 font-bold">Volumen</th>
                  <th className="py-3 px-3 font-bold">Calidad</th>
                  <th className="py-3 px-3 font-bold">Precio Finca</th>
                  <th className="py-3 px-3 font-bold">Acceso Vial</th>
                  <th className="py-3 px-3 font-bold">Ventana</th>
                  <th className="py-3 px-3 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      No hay cosechas en esta vista. Usa "+ Registrar Cosecha" para agregar una.
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map((offer) => {
                    const isSelected = selectedOffer?.id === offer.id
                    const statusStyle =
                      offer.status === 'Publicada en Catálogo'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : offer.status === 'Asignada a Ruta'
                          ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                          : offer.status === 'Foto Solicitada'
                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'

                    return (
                      <tr
                        key={offer.id}
                        onClick={() => setSelectedId(offer.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/12' : 'hover:bg-secondary/35'
                        }`}
                      >
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-foreground block">
                            {offer.id}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {offer.receivedAt}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-foreground block">
                            {offer.farmerName}
                          </span>
                          <span className="text-[10px] text-amber-400">
                            ★ {offer.farmerScore.toFixed(1)} ({offer.complianceRate}%)
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-foreground block">
                            {offer.farmName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {offer.vereda}, {offer.municipio}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-foreground">{offer.product}</td>
                        <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                          <span className="font-bold block">{offer.bultos} bultos</span>
                          <span className="text-[10px] text-muted-foreground">
                            {offer.weightKg} kg
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold">{offer.validatedQuality}</td>
                        <td className="py-3 px-3 font-bold text-emerald-500 tabular-nums whitespace-nowrap">
                          {formatCop(offer.pricePerBultoCop)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              offer.roadAccess === 'Solo 4x4'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {offer.roadAccess}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-muted-foreground whitespace-nowrap">
                          {offer.pickupWindow}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusStyle}`}
                          >
                            {offer.status}
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

        {/* Multimodal Inspector Panel */}
        <div className="xl:col-span-4 bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          {!selectedOffer ? (
            <p className="py-12 text-center text-xs text-muted-foreground">
              Selecciona una cosecha de la tabla para auditar audio, fotos y publicar.
            </p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-border">
                <div>
                  <span className="text-[10px] font-mono font-bold text-primary">
                    {selectedOffer.id} • {selectedOffer.corridor}
                  </span>
                  <h2 className="text-base font-extrabold text-foreground">
                    {selectedOffer.product} — {selectedOffer.bultos} bultos
                  </h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {selectedOffer.farmName}, {selectedOffer.vereda} ({selectedOffer.altitudeMsnm} m)
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {selectedOffer.exifVerified ? 'EXIF GPS OK' : 'Revisar GPS'}
                </span>
              </div>

              {/* Simulated WhatsApp Audio Note + NLP Transcript */}
              <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPlayingAudio((p) => !p)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                  >
                    {playingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    Nota de Voz ({selectedOffer.audioDuration})
                  </button>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    📷 {selectedOffer.photosCount} fotos adjuntas
                  </span>
                </div>

                <p className="text-xs italic text-foreground/90 leading-relaxed">
                  "{selectedOffer.transcript}"
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    {selectedOffer.highlightedEntities?.volume || `${selectedOffer.bultos} bultos`}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 text-[10px] font-bold">
                    {selectedOffer.highlightedEntities?.vereda || selectedOffer.vereda}
                  </span>
                </div>
              </div>

              {/* Quality & Price Controls */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5">
                    Calidad Validada (Teclas 1 / 2 / 3)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Extra', 'Primera', 'Segunda'].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setDraftQuality(q)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          draftQuality === q
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary/60 text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-muted-foreground">
                      Precio Finca por Bulto (COP)
                    </label>
                    {!isAdmin && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                        <Lock className="w-3 h-3" /> Solo Administrador
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step={1000}
                    disabled={!isAdmin}
                    value={draftPrice}
                    onChange={(e) => setDraftPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/70 border border-border text-sm font-bold tabular-nums text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Referencia Corabastos: {formatCop(selectedOffer.marketRefPriceCop)} / bulto
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    approveOffer(
                      selectedOffer.id,
                      draftQuality,
                      isAdmin ? draftPrice : selectedOffer.pricePerBultoCop
                    )
                  }
                  className="w-full py-2.5 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aprobar y Publicar en Catálogo Web (A)
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateOfferDraft(
                        selectedOffer.id,
                        draftQuality,
                        isAdmin ? draftPrice : selectedOffer.pricePerBultoCop
                      )
                    }
                    className="py-2 px-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => requestOfferPhoto(selectedOffer.id)}
                    className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Pedir Foto (R)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => addOfferToRoute(selectedOffer.id)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border text-xs font-bold text-foreground flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4 text-primary" />
                  Agregar Recolección a Ruta Milk-Run
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Offer Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground">
                Registrar Nueva Cosecha de Finca
              </h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Nombre del Campesino *</span>
                  <input
                    required
                    value={formState.farmerName}
                    onChange={(e) => setFormState({ ...formState, farmerName: e.target.value })}
                    placeholder="Ej. Don Luis Peña"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Teléfono WhatsApp *</span>
                  <input
                    required
                    value={formState.farmerPhone}
                    onChange={(e) => setFormState({ ...formState, farmerPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Nombre de la Finca *</span>
                  <input
                    required
                    value={formState.farmName}
                    onChange={(e) => setFormState({ ...formState, farmName: e.target.value })}
                    placeholder="Ej. Finca El Roble"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Vereda *</span>
                  <input
                    required
                    value={formState.vereda}
                    onChange={(e) => setFormState({ ...formState, vereda: e.target.value })}
                    placeholder="Ej. Vda. Puente de Boyacá"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Municipio</span>
                  <input
                    value={formState.municipio}
                    onChange={(e) => setFormState({ ...formState, municipio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Coordenadas GPS</span>
                  <input
                    value={formState.gpsCoords}
                    onChange={(e) => setFormState({ ...formState, gpsCoords: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Producto *</span>
                  <input
                    required
                    value={formState.product}
                    onChange={(e) => setFormState({ ...formState, product: e.target.value })}
                    placeholder="Ej. Papa Pastusa, Zanahoria, Arveja..."
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Cantidad de Bultos *</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formState.bultos}
                    onChange={(e) => setFormState({ ...formState, bultos: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Precio Finca / Bulto (COP)</span>
                  <input
                    type="number"
                    step={1000}
                    value={formState.pricePerBultoCop}
                    onChange={(e) =>
                      setFormState({ ...formState, pricePerBultoCop: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Acceso Vial</span>
                  <select
                    value={formState.roadAccess}
                    onChange={(e) => setFormState({ ...formState, roadAccess: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  >
                    <option value="Entra Turbo">Entra Turbo</option>
                    <option value="Solo 4x4">Solo 4x4</option>
                    <option value="Carretera Pavimentada">Carretera Pavimentada</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-foreground font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Guardar Cosecha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
