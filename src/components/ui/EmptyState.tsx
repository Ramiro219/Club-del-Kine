import { FolderSearch, type LucideIcon } from 'lucide-react'

export function EmptyState({ title, description, icon: Icon = FolderSearch }: { title: string; description: string; icon?: LucideIcon }) {
  return <div className="empty-state"><Icon size={28} /><strong>{title}</strong><p>{description}</p></div>
}
