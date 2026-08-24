import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { useAuth } from '../contexts/AuthContext'
import { DashboardPage } from '../pages/Dashboard/DashboardPage'
import { LoginPage } from '../pages/Login/LoginPage'
import { ObrasSocialesPage } from '../pages/ObrasSociales/ObrasSocialesPage'
import { PacienteDetailPage } from '../pages/Pacientes/PacienteDetailPage'
import { PacientesPage } from '../pages/Pacientes/PacientesPage'
import { PlaceholderPage } from '../pages/Placeholder/PlaceholderPage'
import { SesionesPage } from '../pages/Sesiones/SesionesPage'
import { TratamientoDetailPage } from '../pages/Tratamientos/TratamientoDetailPage'
import { TratamientosPage } from '../pages/Tratamientos/TratamientosPage'
import { TurnosPage } from '../pages/Turnos/TurnosPage'
import { BoxesPage } from '../pages/Boxes/BoxesPage'
import { CajaPage } from '../pages/Caja/CajaPage'

function ProtectedApp() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedApp />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pacientes" element={<PacientesPage />} />
          <Route path="pacientes/:id" element={<PacienteDetailPage />} />
          <Route path="obras-sociales" element={<ObrasSocialesPage />} />
          <Route path="tratamientos" element={<TratamientosPage />} />
          <Route path="tratamientos/:id" element={<TratamientoDetailPage />} />
          <Route path="sesiones" element={<SesionesPage />} />
          <Route path="turnos" element={<TurnosPage />} />
          <Route path="boxes" element={<BoxesPage />} />
          <Route path="caja" element={<CajaPage />} />
          <Route path=":module" element={<PlaceholderPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
