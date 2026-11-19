import React, { useMemo, useState } from 'react'
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  Phone,
  MapPin,
  Wallet,
  CheckCircle2,
  X,
  Star,
} from 'lucide-react'
import { useAgroControl } from '../context/AgroControlContext'
import type { NetworkActor } from '../types/agro'

export function ActorsDirectoryPage() {
  const { actors, selectedCorridor, approveActorDocs, createActor } = useAgroControl()

  const [roleFilter, setRoleFilter] = useState<string>('Todos')
  const [docFilter, setDocFilter] = useState<string>('Todos')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [formState, setFormState] = useState({
    name: '',
    docId: 'CC ',
    role: 'Campesino',
    corridor: 'Corredor Cundiboyacense → Bogotá',
    locationDetails: '',
    kycStatus: 'Vigente',
    operationalProfile: '',
    walletOrCreditLabel: 'Nequi •••• 0000',
    phone: '+57 310 ',
  })

  const filteredActors = useMemo(() => {
    return actors.filter((a) => {
      const okCorridor =
        selectedCorridor === 'Todos los Corredores' || a.corridor === selectedCorridor
      const okRole = roleFilter === 'Todos' || a.role === roleFilter
      const okDoc = docFilter === 'Todos' || a.kycStatus === docFilter
      const q = search.trim().toLowerCase()
      const okSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.docId.toLowerCase().includes(q) ||
        a.locationDetails.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q)
      return okCorridor && okRole && okDoc && okSearch
    })
  }, [actors, selectedCorridor, roleFilter, docFilter, search])

  const selectedActor: NetworkActor | null = useMemo(
    () => filteredActors.find((a) => a.id === selectedId) ?? filteredActors[0] ?? null,
    [filteredActors, selectedId]
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createActor(formState)
    setModalOpen(false)
    setFormState((prev) => ({ ...prev, name: '', locationDetails: '', operationalProfile: '' }))
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Campesinos, Transportadores y Restaurantes B2B
          </h1>
          <p className="text-xs text-muted-foreground">
            Directorio CRM sincronizado en vivo con el Catálogo Web y validaciones RUNT/SOAT.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo Actor
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {['Todos', 'Campesino', 'Transportador', 'Restaurante B2B'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                roleFilter === role
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={docFilter}
            onChange={(e) => setDocFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-secondary/70 border border-border text-xs font-semibold"
          >
            <option value="Todos">Docs: Todos</option>
            <option value="Vigente">Vigente</option>
            <option value="Por Vencer">Por Vencer</option>
            <option value="Bloqueado / Vencido">Bloqueado / Vencido</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nombre, NIT, dirección..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-secondary/70 border border-border text-xs w-56 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* 8-Column CRM Table + Actor Dossier Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-8 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/45 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-3 font-bold">Actor / ID</th>
                  <th className="py-3 px-3 font-bold">Rol</th>
                  <th className="py-3 px-3 font-bold">Documento / Contacto</th>
                  <th className="py-3 px-3 font-bold">Ubicación / Dirección</th>
                  <th className="py-3 px-3 font-bold">KYC / RUNT</th>
                  <th className="py-3 px-3 font-bold">Score</th>
                  <th className="py-3 px-3 font-bold">Billetera / Pago</th>
                  <th className="py-3 px-3 font-bold">Actividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredActors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No se encontraron actores con esos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredActors.map((actor) => {
                    const isSelected = selectedActor?.id === actor.id
                    const kycStyle =
                      actor.kycStatus === 'Vigente'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : actor.kycStatus === 'Por Vencer'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'

                    return (
                      <tr
                        key={actor.id}
                        onClick={() => setSelectedId(actor.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/12' : 'hover:bg-secondary/35'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <span className="font-bold text-foreground block">{actor.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {actor.id}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-lg bg-secondary text-[10px] font-bold">
                            {actor.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] block">{actor.docId}</span>
                          <span className="text-[10px] text-muted-foreground">{actor.phone}</span>
                        </td>
                        <td className="py-3 px-3 max-w-[180px]">
                          <span className="text-[11px] block truncate" title={actor.locationDetails}>
                            {actor.locationDetails}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${kycStyle}`}
                          >
                            {actor.kycStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold tabular-nums whitespace-nowrap">
                          {actor.complianceScorePct}%
                        </td>
                        <td className="py-3 px-3 max-w-[150px]">
                          <span className="text-[11px] block truncate" title={actor.walletOrCreditLabel}>
                            {actor.walletOrCreditLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-muted-foreground whitespace-nowrap">
                          {actor.lastActivity}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actor Dossier Drawer */}
        <div className="xl:col-span-4 bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          {!selectedActor ? (
            <p className="py-12 text-center text-xs text-muted-foreground">
              Selecciona un actor para ver su hoja de vida, dirección y documentos.
            </p>
          ) : (
            <>
              <div className="pb-3 border-b border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-primary">
                    {selectedActor.id} • {selectedActor.role}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {selectedActor.complianceScorePct}% ({selectedActor.completedOpsCount} ops)
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-foreground">{selectedActor.name}</h2>
                <p className="text-xs text-muted-foreground">{selectedActor.docId}</p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-secondary/45 border border-border">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground">Ubicación / Dirección de Entrega</p>
                    <p className="text-muted-foreground mt-0.5">{selectedActor.locationDetails}</p>
                    <p className="text-[11px] text-primary mt-0.5">{selectedActor.corridor}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-secondary/45 border border-border">
                  <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground">Teléfono / WhatsApp</p>
                    <p className="text-muted-foreground mt-0.5">{selectedActor.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-secondary/45 border border-border">
                  <Wallet className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground">Billetera o Modalidad de Pago</p>
                    <p className="text-muted-foreground mt-0.5">
                      {selectedActor.walletOrCreditLabel}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-secondary/45 border border-border">
                  <p className="font-bold text-foreground">Perfil Operativo</p>
                  <p className="text-muted-foreground mt-0.5">
                    {selectedActor.operationalProfile}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-secondary/45 border border-border">
                  <p className="font-bold text-foreground">Estado Documental (KYC / RUNT)</p>
                  <p className="text-muted-foreground mt-0.5">{selectedActor.kycDetailText}</p>
                </div>
              </div>

              {selectedActor.kycStatus !== 'Vigente' ? (
                <button
                  type="button"
                  onClick={() => approveActorDocs(selectedActor.id)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Validar RUNT / SOAT y Desbloquear Flota
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Documentación al día y habilitada
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Actor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground">Registrar Nuevo Actor</h2>
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
                  <span className="font-semibold text-muted-foreground">Nombre Completo / Razón Social *</span>
                  <input
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Rol en la Red *</span>
                  <select
                    value={formState.role}
                    onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  >
                    <option value="Campesino">Campesino</option>
                    <option value="Transportador">Transportador</option>
                    <option value="Restaurante B2B">Restaurante B2B</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">NIT / Cédula *</span>
                  <input
                    required
                    value={formState.docId}
                    onChange={(e) => setFormState({ ...formState, docId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Teléfono / WhatsApp *</span>
                  <input
                    required
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="font-semibold text-muted-foreground">Ubicación / Dirección Exacta *</span>
                  <input
                    required
                    value={formState.locationDetails}
                    onChange={(e) =>
                      setFormState({ ...formState, locationDetails: e.target.value })
                    }
                    placeholder="Ej. Vereda El Mortiño, Ventaquemada o Calle 70 # 9-42, Bogotá"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Billetera / Método de Pago</span>
                  <input
                    value={formState.walletOrCreditLabel}
                    onChange={(e) =>
                      setFormState({ ...formState, walletOrCreditLabel: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-secondary/70 border border-border"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Perfil Operativo</span>
                  <input
                    value={formState.operationalProfile}
                    onChange={(e) =>
                      setFormState({ ...formState, operationalProfile: e.target.value })
                    }
                    placeholder="Ej. Papa Pastusa 40 bultos/sem"
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
                  Guardar Actor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
