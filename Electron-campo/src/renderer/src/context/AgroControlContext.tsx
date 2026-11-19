import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { agroApi, REFRESH_STORAGE_KEY, TOKEN_STORAGE_KEY } from '../services/agroApi'
import type {
  AuthUser,
  CorridorMetric,
  CriticalAlert,
  EscrowOrder,
  FarmerOffer,
  NetworkActor,
  RouteStop,
  VehicleFleet,
} from '../types/agro'

interface ActionBanner {
  id: number
  text: string
  tone: 'success' | 'warning' | 'error' | 'info'
}

interface AgroControlContextValue {
  // Auth
  currentUser: AuthUser | null
  authChecking: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void

  // Global Filters & UI
  selectedCorridor: string
  setSelectedCorridor: (corridor: string) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  banner: ActionBanner | null
  notify: (text: string, tone?: ActionBanner['tone']) => void

  // Connection & Sync
  backendConnected: boolean
  syncing: boolean
  lastSyncedAt: string | null
  refreshState: (silent?: boolean) => Promise<void>

  // Domain Data (hydrated from Django/PostgreSQL)
  corridors: CorridorMetric[]
  offers: FarmerOffer[]
  vehicles: VehicleFleet[]
  routeStops: RouteStop[]
  escrowOrders: EscrowOrder[]
  actors: NetworkActor[]
  alerts: CriticalAlert[]

  // Mutations
  approveOffer: (offerId: string, quality: string, pricePerBultoCop: number) => Promise<void>
  requestOfferPhoto: (offerId: string) => Promise<void>
  updateOfferDraft: (offerId: string, quality: string, pricePerBultoCop: number) => Promise<void>
  addOfferToRoute: (offerId: string) => Promise<void>
  moveRouteStop: (stopId: string, direction: 'up' | 'down') => Promise<void>
  dispatchVehicle: (vehicleId: string) => Promise<void>
  releaseEscrow: (orderId: string) => Promise<void>
  recalculateAndReleaseEscrow: (orderId: string) => Promise<void>
  flagEscrowDispute: (orderId: string, note: string) => Promise<void>
  approveActorDocs: (actorId: string) => Promise<void>
  resolveAlert: (alertId: string) => Promise<void>

  // Create Forms
  createOffer: (payload: Record<string, unknown>) => Promise<void>
  createVehicle: (payload: Record<string, unknown>) => Promise<void>
  createActor: (payload: Record<string, unknown>) => Promise<void>
  createEscrowOrder: (payload: Record<string, unknown>) => Promise<void>
}

const AgroControlContext = createContext<AgroControlContextValue | undefined>(undefined)

function extractApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.detail) {
    return String(err.response.data.detail)
  }
  return fallback
}

