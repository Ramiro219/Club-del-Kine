import { Activity } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-label="Cargando">
      <span className="brand-mark"><Activity size={25} /></span>
      <span className="spinner" />
    </div>
  )
}
