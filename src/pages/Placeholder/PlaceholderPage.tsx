import { Construction } from 'lucide-react'
import { useLocation } from 'react-router-dom'

export function PlaceholderPage() {
  const location = useLocation()
  const title = location.pathname.slice(1).replaceAll('-', ' ')
  return <section className="placeholder"><span><Construction /></span><p className="eyebrow">PRÓXIMA ETAPA</p><h1>{title}</h1><p>La navegación ya está preparada. Este módulo se implementará en su etapa correspondiente, sin mezclar alcances.</p></section>
}
