import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { alertCount } from '../../services/operaciones.service'

export function Header({ onMenu }: { onMenu: () => void }) {
  const { user, signOut, demoMode } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(0)
  useEffect(() => { if (demoMode) { setNotifications(4); return } const load=()=>void alertCount().then(setNotifications).catch(()=>setNotifications(0)); load(); const timer=window.setInterval(load,60000); return()=>window.clearInterval(timer) }, [demoMode])
  return (
    <header className="topbar">
      <button className="menu-button" onClick={onMenu} aria-label="Abrir menú"><Menu size={21} /></button>
      <label className="global-search">
        <Search size={18} />
        <input placeholder="Buscar paciente por nombre o DNI…" aria-label="Buscar paciente" />
        <kbd>⌘ K</kbd>
      </label>
      <div className="topbar-actions">
        {demoMode && <span className="demo-pill">Datos demo</span>}
        <Link className="icon-button notification" to="/alertas" aria-label="Notificaciones"><Bell size={20} />{notifications>0&&<span>{notifications>99?'99+':notifications}</span>}</Link>
        <div className="user-menu">
          <button onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen}>
            <span className="avatar">ML</span>
            <span className="user-copy"><strong>{user?.name}</strong><small>{user?.role === 'administrador' ? 'Administración' : 'Recepción'}</small></span>
            <ChevronDown size={16} />
          </button>
          {menuOpen && <div className="user-dropdown"><button onClick={() => void signOut()}><LogOut size={17} /> Cerrar sesión</button></div>}
        </div>
      </div>
    </header>
  )
}