export function AgroControlProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [authChecking, setAuthChecking] = useState(true)

  const [selectedCorridor, setSelectedCorridor] = useState<string>('Todos los Corredores')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [banner, setBanner] = useState<ActionBanner | null>(null)

  const [backendConnected, setBackendConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  const [corridors, setCorridors] = useState<CorridorMetric[]>([])
  const [offers, setOffers] = useState<FarmerOffer[]>([])
  const [vehicles, setVehicles] = useState<VehicleFleet[]>([])
  const [routeStops, setRouteStops] = useState<RouteStop[]>([])
  const [escrowOrders, setEscrowOrders] = useState<EscrowOrder[]>([])
  const [actors, setActors] = useState<NetworkActor[]>([])
  const [alerts, setAlerts] = useState<CriticalAlert[]>([])

  const notify = useCallback((text: string, tone: ActionBanner['tone'] = 'info') => {
    const id = Date.now()
    setBanner({ id, text, tone })
    window.setTimeout(() => {
      setBanner((prev) => (prev?.id === id ? null : prev))
    }, 4200)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(REFRESH_STORAGE_KEY)
    setCurrentUser(null)
    setBackendConnected(false)
  }, [])

  const refreshState = useCallback(
    async (silent = false) => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (!token) return
      if (!silent) setSyncing(true)
      try {
        const state = await agroApi.fetchState()
        setCorridors(state.corridors)
        setOffers(state.offers)
        setVehicles(state.vehicles)
        setRouteStops(state.routeStops)
        setEscrowOrders(state.escrowOrders)
        setActors(state.actors)
        setAlerts(state.alerts)
        setBackendConnected(true)
        setLastSyncedAt(
          new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        )
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          clearSession()
          notify('Tu sesión expiró. Por favor inicia sesión nuevamente.', 'warning')
        } else {
          setBackendConnected(false)
        }
      } finally {
        if (!silent) setSyncing(false)
      }
    },
    [clearSession, notify]
  )

  // Restore JWT session on app load
  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (!token) {
        setAuthChecking(false)
        return
      }
      try {
        const user = await agroApi.me()
        setCurrentUser(user)
        await refreshState(true)
      } catch {
        clearSession()
      } finally {
        setAuthChecking(false)
      }
    }
    bootstrap()
  }, [clearSession, refreshState])

  // Poll Django every 15 seconds while authenticated (keeps web catalog orders live in Electron)
  useEffect(() => {
    if (!currentUser) return
    const timer = window.setInterval(() => {
      refreshState(true)
    }, 15000)
    return () => window.clearInterval(timer)
  }, [currentUser, refreshState])

  const login = async (username: string, password: string) => {
    const res = await agroApi.login(username, password)
    localStorage.setItem(TOKEN_STORAGE_KEY, res.access)
    localStorage.setItem(REFRESH_STORAGE_KEY, res.refresh)
    setCurrentUser(res.user)
    await refreshState(false)
    notify(`Bienvenido, ${res.user.fullName} (${res.user.role})`, 'success')
  }

  const logout = () => {
    clearSession()
    setCorridors([])
    setOffers([])
    setVehicles([])
    setRouteStops([])
    setEscrowOrders([])
    setActors([])
    setAlerts([])
    notify('Sesión cerrada de forma segura.', 'info')
  }

  const approveOffer = async (offerId: string, quality: string, pricePerBultoCop: number) => {
    try {
      const updated = await agroApi.approveOffer(offerId, { quality, pricePerBultoCop })
      setOffers((prev) => prev.map((o) => (o.id === offerId ? updated : o)))
      notify(`Oferta ${offerId} publicada en el Catálogo Web para restaurantes.`, 'success')
    } catch (err) {
      notify(extractApiError(err, 'No se pudo aprobar la oferta.'), 'error')
      throw err
    }
  }

  const requestOfferPhoto = async (offerId: string) => {
    try {
      const updated = await agroApi.requestOfferPhoto(offerId)
      setOffers((prev) => prev.map((o) => (o.id === offerId ? updated : o)))
      notify(`Se envió solicitud de foto nítida por WhatsApp (${offerId}).`, 'warning')
    } catch (err) {
      notify(extractApiError(err, 'No se pudo solicitar foto.'), 'error')
    }
  }

  const updateOfferDraft = async (offerId: string, quality: string, pricePerBultoCop: number) => {
    try {
      const updated = await agroApi.updateOfferDraft(offerId, { quality, pricePerBultoCop })
      setOffers((prev) => prev.map((o) => (o.id === offerId ? updated : o)))
      notify(`Cambios guardados en ${offerId}.`, 'info')
    } catch (err) {
      notify(extractApiError(err, 'Solo el Administrador puede cambiar precios.'), 'error')
    }
  }

  const addOfferToRoute = async (offerId: string) => {
    try {
      const { offer, routeStops: stops } = await agroApi.addOfferToRoute(offerId)
      setOffers((prev) => prev.map((o) => (o.id === offerId ? offer : o)))
      setRouteStops(stops)
      notify(`Cosecha ${offerId} agregada como parada en la Ruta Milk-Run.`, 'success')
    } catch (err) {
      notify(extractApiError(err, 'No se pudo agregar la cosecha a la ruta.'), 'error')
    }
  }

  const moveRouteStop = async (stopId: string, direction: 'up' | 'down') => {
    try {
      const stops = await agroApi.moveRouteStop(stopId, direction)
      setRouteStops(stops)
      notify('Orden de paradas actualizado y pesos recalculados.', 'info')
    } catch (err) {
      notify(extractApiError(err, 'Error al reordenar la parada.'), 'error')
    }
  }

  const dispatchVehicle = async (vehicleId: string) => {
    try {
      const updated = await agroApi.dispatchVehicle(vehicleId)
      setVehicles((prev) => prev.map((v) => (v.id === vehicleId ? updated : v)))
      notify(`Camión ${updated.plate} despachado a Ruta Milk-Run.`, 'success')
    } catch (err) {
      notify(extractApiError(err, 'Vehículo bloqueado por cumplimiento documental.'), 'error')
    }
  }

  const releaseEscrow = async (orderId: string) => {
    try {
      const updated = await agroApi.releaseEscrow(orderId)
      setEscrowOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      notify(`Pago Escrow ${orderId} liberado (${updated.txHash}).`, 'success')
    } catch (err) {
      notify(extractApiError(err, 'Solo el Administrador puede liberar pagos.'), 'error')
    }
  }

  const recalculateAndReleaseEscrow = async (orderId: string) => {
    try {
      const updated = await agroApi.recalculateAndReleaseEscrow(orderId)
      setEscrowOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      notify(
        `Orden ${orderId} recalculada por peso real en báscula y pagada (${updated.txHash}).`,
        'success'
      )
    } catch (err) {
      notify(extractApiError(err, 'Solo el Administrador puede recalcular y pagar.'), 'error')
    }
  }

  const flagEscrowDispute = async (orderId: string, note: string) => {
    try {
      const updated = await agroApi.flagEscrowDispute(orderId, note)
      setEscrowOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      notify(`Orden ${orderId} marcada en Disputa por Merma.`, 'warning')
    } catch (err) {
      notify(extractApiError(err, 'No se pudo marcar la disputa.'), 'error')
    }
  }

  const approveActorDocs = async (actorId: string) => {
    try {
      const { actor, vehicles: updatedVehicles } = await agroApi.approveActorDocs(actorId)
      setActors((prev) => prev.map((a) => (a.id === actorId ? actor : a)))
      setVehicles(updatedVehicles)
      notify(`Documentos RUNT/SOAT validados para ${actor.name}. Vehículo habilitado.`, 'success')
    } catch (err) {
      notify(extractApiError(err, 'Error al validar documentos.'), 'error')
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      await agroApi.resolveAlert(alertId)
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
      notify(`Alerta ${alertId} marcada como resuelta.`, 'success')
    } catch (err) {
      notify(extractApiError(err, 'No se pudo resolver la alerta.'), 'error')
    }
  }

  const createOffer = async (payload: Record<string, unknown>) => {
    try {
      const created = await agroApi.createOffer(payload)
      setOffers((prev) => [created, ...prev])
      notify(`Cosecha ${created.id} (${created.product}) registrada en PostgreSQL.`, 'success')
    } catch (err) {
      notify(extractApiError(err, 'No se pudo registrar la cosecha.'), 'error')
      throw err
    }
  }

  const createVehicle = async (payload: Record<string, unknown>) => {
    try {
      const created = await agroApi.createVehicle(payload)
      setVehicles((prev) => [created, ...prev])
      notify(`Camión ${created.plate} registrado en la flota rural.`, 'success')
    } catch (err) {
      notify(extractApiError(err, 'No se pudo registrar el camión.'), 'error')
      throw err
    }
  }

  const createActor = async (payload: Record<string, unknown>) => {
    try {
      const created = await agroApi.createActor(payload)
      setActors((prev) => [created, ...prev])
      notify(`Actor ${created.name} (${created.role}) guardado en directorio.`, 'success')
    } catch (err) {
      notify(extractApiError(err, 'No se pudo registrar el actor.'), 'error')
      throw err
    }
  }

  const createEscrowOrder = async (payload: Record<string, unknown>) => {
    try {
      const created = await agroApi.createEscrowOrder(payload)
      setEscrowOrders((prev) => [created, ...prev])
      notify(`Orden de custodia ${created.id} creada correctamente.`, 'success')
    } catch (err) {
      notify(extractApiError(err, 'No se pudo crear la orden Escrow.'), 'error')
      throw err
    }
  }

  const isAdmin = currentUser?.role === 'Administrador'

  return (
    <AgroControlContext.Provider
      value={{
        currentUser,
        authChecking,
        isAdmin,
        login,
        logout,
        selectedCorridor,
        setSelectedCorridor,
        commandPaletteOpen,
        setCommandPaletteOpen,
        banner,
        notify,
        backendConnected,
        syncing,
        lastSyncedAt,
        refreshState,
        corridors,
        offers,
        vehicles,
        routeStops,
        escrowOrders,
        actors,
        alerts,
        approveOffer,
        requestOfferPhoto,
        updateOfferDraft,
        addOfferToRoute,
        moveRouteStop,
        dispatchVehicle,
        releaseEscrow,
        recalculateAndReleaseEscrow,
        flagEscrowDispute,
        approveActorDocs,
        resolveAlert,
        createOffer,
        createVehicle,
        createActor,
        createEscrowOrder,
      }}
    >
      {children}
    </AgroControlContext.Provider>
  )
}

export function useAgroControl() {
  const ctx = useContext(AgroControlContext)
  if (!ctx) {
    throw new Error('useAgroControl debe usarse dentro de AgroControlProvider')
  }
  return ctx
}
