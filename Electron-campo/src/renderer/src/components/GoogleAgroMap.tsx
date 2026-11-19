import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { Compass, Layers, MapPin, Navigation, Route, LocateFixed } from 'lucide-react'

export interface AgroMapMarker {
  id: string
  lat: number
  lng: number
  label: string
  sublabel?: string
  detail?: string
  type: 'pickup' | 'delivery' | 'alert' | 'hub'
  orderNumber?: number
}

interface GoogleAgroMapProps {
  markers: AgroMapMarker[]
  showPolyline?: boolean
  selectedMarkerId?: string | null
  onSelectMarker?: (id: string) => void
  heightClass?: string
  title?: string
}

type MapStyleMode = 'street' | 'satellite' | 'topo'

const ESRI_TILES: Record<MapStyleMode, { url: string; label: string; attribution: string }> = {
  street: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    label: 'Vial',
    attribution: 'Tiles © Esri — Street Map',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    label: 'Satélite',
    attribution: 'Tiles © Esri — World Imagery',
  },
  topo: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    label: 'Relieve',
    attribution: 'Tiles © Esri — Topographic',
  },
}

/** Parsea coordenadas estilo "5.3612° N, 73.5241° W" o "5.36, -73.52" */
export function parseGpsCoords(gpsStr: string | undefined, fallbackLat = 5.05, fallbackLng = -73.85): [number, number] {
  if (!gpsStr) return [fallbackLat, fallbackLng]
  const matches = gpsStr.match(/(-?\d+(?:\.\d+)?)\s*°?\s*([NSEW])?/gi)
  if (!matches || matches.length < 2) return [fallbackLat, fallbackLng]

  const parsePart = (part: string, isLng: boolean): number => {
    const numMatch = part.match(/-?\d+(?:\.\d+)?/)
    if (!numMatch) return isLng ? fallbackLng : fallbackLat
    let val = parseFloat(numMatch[0])
    const upper = part.toUpperCase()
    if (upper.includes('S') || upper.includes('W')) {
      val = -Math.abs(val)
    } else if (upper.includes('N') || upper.includes('E')) {
      val = Math.abs(val)
    }
    return val
  }

  const lat = parsePart(matches[0], false)
  const lng = parsePart(matches[1], true)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return [fallbackLat, fallbackLng]
  return [lat, lng]
}

async function fetchFullRoadRoute(
  points: Array<[number, number]>
): Promise<{ coords: Array<[number, number]>; distanceKm: number; durationMin: number } | null> {
  if (points.length < 2) return null
  const coordStr = points.map(([lat, lng]) => `${lng},${lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`
  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 6500)
    const res = await fetch(url, { signal: controller.signal })
    window.clearTimeout(timer)
    if (!res.ok) return null
    const json = await res.json()
    const route = json?.routes?.[0]
    if (!route?.geometry?.coordinates) return null
    const coords: Array<[number, number]> = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    )
    return {
      coords,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.round(route.duration / 60),
    }
  } catch {
    return null
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}

