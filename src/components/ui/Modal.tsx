import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

export function Modal({ open, title, children, onClose, wide = false }: { open: boolean; title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', close)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className={`modal-card ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><button type="button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></header>{children}</section></div>
}
