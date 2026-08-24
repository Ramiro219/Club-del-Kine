import { FolderSearch } from 'lucide-react'

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><FolderSearch size={28} /><strong>{title}</strong><p>{description}</p></div>
}
