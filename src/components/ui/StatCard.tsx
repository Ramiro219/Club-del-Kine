import type { LucideIcon } from 'lucide-react'

export function StatCard({ label, value, helper, icon: Icon, tone }: {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  tone: 'teal' | 'blue' | 'amber' | 'rose'
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  )
}
