import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className={`app-shell ${collapsed ? 'nav-collapsed' : ''}`}>
      <Sidebar open={mobileOpen} collapsed={collapsed} onClose={() => setMobileOpen(false)} onCollapse={() => setCollapsed((v) => !v)} />
      <div className="app-main">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}
