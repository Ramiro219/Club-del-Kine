import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export function Header({ onMenu }: { onMenu: () => void }) {
  const { user, signOut, demoMode } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
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
        <button className="icon-button notification" aria-label="Notificaciones"><Bell size={20} /><span>4</span></button>
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
