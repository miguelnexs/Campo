import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2, Sprout } from 'lucide-react'
import { ThemeProvider } from './components/ThemeProvider'
import { AgroControlProvider, useAgroControl } from './context/AgroControlContext'
import { MainLayout } from './layouts/MainLayout'
import { LoginPage } from './pages/LoginPage'
import { CommandCenterPage } from './pages/CommandCenterPage'
import { FarmerOffersPage } from './pages/FarmerOffersPage'
import { DispatchRoutesPage } from './pages/DispatchRoutesPage'
import { EscrowAuditPage } from './pages/EscrowAuditPage'
import { ActorsDirectoryPage } from './pages/ActorsDirectoryPage'

function AuthenticatedShell() {
  const { currentUser, authChecking } = useAgroControl()

  if (authChecking) {
    return (
      <div className="h-screen w-screen bg-background text-foreground flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
          <Sprout className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Cargando Torre de Control Campo Vivo...
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <LoginPage />
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<CommandCenterPage />} />
        <Route path="/ofertas" element={<FarmerOffersPage />} />
        <Route path="/despacho" element={<DispatchRoutesPage />} />
        <Route path="/pagos" element={<EscrowAuditPage />} />
        <Route path="/actores" element={<ActorsDirectoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  )
}

function App(): JSX.Element {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="campo-vivo-theme">
      <AgroControlProvider>
        <HashRouter>
          <AuthenticatedShell />
        </HashRouter>
      </AgroControlProvider>
    </ThemeProvider>
  )
}

export default App
