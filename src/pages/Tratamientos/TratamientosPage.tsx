import { Activity, CheckCircle2, CirclePause, Eye, Pencil, Plus, Stethoscope, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/ui/Pagination'
import { SearchInput } from '../../components/ui/SearchInput'
import { listTratamientos, updateTratamientoEstado } from '../../services/tratamientos.service'
import type { TratamientoView } from '../../types/stage4'
import { formatDate } from '../../utils/date'
import { TratamientoForm } from './TratamientoForm'

const labels: Record<string, string> = { borrador: 'Borrador', activo: 'Activo', pausado: 'Suspendido', finalizado: 'Finalizado', cancelado: 'Cancelado' }
const tones: Record<string, BadgeTone> = { activo: 'green', pausado: 'amber', finalizado: 'blue', cancelado: 'red', borrador: 'gray' }

export function TratamientosPage({ pacienteId, embedded = false }: { pacienteId?: string; embedded?: boolean }) {
  const [rows, setRows] = useState<TratamientoView[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TratamientoView | null | 'new'>(null)
  const load = useCallback(async () => { setLoading(true); try { const result = await listTratamientos(search, page, pacienteId); setRows(result.data); setTotal(result.count); setPageSize(result.pageSize) } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los tratamientos.') } finally { setLoading(false) } }, [search, page, pacienteId])
  useEffect(() => { void load() }, [load])
  async function changeState(row: TratamientoView, estado: string) {
    if (estado === 'cancelado' && !window.confirm('¿Cancelar este tratamiento? El historial y sus sesiones se conservarán.')) return
    try { await updateTratamientoEstado(row.id, estado); toast.success('Estado actualizado.'); void load() } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo actualizar.') }
  }
  return <>{!embedded && <header className="page-heading module-heading"><div><p>Gestión clínica</p><h1>Tratamientos</h1><span>Planes terapéuticos e historial por paciente</span></div><button className="primary-button" onClick={() => setEditing('new')}><Plus size={18} /> Nuevo tratamiento</button></header>}{embedded && <div className="embedded-heading"><div><h2>Tratamientos</h2><p>Historial completo, sin eliminar tratamientos anteriores.</p></div><button className="primary-button compact" onClick={() => setEditing('new')}><Plus size={17} /> Iniciar tratamiento</button></div>}<section className="panel entity-panel"><div className="entity-toolbar">{!pacienteId ? <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Buscar por paciente o DNI…" /> : <span className="toolbar-note">{total} tratamiento{total === 1 ? '' : 's'} registrado{total === 1 ? '' : 's'}</span>}<span className="toolbar-note">Las sesiones restantes se calculan automáticamente</span></div>{loading ? <div className="table-loading">Cargando tratamientos…</div> : rows.length ? <div className="data-table-wrap"><table className="data-table treatment-table"><thead><tr><th>Paciente / tratamiento</th><th>Vigencia</th><th>Sesiones</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><div className="treatment-name"><Stethoscope size={17} /><span><strong>{row.tipo?.nombre ?? 'Tratamiento'}</strong><small>{row.paciente ? `${row.paciente.apellidos}, ${row.paciente.nombres} · DNI ${row.paciente.dni}` : 'Paciente'}</small><em>{row.diagnostico || 'Sin diagnóstico informado'}</em></span></div></td><td><strong>{formatDate(row.fecha_inicio)}</strong><small className="cell-note">Estimada: {formatDate(row.fecha_estimada_fin)}</small></td><td><div className="session-summary"><b>{row.stats.restantes ?? '—'}</b><span>restantes</span><small>{row.stats.realizadas} realizadas · {row.stats.ausencias} ausencias</small></div></td><td><Badge tone={tones[row.estado] ?? 'gray'}>{labels[row.estado] ?? row.estado}</Badge></td><td><div className="row-actions">{!embedded && <Link to={`/tratamientos/${row.id}`} title="Ver ficha"><Eye size={15} /></Link>}<button title="Editar" onClick={() => setEditing(row)}><Pencil size={15} /></button>{row.estado === 'activo' && <button title="Suspender" onClick={() => void changeState(row, 'pausado')}><CirclePause size={15} /></button>}{row.estado === 'pausado' && <button title="Reactivar" onClick={() => void changeState(row, 'activo')}><Activity size={15} /></button>}{!['finalizado','cancelado'].includes(row.estado) && <button title="Finalizar" onClick={() => void changeState(row, 'finalizado')}><CheckCircle2 size={15} /></button>}{row.estado !== 'cancelado' && <button title="Cancelar" onClick={() => void changeState(row, 'cancelado')}><XCircle size={15} /></button>}</div></td></tr>)}</tbody></table></div> : <EmptyState icon={Stethoscope} title="No hay tratamientos" description={pacienteId ? 'Iniciá el primer tratamiento de este paciente.' : 'Registrá un tratamiento para comenzar el seguimiento.'} />}{total > pageSize && <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />}</section><Modal open={editing !== null} title={editing === 'new' ? 'Nuevo tratamiento' : 'Editar tratamiento'} onClose={() => setEditing(null)} wide><TratamientoForm pacienteId={pacienteId} tratamiento={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSuccess={() => { setEditing(null); void load() }} /></Modal></>
}
