import axios from 'axios'
import type {
  AuthUser,
  ControlTowerStatePayload,
  EscrowOrder,
  FarmerOffer,
  NetworkActor,
  RouteStop,
  VehicleFleet,
} from '../types/agro'

export const API_BASE_URL = 'http://127.0.0.1:8001/api'
export const TOKEN_STORAGE_KEY = 'campo_vivo_access_token'
export const REFRESH_STORAGE_KEY = 'campo_vivo_refresh_token'

export const agroHttp = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
})

agroHttp.interceptors.request.use((config) => {
  const url = config.url ?? ''
  if (!url.includes('/auth/login/')) {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

export interface LoginResponse {
  access: string
  refresh: string
  user: AuthUser
}

export const agroApi = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const { data } = await agroHttp.post<LoginResponse>('/auth/login/', {
      username,
      password,
    })
    return data
  },

  async me(): Promise<AuthUser> {
    const { data } = await agroHttp.get<AuthUser>('/auth/me/')
    return data
  },

  async fetchState(): Promise<ControlTowerStatePayload> {
    const { data } = await agroHttp.get<ControlTowerStatePayload>('/state/')
    return data
  },

  async approveOffer(
    offerId: string,
    payload: { quality?: string; pricePerBultoCop?: number }
  ): Promise<FarmerOffer> {
    const { data } = await agroHttp.post<FarmerOffer>(`/offers/${offerId}/approve/`, payload)
    return data
  },

  async requestOfferPhoto(offerId: string): Promise<FarmerOffer> {
    const { data } = await agroHttp.post<FarmerOffer>(`/offers/${offerId}/request-photo/`)
    return data
  },

  async updateOfferDraft(
    offerId: string,
    payload: { quality?: string; pricePerBultoCop?: number }
  ): Promise<FarmerOffer> {
    const { data } = await agroHttp.patch<FarmerOffer>(
      `/offers/${offerId}/update-draft/`,
      payload
    )
    return data
  },

  async addOfferToRoute(
    offerId: string
  ): Promise<{ offer: FarmerOffer; routeStops: RouteStop[] }> {
    const { data } = await agroHttp.post<{ offer: FarmerOffer; routeStops: RouteStop[] }>(
      `/offers/${offerId}/add-to-route/`
    )
    return data
  },

  async moveRouteStop(stopId: string, direction: 'up' | 'down'): Promise<RouteStop[]> {
    const { data } = await agroHttp.post<RouteStop[]>(`/routes/stops/${stopId}/move/`, {
      direction,
    })
    return data
  },

  async dispatchVehicle(vehicleId: string): Promise<VehicleFleet> {
    const { data } = await agroHttp.post<VehicleFleet>(`/vehicles/${vehicleId}/dispatch/`)
    return data
  },

  async releaseEscrow(orderId: string): Promise<EscrowOrder> {
    const { data } = await agroHttp.post<EscrowOrder>(`/escrow/${orderId}/release/`)
    return data
  },

  async recalculateAndReleaseEscrow(orderId: string): Promise<EscrowOrder> {
    const { data } = await agroHttp.post<EscrowOrder>(`/escrow/${orderId}/recalculate-release/`)
    return data
  },

  async flagEscrowDispute(orderId: string, note: string): Promise<EscrowOrder> {
    const { data } = await agroHttp.post<EscrowOrder>(`/escrow/${orderId}/dispute/`, { note })
    return data
  },

  async approveActorDocs(
    actorId: string
  ): Promise<{ actor: NetworkActor; vehicles: VehicleFleet[] }> {
    const { data } = await agroHttp.post<{ actor: NetworkActor; vehicles: VehicleFleet[] }>(
      `/actors/${actorId}/approve-docs/`
    )
    return data
  },

  async resolveAlert(alertId: string): Promise<{ id: string; resolved: boolean }> {
    const { data } = await agroHttp.post<{ id: string; resolved: boolean }>(
      `/alerts/${alertId}/resolve/`
    )
    return data
  },

  async createOffer(payload: Record<string, unknown>): Promise<FarmerOffer> {
    const { data } = await agroHttp.post<FarmerOffer>('/offers/create/', payload)
    return data
  },

  async createVehicle(payload: Record<string, unknown>): Promise<VehicleFleet> {
    const { data } = await agroHttp.post<VehicleFleet>('/vehicles/create/', payload)
    return data
  },

  async createActor(payload: Record<string, unknown>): Promise<NetworkActor> {
    const { data } = await agroHttp.post<NetworkActor>('/actors/create/', payload)
    return data
  },

  async createEscrowOrder(payload: Record<string, unknown>): Promise<EscrowOrder> {
    const { data } = await agroHttp.post<EscrowOrder>('/escrow/create/', payload)
    return data
  },
}
