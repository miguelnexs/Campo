export interface AuthUser {
  id: number
  username: string
  fullName: string
  role: 'Administrador' | 'Operador de Despacho' | string
}

export interface CorridorMetric {
  id: string
  name: string
  regionBadge: string
  activeFarms: number
  offeredBultos: number
  assignedTrucks: number
  totalTrucks: number
  occupancyPct: number
  etaStatus: string
  etaDeltaText: string
  gpsOnlineCount: number
  shadowZoneNote: string
  escrowCop: number
}

export interface FarmerOffer {
  id: string
  receivedAt: string
  minutesAgo: number
  farmerName: string
  farmerPhone: string
  farmerScore: number
  complianceRate: number
  farmName: string
  vereda: string
  municipio: string
  corridor: string
  altitudeMsnm: number
  gpsCoords: string
  roadAccess: string
  audioDuration: string
  transcript: string
  highlightedEntities: {
    volume?: string
    product?: string
    qualityClaim?: string
    vereda?: string
    window?: string
  }
  photosCount: number
  exifVerified: boolean
  product: string
  bultos: number
  weightKg: number
  validatedQuality: string
  pricePerBultoCop: number
  marketRefPriceCop: number
  pickupWindow: string
  status: string
  mapPos: { x: number; y: number }
}

export interface VehicleFleet {
  id: string
  plate: string
  type: string
  traction: string
  capacityKg: number
  capacityM3: number
  driverName: string
  driverPhone: string
  driverWallet: string
  soatStatus: string
  soatDaysLeft: number
  tecnoStatus: string
  tecnoDaysLeft: number
  corridor: string
  currentStatus: string
  gpsSignal: string
  lastPing: string
  freightCostCop: number
  backhaulEfficiencyPct: number
}

export interface RouteStop {
  id: string
  order: number
  operationType: string
  actorName: string
  locationLabel: string
  gpsCoords: string
  cargoDescription: string
  quality: string
  deltaWeightKg: number
  cumulativeWeightKg: number
  volumeM3: number
  timeWindow: string
  eta: string
  etaStatus: string
  requires4x4: boolean
  mapPos: { x: number; y: number }
}

export interface EscrowOrder {
  id: string
  routeId: string
  corridor: string
  farmerName: string
  farmerWalletType: string
  farmerWalletMasked: string
  driverName: string
  driverPlate: string
  driverWalletType: string
  driverWalletMasked: string
  restaurantName: string
  productSummary: string
  quality: string
  farmPhotosCount: number
  scaleTicketPhoto: boolean
  exifGpsMatch: boolean
  declaredWeightKg: number
  scaleWeightKg: number
  qrStatus: string
  qrTimestamp: string
  farmerNetCop: number
  driverFreightCop: number
  platformFeeCop: number
  status: string
  txHash: string | null
  disputeReason: string | null
}

export interface NetworkActor {
  id: string
  name: string
  docId: string
  role: string
  corridor: string
  locationDetails: string
  kycStatus: string
  kycDetailText: string
  operationalProfile: string
  complianceScorePct: number
  completedOpsCount: number
  walletOrCreditLabel: string
  creditUsedCop: number | null
  creditLimitCop: number | null
  lastActivity: string
  phone: string
}

export interface CriticalAlert {
  id: string
  severity: 'CRITICA' | 'ALTA' | 'MEDIA' | string
  title: string
  corridor: string
  location: string
  timeAgo: string
  detail: string
  truckPlate: string | null
  actionLabel: string
  targetModule: string
}

export interface ControlTowerStatePayload {
  corridors: CorridorMetric[]
  offers: FarmerOffer[]
  vehicles: VehicleFleet[]
  routeStops: RouteStop[]
  escrowOrders: EscrowOrder[]
  actors: NetworkActor[]
  alerts: CriticalAlert[]
}
