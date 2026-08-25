import { Activity, Building2, CalendarDays, ClipboardList, FileText, Gauge, ListChecks, Menu, Settings, Stethoscope, Users, WalletCards, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Dashboard', icon: Gauge },
  { to: '/pacientes', label: 'Pacientes', icon: Users },
  { to: '/turnos', label: 'Turnos', icon: CalendarDays },
  { to: '/tratamientos', label: 'Tratamientos', icon: Stethoscope },
  { to: '/sesiones', label: 'Sesiones', icon: Activity },
  { to: '/obras-sociales', label: 'Obras sociales', icon: Building2 },
  { to: '/documentacion', label: 'Documentación', icon: FileText },
  { to: '/caja', label: 'Caja', icon: WalletCards },
  { to: '/reportes', label: 'Reportes', icon: ClipboardList },
  { to: '/lista-espera', label: 'Lista de espera', icon: ListChecks },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

export function Sidebar({ open, collapsed, onClose, onCollapse }: {
  open: boolean
  collapsed: boolean
  onClose: () => void
  onCollapse: () => void
}) {
  return (
    <>
      {open && <button className="sidebar-overlay" aria-label="Cerrar menú" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-mark"><Activity size={24} /></span>
          <div><strong>Club del Kine</strong><small>Gestión integral</small></div>
          <button className="mobile-close" onClick={onClose} aria-label="Cerrar menú"><X size={20} /></button>
        </div>
        <nav aria-label="Navegación principal">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={onClose} title={collapsed ? label : undefined}>
              <Icon size={19} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="collapse-button" onClick={onCollapse}><Menu size={18} /><span>Contraer menú</span></button>
      </aside>
    </>
  )
}
