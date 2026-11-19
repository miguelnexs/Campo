import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Sprout,
  ShoppingBasket,
  MapPin,
  Star,
  Clock,
  ShieldCheck,
  Truck,
  Scale,
  QrCode,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Search,
  RefreshCw,
  Phone,
  Building2,
  User,
  FileText,
  Navigation,
  Wallet,
  Banknote,
  CreditCard,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Leaf,
  Mountain,
  X,
  MessageCircle,
  HeartHandshake,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

const API_BASE =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE ||
  'http://127.0.0.1:8001/api'

interface CatalogOffer {
  id: string
  receivedAt: string
  farmerName: string
  farmerPhone: string
  farmerScore: number
  complianceRate: number
  farmName: string
  vereda: string
  municipio: string
  corridor: string
  altitudeMsnm: number
  product: string
  bultos: number
  weightKg: number
  validatedQuality: string
  pricePerBultoCop: number
  marketRefPriceCop: number
  pickupWindow: string
  status: string
}

interface CartItem {
  offer: CatalogOffer
  qtyBultos: number
}

interface OrderConfirmation {
  orders: Array<{
    orderId: string
    qrCode: string
    product: string
    bultos: number
    farmerName: string
    totalCop: number
  }>
  restaurantName: string
  contactName: string
  docId: string
  phone: string
  city: string
  address: string
  deliverySlot: string
  paymentMethod: string
  grandTotalCop: number
  totalSavingsCop: number
}

const DELIVERY_SLOTS = [
  'Hoy 11:00 AM – 01:00 PM',
  'Hoy 02:00 PM – 05:00 PM',
  'Mañana 05:30 AM – 07:30 AM',
  'Mañana 07:30 AM – 10:00 AM',
]

const PAYMENT_METHODS = [
  {
    id: 'Contraentrega Nequi / Daviplata al recibir',
    label: 'Nequi o Daviplata al recibir',
    sublabel: 'Pagas al conductor tras verificar el peso en báscula',
    icon: Wallet,
  },
  {
    id: 'Contraentrega Efectivo al conductor',
    label: 'Efectivo contraentrega',
    sublabel: 'Entrega directa de efectivo en la puerta de tu cocina',
    icon: Banknote,
  },
  {
    id: 'Contraentrega Transferencia Bancolombia / Bre-B',
    label: 'Transferencia Bancolombia / Bre-B',
    sublabel: 'Transfieres cuando recibas los bultos y escanees el QR',
    icon: CreditCard,
  },
  {
    id: 'Crédito Restaurante B2B (15 días)',
    label: 'Crédito Restaurante B2B (15 días)',
    sublabel: 'Sujeto a validación de NIT y cupo activo con Campo Vivo',
    icon: Building2,
  },
]

const FAQS = [
  {
    q: '¿Debo pagar por adelantado al hacer el pedido en la página?',
    a: 'No. Tu pedido queda reservado inmediatamente sin cobrar nada en línea. Pagas únicamente contraentrega cuando el camión llega a tu restaurante, verificas la calidad de los bultos, confirmas el peso en báscula y escaneas el código QR.',
  },
  {
    q: '¿Qué pasa si un bulto pesa menos de lo declarado en finca?',
    a: 'Nuestro sistema de custodia (Escrow) ajusta automáticamente el valor a pagar con base en el peso real en báscula al momento de la entrega. Nunca pagas de más por mermas.',
  },
  {
    q: '¿Cuál es el pedido mínimo y cuánto cuesta el flete?',
    a: 'Puedes pedir desde 1 bulto de cualquiera de las cosechas disponibles hoy. Al compartir ruta Milk-Run con otros restaurantes de tu zona, el flete es solidario ($9.500 por bulto), hasta 35% más bajo que un transporte tradicional.',
  },
  {
    q: '¿De dónde vienen exactamente los productos?',
    a: 'Trabajamos directamente con campesinos verificados de Boyacá (Ventaquemada, Aquitania, Samacá), Cundinamarca (Subachoque, Choachí, Fusagasugá), Antioquia y Eje Cafetero. Cada ficha muestra el nombre del productor, su finca y la altura en msnm.',
  },
  {
    q: '¿Entregan soporte o cuenta de cobro para mi contabilidad?',
    a: 'Sí. Al registrar tu NIT o Cédula en el pedido, tu restaurante queda en nuestro directorio y recibes soporte digital del lote, pesaje y comprobante de pago al momento de la entrega.',
  },
]

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function getProductImage(product: string): string {
  const lower = product.toLowerCase()
  if (
    lower.includes('papa') ||
    lower.includes('criolla') ||
    lower.includes('pastusa') ||
    lower.includes('sabanera') ||
    lower.includes('yuca')
  ) {
    return '/images/papa-pastusa.png'
  }
  if (
    lower.includes('zanahoria') ||
    lower.includes('cebolla') ||
    lower.includes('remolacha') ||
    lower.includes('arracacha') ||
    lower.includes('apio')
  ) {
    return '/images/zanahoria-cebolla.png'
  }
  if (
    lower.includes('tomate') ||
    lower.includes('arveja') ||
    lower.includes('frijol') ||
    lower.includes('fríjol') ||
    lower.includes('habichuela') ||
    lower.includes('piment') ||
    lower.includes('chonto')
  ) {
    return '/images/tomate-arveja.png'
  }
  return '/images/hero-campo.png'
}

