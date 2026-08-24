import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, pageSize, total, onChange }: { page: number; pageSize: number; total: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return <footer className="pagination"><span>Mostrando {total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} de {total}</span><div><button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior"><ChevronLeft size={17} /></button><b>{page} / {pages}</b><button disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Página siguiente"><ChevronRight size={17} /></button></div></footer>
}
