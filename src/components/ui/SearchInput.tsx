import { Search, X } from 'lucide-react'

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="module-search"><Search size={18} /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />{value && <button type="button" onClick={() => onChange('')} aria-label="Limpiar búsqueda"><X size={16} /></button>}</label>
}