function shortRegion(corridor: string): string {
  if (corridor.toLowerCase().includes('boyac') || corridor.toLowerCase().includes('cundi')) {
    return 'Boyacá y Cundinamarca'
  }
  if (corridor.toLowerCase().includes('antioq') || corridor.toLowerCase().includes('medell')) {
    return 'Oriente Antioqueño'
  }
  if (corridor.toLowerCase().includes('cafeter') || corridor.toLowerCase().includes('quind')) {
    return 'Eje Cafetero'
  }
  return corridor.split('→')[0]?.trim() || corridor
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalogo' | 'nosotros'>('catalogo')
  const [offers, setOffers] = useState<CatalogOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('Todas')
  const [selectedQuality, setSelectedQuality] = useState('Todas')

  // Card steppers
  const [cardQty, setCardQty] = useState<Record<string, number>>({})

  // Cart & Drawer
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Checkout Customer Form
  const [restaurantName, setRestaurantName] = useState('')
  const [contactName, setContactName] = useState('')
  const [docId, setDocId] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Bogotá D.C.')
  const [address, setAddress] = useState('')
  const [deliverySlot, setDeliverySlot] = useState(DELIVERY_SLOTS[0])
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Confirmation modal
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null)

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev))
    }, 3200)
  }

  const fetchCatalog = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await axios.get<CatalogOffer[]>(`${API_BASE}/catalog/`)
      setOffers(res.data)
    } catch {
      setErrorMsg(
        'No pudimos conectar con el centro de acopio en este momento. Verifica tu conexión o intenta de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCatalog()
  }, [])

  const regions = useMemo(() => {
    const unique = Array.from(new Set(offers.map((o) => shortRegion(o.corridor))))
    return ['Todas', ...unique]
  }, [offers])

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesSearch =
        !searchQuery.trim() ||
        offer.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.municipio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.farmerName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRegion =
        selectedRegion === 'Todas' || shortRegion(offer.corridor) === selectedRegion

      const matchesQuality =
        selectedQuality === 'Todas' ||
        offer.validatedQuality.toLowerCase() === selectedQuality.toLowerCase()

      return matchesSearch && matchesRegion && matchesQuality
    })
  }, [offers, searchQuery, selectedRegion, selectedQuality])

  const getQtyForCard = (offerId: string) => cardQty[offerId] ?? 1

  const updateCardQty = (offerId: string, maxBultos: number, delta: number) => {
    setCardQty((prev) => {
      const next = Math.max(1, Math.min(maxBultos, (prev[offerId] ?? 1) + delta))
      return { ...prev, [offerId]: next }
    })
  }

  const addToCart = (offer: CatalogOffer, openDrawer = false) => {
    const qtyToAdd = getQtyForCard(offer.id)
    setCart((prev) => {
      const existing = prev.find((item) => item.offer.id === offer.id)
      if (existing) {
        const merged = Math.min(offer.bultos, existing.qtyBultos + qtyToAdd)
        return prev.map((item) =>
          item.offer.id === offer.id ? { ...item, qtyBultos: merged } : item
        )
      }
      return [...prev, { offer, qtyBultos: Math.min(offer.bultos, qtyToAdd) }]
    })
    showToast(`Agregaste ${qtyToAdd} bulto(s) de ${offer.product} a tu pedido`)
    if (openDrawer) setCartOpen(true)
  }

  const updateCartItemQty = (offerId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.offer.id !== offerId) return item
          const next = item.qtyBultos + delta
          if (next <= 0) return null
          return { ...item, qtyBultos: Math.min(item.offer.bultos, next) }
        })
        .filter((x): x is CartItem => x !== null)
    )
  }

  const removeCartItem = (offerId: string) => {
    setCart((prev) => prev.filter((item) => item.offer.id !== offerId))
  }

  // Cart Totals
  const cartSummary = useMemo(() => {
    let totalBultos = 0
    let totalKg = 0
    let subtotalProduct = 0
    let marketTotal = 0
    for (const item of cart) {
      totalBultos += item.qtyBultos
      const kgPerBulto = item.offer.weightKg / Math.max(1, item.offer.bultos)
      totalKg += Math.round(kgPerBulto * item.qtyBultos)
      subtotalProduct += item.offer.pricePerBultoCop * item.qtyBultos
      marketTotal +=
        Math.max(item.offer.marketRefPriceCop, item.offer.pricePerBultoCop) * item.qtyBultos
    }
    const freightCop = totalBultos * 9500
    const grandTotalCop = subtotalProduct + freightCop
    const totalSavingsCop = Math.max(0, marketTotal - subtotalProduct)
    return {
      totalBultos,
      totalKg,
      subtotalProduct,
      freightCop,
      grandTotalCop,
      marketTotal,
      totalSavingsCop,
    }
  }, [cart])

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (cart.length === 0) {
      setFormError('Tu canasta está vacía. Agrega al menos una cosecha.')
      return
    }
    if (
      !restaurantName.trim() ||
      !contactName.trim() ||
      !docId.trim() ||
      !phone.trim() ||
      !city.trim() ||
      !address.trim()
    ) {
      setFormError('Por favor completa todos los datos del restaurante y dirección de entrega.')
      return
    }

    setSubmitting(true)
    try {
      const createdOrders: OrderConfirmation['orders'] = []
      for (const item of cart) {
        const res = await axios.post(`${API_BASE}/catalog/order/`, {
          offerId: item.offer.id,
          bultos: item.qtyBultos,
          restaurantName: restaurantName.trim(),
          contactName: contactName.trim(),
          docId: docId.trim(),
          phone: phone.trim(),
          city: city.trim(),
          address: address.trim(),
          deliverySlot,
          paymentMethod,
        })
        createdOrders.push({
          orderId: res.data.order.id,
          qrCode: res.data.qrCode,
          product: item.offer.product,
          bultos: item.qtyBultos,
          farmerName: item.offer.farmerName,
          totalCop: item.qtyBultos * item.offer.pricePerBultoCop + item.qtyBultos * 9500,
        })
      }

      setConfirmation({
        orders: createdOrders,
        restaurantName: restaurantName.trim(),
        contactName: contactName.trim(),
        docId: docId.trim(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
        deliverySlot,
        paymentMethod,
        grandTotalCop: cartSummary.grandTotalCop,
        totalSavingsCop: cartSummary.totalSavingsCop,
      })
      setCart([])
      setCartOpen(false)
      await fetchCatalog()
    } catch (err: unknown) {
      const detail =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : 'Ocurrió un error al registrar tu pedido. Verifica el stock disponible e intenta nuevamente.'
      setFormError(detail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-tierra-50 text-tierra-900 pb-24 md:pb-12">
      {/* Top Promo Strip */}
      <div className="bg-tierra-900 text-tierra-100 text-xs py-2 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <span className="inline-flex items-center gap-1.5 font-medium text-campo-300">
            <Sprout className="w-3.5 h-3.5" /> Cosecha recién sacada del surco hoy
          </span>
          <span className="hidden sm:inline text-tierra-500">•</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-campo-400" /> Pago 100% contraentrega con báscula verificada
          </span>
          <span className="hidden md:inline text-tierra-500">•</span>
          <span className="hidden md:inline-flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-300" /> Despacho directo a tu restaurante
          </span>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-30 bg-tierra-50/95 backdrop-blur-md border-b border-tierra-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand */}
          <button
            onClick={() => {
              setActiveTab('catalogo')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-campo-600 to-campo-800 text-white flex items-center justify-center shadow-md shadow-campo-800/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="block font-serif text-lg sm:text-xl font-bold tracking-tight text-tierra-900 leading-none">
                Campo Vivo
              </span>
              <span className="block text-[11px] sm:text-xs font-medium text-campo-700 mt-0.5">
                Finca &amp; Fogón • Mercado Directo
              </span>
            </div>
          </button>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center bg-tierra-100/90 p-1 rounded-2xl border border-tierra-200">
            <button
              onClick={() => setActiveTab('catalogo')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'catalogo'
                  ? 'bg-campo-700 text-white shadow-sm'
                  : 'text-tierra-700 hover:text-tierra-900 hover:bg-tierra-200/60'
              }`}
            >
              <Leaf className="w-4 h-4" />
              Catálogo de Hoy
            </button>
            <button
              onClick={() => setActiveTab('nosotros')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'nosotros'
                  ? 'bg-campo-700 text-white shadow-sm'
                  : 'text-tierra-700 hover:text-tierra-900 hover:bg-tierra-200/60'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              Quiénes Somos
            </button>
          </nav>

          {/* Right Cart Trigger */}
          <div className="flex items-center gap-2.5">
            <a
              href="https://wa.me/573104508821?text=Hola%20Campo%20Vivo%2C%20quiero%20hacer%20un%20pedido%20para%20mi%20restaurante"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-tierra-300 bg-white hover:bg-tierra-100 text-tierra-800 text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-campo-600" />
              Asesoría WhatsApp
            </a>
            <button
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-tierra-900 hover:bg-tierra-800 text-tierra-50 font-semibold text-sm shadow-md shadow-tierra-900/15 transition-all active:scale-95"
            >
              <ShoppingBasket className="w-5 h-5 text-campo-300" />
              <span className="hidden sm:inline">Mi Pedido</span>
              {cartSummary.totalBultos > 0 && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-campo-500 text-white text-xs font-bold tabular-nums">
                  {cartSummary.totalBultos}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 sm:top-24 right-4 left-4 sm:left-auto z-50 flex items-center gap-2.5 bg-campo-800 text-white px-4 py-3 rounded-2xl shadow-xl border border-campo-500/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-campo-300 shrink-0" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* ==================== TAB 1: CATÁLOGO DE HOY (FIRST VIEW) ==================== */}
      {activeTab === 'catalogo' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 space-y-7">
          {/* Atmospheric Farm Hero Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-tierra-900 text-white shadow-xl border border-tierra-800">
            <img
              src="/images/hero-campo.png"
              alt="Montañas y cultivos campesinos de Colombia"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-tierra-950/92 via-tierra-900/75 to-tierra-900/35" />

            <div className="relative z-10 p-6 sm:p-10 lg:p-12 grid lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-campo-600/30 border border-campo-400/40 backdrop-blur-sm text-campo-200 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Cosecha Fresca Directa • Sin Intermediarios de Corabastos
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-tierra-50">
                  Del surco colombiano directo a la cocina de tu restaurante.
                </h1>
                <p className="text-tierra-200 text-sm sm:text-base max-w-2xl leading-relaxed">
                  Compra bultos seleccionados directamente a familias campesinas de Boyacá,
                  Cundinamarca y Antioquia.{' '}
                  <strong className="text-white">No pagas nada ahora:</strong> cancelas al recibir
                  en tu restaurante después de verificar peso en báscula.
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href="#cosechas-disponibles"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-campo-500 hover:bg-campo-400 text-white font-semibold text-sm shadow-lg shadow-campo-900/30 transition-all"
                  >
                    Ver Cosechas de Hoy
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setActiveTab('nosotros')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm transition-all"
                  >
                    Conoce nuestra historia
                  </button>
                </div>
              </div>

              {/* Right Quick Trust Box */}
              <div className="lg:col-span-4 bg-tierra-950/75 backdrop-blur-md border border-tierra-700/60 rounded-2xl p-5 space-y-3.5">
                <p className="text-xs uppercase tracking-wider font-bold text-campo-300">
                  Garantía Finca &amp; Fogón
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-campo-500/20 text-campo-300 shrink-0">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Pago contraentrega justo</p>
                      <p className="text-xs text-tierra-300">
                        Si falta peso en báscula, se descuenta en el acto.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Cosechado hace horas</p>
                      <p className="text-xs text-tierra-300">
                        Llega más fresco y dura hasta 5 días más en cocina.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Trazabilidad con código QR</p>
                      <p className="text-xs text-tierra-300">
                        Sabes qué finca, qué campesino y qué camión te entrega.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Search & Filter Toolbar */}
          <section
            id="cosechas-disponibles"
            className="bg-white rounded-3xl p-4 sm:p-5 border border-tierra-200/90 shadow-sm space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-bold text-tierra-900 flex items-center gap-2">
                  Cosechas Disponibles Hoy
                  <span className="text-xs font-sans font-semibold px-2.5 py-1 rounded-full bg-campo-100 text-campo-800 tabular-nums">
                    {filteredOffers.length} lotes activos
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-tierra-600 mt-0.5">
                  Precios directos de finca actualizados en vivo desde nuestros corredores rurales.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search className="w-4 h-4 text-tierra-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar papa, zanahoria, finca..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-tierra-200 bg-tierra-50/70 text-sm focus:outline-none focus:ring-2 focus:ring-campo-500/40 focus:border-campo-600"
                  />
                </div>
                <button
                  onClick={fetchCatalog}
                  title="Actualizar stock en vivo"
                  className="p-2.5 rounded-2xl border border-tierra-200 bg-tierra-50 hover:bg-tierra-100 text-tierra-700 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Region & Quality Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-tierra-100">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-semibold text-tierra-500 shrink-0">Origen:</span>
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedRegion === region
                        ? 'bg-tierra-900 text-tierra-50 shadow-sm'
                        : 'bg-tierra-100 text-tierra-700 hover:bg-tierra-200/80'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-semibold text-tierra-500 shrink-0">Calidad:</span>
                {['Todas', 'Extra', 'Primera', 'Segunda'].map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuality(q)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedQuality === q
                        ? 'bg-campo-700 text-white shadow-sm'
                        : 'bg-campo-50 text-campo-800 hover:bg-campo-100'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Error State */}
          {errorMsg && (
            <div className="rounded-3xl bg-red-50 border border-red-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="text-sm font-medium">{errorMsg}</p>
              </div>
              <button
                onClick={fetchCatalog}
                className="px-4 py-2 rounded-xl bg-red-700 text-white text-sm font-semibold hover:bg-red-800 transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && !errorMsg && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl bg-white border border-tierra-200 overflow-hidden animate-pulse"
                >
                  <div className="h-52 bg-tierra-200/70" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-tierra-200 rounded w-2/3" />
                    <div className="h-4 bg-tierra-100 rounded w-1/2" />
                    <div className="h-10 bg-tierra-200/60 rounded-xl w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !errorMsg && filteredOffers.length === 0 && (
            <div className="rounded-3xl bg-white border border-tierra-200 p-10 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-tierra-100 text-tierra-600 flex items-center justify-center">
                <Sprout className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-xl font-bold text-tierra-900">
                No encontramos cosechas con esos filtros
              </h3>
              <p className="text-sm text-tierra-600 max-w-md mx-auto">
                Prueba limpiar tu búsqueda o seleccionar otra región. Las cosechas se publican
                constantemente conforme los campesinos confirman su recolección.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedRegion('Todas')
                  setSelectedQuality('Todas')
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-campo-700 text-white text-sm font-semibold hover:bg-campo-800"
              >
                Ver todas las cosechas
              </button>
            </div>
          )}

          {/* Product Grid */}
          {!loading && !errorMsg && filteredOffers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => {
                const qty = getQtyForCard(offer.id)
                const kgPerBulto = Math.round(offer.weightKg / Math.max(1, offer.bultos))
                const savingsPct =
                  offer.marketRefPriceCop > offer.pricePerBultoCop
                    ? Math.round(
                        ((offer.marketRefPriceCop - offer.pricePerBultoCop) /
                          offer.marketRefPriceCop) *
                          100
                      )
                    : 0

                return (
                  <article
                    key={offer.id}
                    className="group bg-white rounded-3xl border border-tierra-200/90 shadow-sm hover:shadow-xl hover:border-campo-300 transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    {/* Product Photography */}
                    <div className="relative h-56 overflow-hidden bg-tierra-100">
                      <img
                        src={getProductImage(offer.product)}
                        alt={offer.product}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-tierra-950/75 via-transparent to-black/20" />

                      {/* Top Badges */}
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/95 text-tierra-900 text-xs font-bold shadow-sm">
                          Calidad {offer.validatedQuality}
                        </span>
                        {savingsPct > 0 && (
                          <span className="px-3 py-1 rounded-full bg-campo-600 text-white text-xs font-bold shadow-sm tabular-nums">
                            Ahorra {savingsPct}%
                          </span>
                        )}
                      </div>

                      {/* Bottom Origin Overlay */}
                      <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white">
                        <div>
                          <p className="text-[11px] text-tierra-200 flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-campo-300" />
                            {offer.vereda}, {offer.municipio}
                          </p>
                          <p className="font-serif text-lg font-bold leading-snug">
                            {offer.product}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/45 backdrop-blur-sm text-[11px] font-semibold text-tierra-100 tabular-nums shrink-0">
                          <Mountain className="w-3 h-3 text-campo-300" />
                          {offer.altitudeMsnm} m
                        </span>
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        {/* Farmer & Farm */}
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-tierra-100">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-tierra-500 truncate">
                              {offer.farmName}
                            </p>
                            <p className="text-sm font-bold text-tierra-900 truncate">
                              Prod. {offer.farmerName}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {offer.farmerScore.toFixed(1)}
                          </div>
                        </div>

                        {/* Stock & Weight Pills */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-2xl bg-tierra-50 border border-tierra-200/70 px-3 py-2">
                            <span className="block text-tierra-500 text-[11px]">Disponible</span>
                            <span className="font-bold text-tierra-900 tabular-nums">
                              {offer.bultos} bultos (~{kgPerBulto} kg)
                            </span>
                          </div>
                          <div className="rounded-2xl bg-tierra-50 border border-tierra-200/70 px-3 py-2">
                            <span className="block text-tierra-500 text-[11px]">Recolección</span>
                            <span className="font-bold text-campo-800 truncate block">
                              {offer.pickupWindow}
                            </span>
                          </div>
                        </div>

                        {/* Price Comparison */}
                        <div className="flex items-end justify-between pt-1">
                          <div>
                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-campo-700">
                              Precio Finca Directo
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-extrabold text-tierra-900 tabular-nums">
                                {formatCop(offer.pricePerBultoCop)}
                              </span>
                              <span className="text-xs text-tierra-500">/ bulto</span>
                            </div>
                          </div>
                          {offer.marketRefPriceCop > offer.pricePerBultoCop && (
                            <div className="text-right">
                              <span className="block text-[10px] text-tierra-400">
                                Ref. Corabastos
                              </span>
                              <span className="text-xs font-semibold text-tierra-400 line-through tabular-nums">
                                {formatCop(offer.marketRefPriceCop)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper + Add Actions */}
                      <div className="space-y-2.5 pt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-tierra-300 rounded-2xl bg-tierra-50 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateCardQty(offer.id, offer.bultos, -1)}
                              className="p-2.5 hover:bg-tierra-200/70 text-tierra-800 transition-colors"
                              aria-label="Restar bulto"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center text-sm font-bold tabular-nums">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCardQty(offer.id, offer.bultos, 1)}
                              className="p-2.5 hover:bg-tierra-200/70 text-tierra-800 transition-colors"
                              aria-label="Sumar bulto"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => addToCart(offer, false)}
                            className="flex-1 py-2.5 px-4 rounded-2xl bg-campo-700 hover:bg-campo-800 text-white font-semibold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            <ShoppingBasket className="w-4 h-4" />
                            Agregar
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => addToCart(offer, true)}
                          className="w-full py-2 rounded-xl text-xs font-bold text-tierra-700 hover:text-tierra-900 hover:bg-tierra-100 border border-dashed border-tierra-300 transition-colors"
                        >
                          Pedir ahora contraentrega →
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>
      )}

      {/* ==================== TAB 2: QUIÉNES SOMOS ==================== */}
      {activeTab === 'nosotros' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-10">
          {/* Editorial Mission Hero */}
          <section className="grid lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-6 sm:p-10 border border-tierra-200 shadow-sm">
            <div className="lg:col-span-6 space-y-5">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-campo-100 text-campo-800 text-xs font-bold">
                <Sprout className="w-4 h-4" /> Nuestra Razón de Ser
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-tierra-900 leading-tight">
                Acortamos la distancia entre las manos campesinas y los mejores fogones de la ciudad.
              </h1>
              <p className="text-tierra-700 leading-relaxed text-sm sm:text-base">
                En Colombia, hasta el <strong>45% del valor</strong> de una cosecha se pierde entre
                4 o 5 intermediarios antes de llegar a un restaurante. El campesino recibe poco y el
                cocinero recibe producto golpeado tras días en bodegas.
              </p>
              <p className="text-tierra-700 leading-relaxed text-sm sm:text-base">
                <strong>Campo Vivo — Finca &amp; Fogón</strong> nació para cambiar esa historia:
                digitalizamos las cosechas por notas de voz en WhatsApp desde la vereda, coordinamos
                camiones rurales verificados (Milk-Run) y garantizamos el pago justo mediante báscula
                y código QR en la puerta de tu restaurante.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setActiveTab('catalogo')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-campo-700 hover:bg-campo-800 text-white font-semibold text-sm shadow-md transition-all"
                >
                  Explorar Cosechas de Hoy
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-lg aspect-[4/3]">
                <img
                  src="/images/hero-campo.png"
                  alt="Cultivos campesinos en las montañas de Colombia"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-tierra-950/80 backdrop-blur-md text-white p-4 rounded-2xl border border-white/15">
                  <p className="text-xs font-semibold text-campo-300">Red Rural Activa</p>
                  <p className="text-sm font-medium mt-0.5">
                    Boyacá • Cundinamarca • Oriente Antioqueño • Eje Cafetero
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4 Impact Metrics */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                stat: '+38%',
                title: 'Más ingreso campesino',
                desc: 'Pago neto directo a la billetera Nequi o Daviplata del productor.',
              },
              {
                stat: '-22%',
                title: 'Ahorro en tu cocina',
                desc: 'Comparado frente a precios mayoristas tradicionales con intermediarios.',
              },
              {
                stat: '< 6 h',
                title: 'Del surco al fogón',
                desc: 'Recolección en la madrugada y entrega fresca el mismo día.',
              },
              {
                stat: '100%',
                title: 'Pesaje con respaldo',
                desc: 'Pagas contraentrega después de verificar peso real y calidad.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-tierra-900 text-tierra-50 rounded-3xl p-5 sm:p-6 border border-tierra-800 shadow-sm"
              >
                <p className="font-serif text-3xl sm:text-4xl font-bold text-campo-400 tabular-nums">
                  {item.stat}
                </p>
                <p className="font-bold text-sm sm:text-base mt-2 text-white">{item.title}</p>
                <p className="text-xs text-tierra-300 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </section>

          {/* 3-Step Visual Journey */}
          <section className="space-y-5">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-tierra-900">
                ¿Cómo funciona Campo Vivo?
              </h2>
              <p className="text-sm text-tierra-600 mt-1">
                Tres pasos transparentes para que tu cocina reciba cosecha de primera calidad sin
                riesgos.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  img: '/images/papa-pastusa.png',
                  title: 'Cosecha Verificada en Finca',
                  desc: 'Al amanecer, nuestros campesinos reportan por WhatsApp sus bultos disponibles con fotos reales y ubicación GPS de la vereda.',
                },
                {
                  step: '02',
                  img: '/images/zanahoria-cebolla.png',
                  title: 'Ruta Rural Compartida (Milk-Run)',
                  desc: 'Agrupamos pedidos de restaurantes cercanos en camiones verificados con SOAT y rastreo en vivo para reducir el flete.',
                },
                {
                  step: '03',
                  img: '/images/tomate-arveja.png',
                  title: 'Pesaje y Pago Contraentrega',
                  desc: 'Al llegar a tu restaurante pesas el producto, escaneas el QR de conformidad y pagas con Nequi, Daviplata, transferencia o efectivo.',
                },
              ].map((card) => (
                <div
                  key={card.step}
                  className="bg-white rounded-3xl overflow-hidden border border-tierra-200 shadow-sm flex flex-col"
                >
                  <div className="relative h-48">
                    <img src={card.img} alt={card.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3.5 left-3.5 w-10 h-10 rounded-2xl bg-tierra-900/90 text-campo-300 font-serif font-bold text-lg flex items-center justify-center shadow">
                      {card.step}
                    </span>
                  </div>
                  <div className="p-5 space-y-2 flex-1">
                    <h3 className="font-serif text-lg font-bold text-tierra-900">{card.title}</h3>
                    <p className="text-sm text-tierra-600 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Accordion */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-tierra-200 shadow-sm space-y-5">
            <div>
              <h2 className="font-serif text-2xl font-bold text-tierra-900">
                Preguntas Frecuentes para Restaurantes
              </h2>
              <p className="text-sm text-tierra-600 mt-0.5">
                Todo lo que necesitas saber sobre entregas, pagos contraentrega y garantía de peso.
              </p>
            </div>

            <div className="divide-y divide-tierra-200">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index
                return (
                  <div key={faq.q} className="py-4 first:pt-1 last:pb-1">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between gap-4 text-left"
                    >
                      <span className="font-semibold text-sm sm:text-base text-tierra-900">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-campo-700 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-tierra-500 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <p className="mt-2.5 text-sm text-tierra-600 leading-relaxed pr-6">
                        {faq.a}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 mt-14 pt-8 border-t border-tierra-200 text-xs text-tierra-600 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Sprout className="w-4 h-4 text-campo-700" />
          <span className="font-semibold text-tierra-800">Campo Vivo — Finca &amp; Fogón</span>
          <span>• Comercio justo del campo colombiano</span>
        </div>
        <p className="text-tierra-500">
          Atención a restaurantes: Lun–Sáb 4:30 AM a 6:00 PM (Colombia)
        </p>
      </footer>

      {/* Floating WhatsApp Button (Desktop) */}
      <a
        href="https://wa.me/573104508821?text=Hola%20Campo%20Vivo%2C%20necesito%20ayuda%20con%20un%20pedido"
        target="_blank"
        rel="noreferrer"
        className="hidden md:flex fixed bottom-6 right-6 z-30 items-center gap-2.5 px-4 py-3 rounded-full bg-campo-600 hover:bg-campo-700 text-white font-semibold text-sm shadow-xl shadow-campo-900/25 transition-all hover:scale-105"
      >
        <MessageCircle className="w-5 h-5" />
        WhatsApp Directo
      </a>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-tierra-200 px-3 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(42,26,14,0.08)]">
        <button
          onClick={() => {
            setActiveTab('catalogo')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-semibold ${
            activeTab === 'catalogo' ? 'text-campo-700' : 'text-tierra-500'
          }`}
        >
          <Leaf className="w-5 h-5" />
          Catálogo
        </button>

        <button
          onClick={() => setCartOpen(true)}
          className="relative flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-semibold text-tierra-800"
        >
          <ShoppingBasket className="w-5 h-5 text-campo-700" />
          Mi Pedido
          {cartSummary.totalBultos > 0 && (
            <span className="absolute -top-0.5 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-campo-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
              {cartSummary.totalBultos}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('nosotros')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-semibold ${
            activeTab === 'nosotros' ? 'text-campo-700' : 'text-tierra-500'
          }`}
        >
          <HeartHandshake className="w-5 h-5" />
          Nosotros
        </button>

        <a
          href="https://wa.me/573104508821?text=Hola%20Campo%20Vivo%2C%20quiero%20hacer%20un%20pedido"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-semibold text-campo-700"
        >
          <MessageCircle className="w-5 h-5" />
          WhatsApp
        </a>
      </nav>

      {/* ==================== CART & CHECKOUT CONTRAENTREGA DRAWER ==================== */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-tierra-950/60 backdrop-blur-sm">
          <div
            className="flex-1"
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
          />
          <div className="w-full max-w-xl bg-tierra-50 h-full shadow-2xl flex flex-col overflow-hidden border-l border-tierra-200">
            {/* Drawer Header */}
            <div className="px-5 py-4 bg-tierra-900 text-tierra-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingBasket className="w-5 h-5 text-campo-400" />
                <div>
                  <h2 className="font-serif text-lg font-bold leading-none">
                    Tu Pedido Contraentrega
                  </h2>
                  <p className="text-[11px] text-tierra-300 mt-1">
                    {cartSummary.totalBultos} bultos • ~{cartSummary.totalKg} kg estimados
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-tierra-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-tierra-100 text-tierra-500 flex items-center justify-center">
                    <ShoppingBasket className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-tierra-900">
                    Tu canasta está vacía
                  </h3>
                  <p className="text-sm text-tierra-600 max-w-xs mx-auto">
                    Agrega los bultos que necesita tu cocina hoy y agenda la entrega directa sin
                    pagar por adelantado.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="px-5 py-2.5 rounded-2xl bg-campo-700 text-white text-sm font-semibold hover:bg-campo-800"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                <>
                  {/* Selected Lots */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-tierra-500">
                      1. Cosechas Seleccionadas
                    </h3>
                    {cart.map((item) => (
                      <div
                        key={item.offer.id}
                        className="bg-white rounded-2xl p-3.5 border border-tierra-200 flex items-center gap-3.5 shadow-sm"
                      >
                        <img
                          src={getProductImage(item.offer.product)}
                          alt={item.offer.product}
                          className="w-16 h-16 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-tierra-900 truncate">
                            {item.offer.product}
                          </p>
                          <p className="text-[11px] text-tierra-500 truncate">
                            {item.offer.farmName} • {item.offer.municipio}
                          </p>
                          <p className="text-xs font-bold text-campo-700 mt-1 tabular-nums">
                            {formatCop(item.offer.pricePerBultoCop * item.qtyBultos)}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.offer.id)}
                            className="text-tierra-400 hover:text-red-600 transition-colors"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="flex items-center border border-tierra-200 rounded-xl bg-tierra-50">
                            <button
                              type="button"
                              onClick={() => updateCartItemQty(item.offer.id, -1)}
                              className="p-1.5 hover:bg-tierra-200/70"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center text-xs font-bold tabular-nums">
                              {item.qtyBultos}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartItemQty(item.offer.id, 1)}
                              className="p-1.5 hover:bg-tierra-200/70"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Savings Calculator */}
                  <div className="bg-campo-50 border border-campo-200 rounded-2xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-tierra-700">
                      <span>Subtotal cosecha ({cartSummary.totalBultos} bultos)</span>
                      <span className="font-semibold tabular-nums">
                        {formatCop(cartSummary.subtotalProduct)}
                      </span>
                    </div>
                    <div className="flex justify-between text-tierra-700">
                      <span>Flete rural compartido Milk-Run</span>
                      <span className="font-semibold tabular-nums">
                        {formatCop(cartSummary.freightCop)}
                      </span>
                    </div>
                    {cartSummary.totalSavingsCop > 0 && (
                      <div className="flex justify-between text-campo-800 font-semibold pt-1 border-t border-campo-200/70">
                        <span>Ahorro estimado vs. Corabastos</span>
                        <span className="tabular-nums">
                          +{formatCop(cartSummary.totalSavingsCop)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-extrabold text-tierra-900 pt-2 border-t border-campo-300/70">
                      <span>Total a pagar al recibir</span>
                      <span className="tabular-nums text-campo-800">
                        {formatCop(cartSummary.grandTotalCop)}
                      </span>
                    </div>
                  </div>

                  {/* Contraentrega Trust Callout */}
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-950 leading-relaxed">
                      <strong>Pago 100% Contraentrega:</strong> No te cobramos ahora. Tu pedido entra
                      directo a la torre de despacho y solo pagas cuando el camión llegue a tu
                      restaurante y confirmes el peso en báscula.
                    </div>
                  </div>

                  {/* Customer & Restaurant Delivery Form */}
                  <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-tierra-500">
                      2. Datos del Restaurante y Entrega
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block space-y-1">
                        <span className="text-xs font-semibold text-tierra-700 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-campo-700" />
                          Nombre del Restaurante *
                        </span>
                        <input
                          type="text"
                          required
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          placeholder="Ej. Fogón de la Abuela"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-tierra-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-campo-500/40"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-xs font-semibold text-tierra-700 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-campo-700" />
                          Persona que recibe *
                        </span>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Ej. Chef Camila Rojas"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-tierra-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-campo-500/40"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-xs font-semibold text-tierra-700 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-campo-700" />
                          NIT o Cédula *
                        </span>
                        <input
                          type="text"
                          required
                          value={docId}
                          onChange={(e) => setDocId(e.target.value)}
                          placeholder="Ej. NIT 901.445.210-3"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-tierra-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-campo-500/40"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-xs font-semibold text-tierra-700 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-campo-700" />
                          WhatsApp de contacto *
                        </span>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ej. +57 315 842 1900"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-tierra-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-campo-500/40"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-xs font-semibold text-tierra-700 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-campo-700" />
                          Ciudad / Municipio *
                        </span>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Ej. Bogotá D.C."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-tierra-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-campo-500/40"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-xs font-semibold text-tierra-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-campo-700" />
                          Franja de Entrega *
                        </span>
                        <select
                          value={deliverySlot}
                          onChange={(e) => setDeliverySlot(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-tierra-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-campo-500/40"
                        >
                          {DELIVERY_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-tierra-700 flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-campo-700" />
                        Dirección exacta del restaurante, barrio y puerta de descargue *
                      </span>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej. Calle 70 # 9-42, Quinta Camacho — puerta lateral de cocina"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-tierra-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-campo-500/40"
                      />
                    </label>

                    {/* Payment Method Selector */}
                    <div className="space-y-2.5 pt-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-tierra-500">
                        3. ¿Cómo prefieres pagar al recibir el pedido?
                      </h3>
                      <div className="space-y-2">
                        {PAYMENT_METHODS.map((pm) => {
                          const Icon = pm.icon
                          const active = paymentMethod === pm.id
                          return (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => setPaymentMethod(pm.id)}
                              className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                                active
                                  ? 'bg-campo-50 border-campo-600 ring-2 ring-campo-500/20'
                                  : 'bg-white border-tierra-200 hover:border-tierra-300'
                              }`}
                            >
                              <div
                                className={`p-2 rounded-xl shrink-0 ${
                                  active
                                    ? 'bg-campo-700 text-white'
                                    : 'bg-tierra-100 text-tierra-600'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-tierra-900">{pm.label}</p>
                                <p className="text-xs text-tierra-600">{pm.sublabel}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {formError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {formError}
                      </div>
                    )}
                  </form>
                </>
              )}
            </div>

            {/* Sticky Submit Footer */}
            {cart.length > 0 && (
              <div className="p-4 bg-white border-t border-tierra-200 shrink-0">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className="w-full py-3.5 px-5 rounded-2xl bg-campo-700 hover:bg-campo-800 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-campo-800/20 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Enviando pedido a Torre de Despacho...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Confirmar Pedido Contraentrega ({formatCop(cartSummary.grandTotalCop)})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== ORDER CONFIRMATION & QR MODAL ==================== */}
      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tierra-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-tierra-200">
            <div className="bg-gradient-to-br from-campo-700 to-campo-900 p-6 text-white text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-white/15 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-campo-200" />
              </div>
              <h2 className="font-serif text-2xl font-bold">¡Pedido Programado con Éxito!</h2>
              <p className="text-xs sm:text-sm text-campo-100">
                Ya notificamos a nuestra torre de despacho. Pagas únicamente cuando llegue el camión.
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Delivery Summary */}
              <div className="bg-tierra-50 rounded-2xl p-4 border border-tierra-200 space-y-1.5 text-xs">
                <p className="font-bold text-tierra-900 text-sm">{confirmation.restaurantName}</p>
                <p className="text-tierra-700">
                  <strong>Recibe:</strong> {confirmation.contactName} ({confirmation.docId})
                </p>
                <p className="text-tierra-700">
                  <strong>Dirección:</strong> {confirmation.address}, {confirmation.city}
                </p>
                <p className="text-tierra-700">
                  <strong>WhatsApp:</strong> {confirmation.phone}
                </p>
                <p className="text-tierra-700">
                  <strong>Franja:</strong> {confirmation.deliverySlot}
                </p>
                <p className="text-campo-800 font-semibold pt-1">
                  <strong>Pago al entregar:</strong> {confirmation.paymentMethod}
                </p>
              </div>

              {/* QR Codes List */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-tierra-500">
                  Códigos QR de Recepción y Báscula
                </p>
                {confirmation.orders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="rounded-2xl border border-tierra-200 p-3.5 flex items-center justify-between gap-3 bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-tierra-900 text-campo-300 flex items-center justify-center shrink-0">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-tierra-900 truncate">
                          {ord.bultos} bultos • {ord.product}
                        </p>
                        <p className="text-[11px] font-mono text-campo-700 font-semibold truncate">
                          {ord.qrCode}
                        </p>
                        <p className="text-[11px] text-tierra-500">Finca: {ord.farmerName}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-tierra-900 tabular-nums shrink-0">
                      {formatCop(ord.totalCop)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="rounded-2xl bg-campo-50 border border-campo-200 p-4 flex items-center justify-between">
                <div>
                  <span className="block text-xs text-campo-800 font-semibold">
                    Total a cancelar contraentrega
                  </span>
                  {confirmation.totalSavingsCop > 0 && (
                    <span className="text-[11px] text-campo-700">
                      Ahorraste {formatCop(confirmation.totalSavingsCop)} directo de finca
                    </span>
                  )}
                </div>
                <span className="text-xl font-extrabold text-campo-900 tabular-nums">
                  {formatCop(confirmation.grandTotalCop)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="w-full py-3 rounded-2xl bg-tierra-900 hover:bg-tierra-800 text-white font-bold text-sm transition-colors"
              >
                Volver al Catálogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
