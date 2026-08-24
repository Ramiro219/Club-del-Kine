import { Building2, ExternalLink, Pencil, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { SearchInput } from '../../components/ui/SearchInput'
import { listObrasSociales } from '../../services/obrasSociales.service'
import type { ObraSocialRow } from '../../types/stage3'
import { ObraSocialForm } from './ObraSocialForm'

export function ObrasSocialesPage() {
  const [items, setItems] = useState<ObraSocialRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<ObraSocialRow | null>(null)
  const load = useCallback(async () => { setLoading(true); try { setItems(await listObrasSociales()) } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudieron cargar las obras sociales.') } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => { const term = search.toLocaleLowerCase('es'); return items.filter((item) => `${item.nombre} ${item.codigo ?? ''}`.toLocaleLowerCase('es').includes(term)) }, [items, search])
  function close() { setModal(false); setEditing(null) }
  return <><div className="page-heading module-heading"><div><span className="eyebrow">COBERTURAS Y PORTALES</span><h1>Obras sociales</h1><p>{items.filter((item) => item.activo).length} activas · {items.length} configuradas</p></div><button className="primary-button compact" onClick={() => setModal(true)}><Plus size={18} /> Nueva obra social</button></div><section className="panel entity-panel"><div className="entity-toolbar"><SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o código" /><span className="toolbar-note">Las credenciales de portales nunca se guardan</span></div>{loading ? <div className="table-loading">Cargando obras sociales…</div> : filtered.length === 0 ? <EmptyState title="No encontramos obras sociales" description="Creá la primera cobertura o cambiá la búsqueda." /> : <div className="insurance-grid">{filtered.map((obra) => <article className="insurance-card" key={obra.id}><header><span><Building2 size={20} /></span><Badge tone={obra.activo ? 'green' : 'gray'}>{obra.activo ? 'Activa' : 'Inactiva'}</Badge></header><h2>{obra.nombre}</h2><p>{obra.codigo || 'Sin código interno'}</p><dl><div><dt>Teléfono</dt><dd>{obra.telefono ?? '—'}</dd></div><div><dt>Sesiones típicas</dt><dd>{obra.sesiones_tipicas ?? 'Configurable'}</dd></div></dl><footer><button onClick={() => { setEditing(obra); setModal(true) }}><Pencil size={16} /> Editar</button>{obra.portal_url && <a href={obra.portal_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Ir al portal</a>}</footer></article>)}</div>}</section><Modal open={modal} title={editing ? 'Editar obra social' : 'Nueva obra social'} onClose={close} wide><ObraSocialForm obra={editing} onCancel={close} onSuccess={() => { close(); void load() }} /></Modal></>
}