export function GoogleAgroMap({
  markers,
  showPolyline = false,
  selectedMarkerId = null,
  onSelectMarker,
  heightClass = 'h-[400px]',
  title = 'Mapa Satelital de Corredores Rurales',
}: GoogleAgroMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const routeLayerRef = useRef<L.LayerGroup | null>(null)
  const hasFittedRef = useRef(false)

  const [mapMode, setMapMode] = useState<MapStyleMode>('street')
  const [routeStats, setRouteStats] = useState<{
    distanceKm: number
    durationMin: number
    isRealRoad: boolean
  } | null>(null)

  const routeKey = useMemo(
    () => markers.map((m) => `${m.id}:${m.lat.toFixed(4)},${m.lng.toFixed(4)}`).join('|'),
    [markers]
  )

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [5.05, -73.82],
      zoom: 9,
      zoomControl: false,
      attributionControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const initialTile = L.tileLayer(ESRI_TILES.street.url, {
      maxZoom: 18,
      attribution: ESRI_TILES.street.attribution,
    }).addTo(map)

    tileLayerRef.current = initialTile
    routeLayerRef.current = L.layerGroup().addTo(map)
    markersLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    const ro = new ResizeObserver(() => {
      map.invalidateSize()
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      markersLayerRef.current = null
      routeLayerRef.current = null
      hasFittedRef.current = false
    }
  }, [])

  // Switch Esri Tile Layer when mapMode changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }
    const cfg = ESRI_TILES[mapMode]
    tileLayerRef.current = L.tileLayer(cfg.url, {
      maxZoom: 18,
      attribution: cfg.attribution,
    }).addTo(map)
  }, [mapMode])

  // Render Markers
  useEffect(() => {
    const map = mapRef.current
    const layer = markersLayerRef.current
    if (!map || !layer) return

    layer.clearLayers()

    markers.forEach((m) => {
      const isSelected = m.id === selectedMarkerId
      const palette =
        m.type === 'pickup'
          ? { bg: '#1F703E', ring: '#4FB072', badge: 'FINCA' }
          : m.type === 'delivery'
            ? { bg: '#B45309', ring: '#F59E0B', badge: 'ENTREGA' }
            : m.type === 'alert'
              ? { bg: '#B91C1C', ring: '#F87171', badge: 'ALERTA' }
              : { bg: '#5E3B1E', ring: '#CFB086', badge: 'ACOPIO' }

      const shortLabel = m.label.length > 22 ? `${m.label.slice(0, 20)}…` : m.label

      const html = `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-88%);pointer-events:auto;">
          <div style="
            background:${isSelected ? '#180E07' : 'rgba(24,14,7,0.88)'};
            color:#FAF6EF;
            border:1.5px solid ${isSelected ? palette.ring : 'rgba(255,255,255,0.22)'};
            padding:2px 8px;
            border-radius:999px;
            font-size:11px;
            font-weight:700;
            white-space:nowrap;
            box-shadow:0 4px 12px rgba(0,0,0,0.35);
            margin-bottom:4px;
          ">
            ${shortLabel}
          </div>
          <div style="
            position:relative;
            width:${isSelected ? 34 : 28}px;
            height:${isSelected ? 34 : 28}px;
            border-radius:999px;
            background:${palette.bg};
            border:2.5px solid #FAF6EF;
            color:#FFFFFF;
            font-weight:800;
            font-size:12px;
            display:flex;
            align-items:center;
            justify-content:center;
            box-shadow:${isSelected ? `0 0 0 6px ${palette.ring}55, 0 6px 16px rgba(0,0,0,0.45)` : '0 4px 12px rgba(0,0,0,0.4)'};
            transition:all 0.2s ease;
          ">
            ${m.orderNumber ?? '•'}
          </div>
        </div>
      `

      const icon = L.divIcon({
        className: 'agro-custom-marker',
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })

      const marker = L.marker([m.lat, m.lng], { icon })
      marker.bindPopup(`
        <div style="min-width:190px;font-family:Inter,system-ui,sans-serif;">
          <div style="font-size:10px;font-weight:800;letter-spacing:0.06em;color:${palette.bg};margin-bottom:2px;">
            ${palette.badge}${m.orderNumber ? ` • PARADA #${m.orderNumber}` : ''}
          </div>
          <div style="font-size:13px;font-weight:800;color:#2A1A0E;margin-bottom:2px;">
            ${m.label}
          </div>
          ${m.sublabel ? `<div style="font-size:11px;color:#5E3B1E;margin-bottom:4px;">${m.sublabel}</div>` : ''}
          ${m.detail ? `<div style="font-size:11px;color:#1F703E;font-weight:600;background:#F0F9F2;padding:4px 8px;border-radius:8px;">${m.detail}</div>` : ''}
        </div>
      `)

      marker.on('click', () => {
        onSelectMarker?.(m.id)
      })

      marker.addTo(layer)
    })

    if (markers.length > 0 && !hasFittedRef.current) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]))
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 })
      hasFittedRef.current = true
    }
  }, [markers, selectedMarkerId, onSelectMarker])

  // Smooth flyTo when selectedMarkerId changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedMarkerId) return
    const target = markers.find((m) => m.id === selectedMarkerId)
    if (!target) return
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 11), {
      duration: 0.75,
    })
  }, [selectedMarkerId, markers])

  // Fetch & draw real OSRM driving route when showPolyline is enabled
  useEffect(() => {
    const routeLayer = routeLayerRef.current
    if (!routeLayer) return
    routeLayer.clearLayers()

    if (!showPolyline || markers.length < 2) {
      setRouteStats(null)
      return
    }

    let cancelled = false
    const pts = markers.map((m) => [m.lat, m.lng] as [number, number])

    const drawRoute = async () => {
      const osrm = await fetchFullRoadRoute(pts)
      if (cancelled || !routeLayerRef.current) return

      if (osrm) {
        // Soft outer casing for contrast against satellite/streets
        L.polyline(osrm.coords, {
          color: '#180E07',
          weight: 7,
          opacity: 0.55,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeLayerRef.current)

        L.polyline(osrm.coords, {
          color: '#34A053',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeLayerRef.current)

        setRouteStats({
          distanceKm: osrm.distanceKm,
          durationMin: osrm.durationMin,
          isRealRoad: true,
        })
      } else {
        // Fallback straight dashed path if offline
        L.polyline(pts, {
          color: '#34A053',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '8 8',
        }).addTo(routeLayerRef.current)
        setRouteStats({ distanceKm: 0, durationMin: 0, isRealRoad: false })
      }
    }

    drawRoute()
    return () => {
      cancelled = true
    }
  }, [showPolyline, routeKey, markers])

  const handleRecenter = () => {
    const map = mapRef.current
    if (!map) return
    if (markers.length === 0) {
      map.flyTo([5.05, -73.82], 9, { duration: 0.6 })
      return
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 })
  }

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-border bg-card shadow-sm`}>
      {/* Map Canvas */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Top Left Header & OSRM Stats Pill */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/90 backdrop-blur-md border border-border shadow-md">
          <Compass className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-foreground">{title}</span>
        </div>

        {showPolyline && routeStats && routeStats.isRealRoad && (
          <div className="pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/90 text-emerald-100 border border-emerald-500/40 backdrop-blur-md shadow-md text-xs font-semibold tabular-nums">
            <Route className="w-3.5 h-3.5 text-emerald-400" />
            <span>{routeStats.distanceKm} km viales</span>
            <span className="text-emerald-500">•</span>
            <span>~{formatDuration(routeStats.durationMin)}</span>
          </div>
        )}
      </div>

      {/* Top Right Map Style Switcher & Recenter */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5">
        <div className="flex items-center p-1 rounded-xl bg-background/90 backdrop-blur-md border border-border shadow-md">
          <Layers className="w-3.5 h-3.5 text-muted-foreground mx-1.5" />
          {(['street', 'satellite', 'topo'] as MapStyleMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMapMode(mode)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                mapMode === mode
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {ESRI_TILES[mode].label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleRecenter}
          title="Centrar toda la ruta"
          className="p-2 rounded-xl bg-background/90 hover:bg-background backdrop-blur-md border border-border shadow-md text-foreground transition-colors"
        >
          <LocateFixed className="w-4 h-4 text-primary" />
        </button>
      </div>

      {/* Bottom Left Compact Guide Legend */}
      <div className="absolute bottom-3 left-3 z-[400] flex flex-wrap items-center gap-2.5 px-3 py-1.5 rounded-xl bg-background/90 backdrop-blur-md border border-border shadow-md text-[11px] font-medium">
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-400/40" />
          Finca / Recolección
        </span>
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 ring-2 ring-amber-400/40" />
          Restaurante B2B
        </span>
        {showPolyline && (
          <span className="inline-flex items-center gap-1.5 text-emerald-500 font-semibold">
            <Navigation className="w-3 h-3" />
            Ruta vial OSRM
          </span>
        )}
        {markers.length === 0 && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-3 h-3" />
            Sin puntos activos
          </span>
        )}
      </div>
    </div>
  )
}
