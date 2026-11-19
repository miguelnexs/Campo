import React, { useState } from 'react'
import { Sprout, Lock, User, Eye, EyeOff, ShieldCheck, Truck, AlertCircle, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useAgroControl } from '../context/AgroControlContext'

export function LoginPage() {
  const { login } = useAgroControl()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const performLogin = async (u: string, p: string) => {
    setErrorMsg(null)
    setSubmitting(true)
    try {
      await login(u, p)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setErrorMsg(String(err.response.data.detail))
      } else {
        setErrorMsg('No se pudo conectar con Django (:8001) o las credenciales son incorrectas.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Ingresa usuario y contraseña para continuar.')
      return
    }
    await performLogin(username.trim(), password.trim())
  }

  const handleQuickLogin = async (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    await performLogin(u, p)
  }

  return (
    <div className="min-h-screen w-screen bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle organic radial glow */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-emerald-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[460px] h-[460px] rounded-full bg-amber-700/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
        {/* Top Rustic Brand Header */}
        <div className="p-7 pb-6 bg-gradient-to-br from-emerald-900/50 via-card to-amber-950/40 border-b border-border text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <Sprout className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Campo Vivo — Finca &amp; Fogón
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Torre de Control Agro-Logística • Acceso Autenticado JWT
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3.5">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Usuario Operativo</span>
              <div className="relative">
                <User className="w-4 h-4 text-primary absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="miguel o despacho"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-secondary/70 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Contraseña</span>
              <div className="relative">
                <Lock className="w-4 h-4 text-primary absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-secondary/70 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando credenciales...
              </>
            ) : (
              'Ingresar a la Torre de Control'
            )}
          </button>

          {/* One-Click Preset Access */}
          <div className="pt-4 border-t border-border space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
              Acceso Rápido por Rol
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleQuickLogin('miguel', 'migel457')}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all"
              >
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  Miguel (Admin)
                </span>
                <span className="text-[10px] text-muted-foreground">Control total y pagos</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleQuickLogin('despacho', 'AgroRuta2026*')}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all"
              >
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Truck className="w-4 h-4" />
                  Despacho
                </span>
                <span className="text-[10px] text-muted-foreground">Rutas y moderación</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
