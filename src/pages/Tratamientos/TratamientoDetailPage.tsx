import { ArrowLeft, CalendarDays, Pencil, Stethoscope } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { getTratamiento } from '../../services/tratamientos.service'
import type { TratamientoView } from '../../types/stage4'
import { formatDate } from '../../utils/date'
import { SesionesPage } from '../Sesiones/SesionesPage'
import { TratamientoForm } from './TratamientoForm'

export function TratamientoDetailPage() {
  const { id = '' } = useParams()
  const [row, setRow] = useState<TratamientoView | null>(null)
  const [editing, setEditing] = useState(false)
  const load = async () => { try { setRow(await getTratamiento(id)) } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo cargar el tratamiento.') } }
  useEffect(() => { void load() }, [id])
  if (!row) return <div className="table-loading">Cargando tratamiento…</div>
  return <><Link className="back-link" to="/tratamientos"><ArrowLeft size={17} /> Volver a tratamientos</Link><section className="treatment-hero"><div><span className="treatment-icon"><Stethoscope size={23} /></span><div><small>Tratamiento de {row.paciente?.nombres} {row.paciente?.apellidos}</small><h1>{row.tipo?.nombre}</h1><p>{row.diagnostico || 'Sin diagnóstico informado'}</p></div></div><div className="hero-actions"><Badge tone={row.estado === 'activo' ? 'green' : 'gray'}>{row.estado}</Badge><button className="primary-button compact" onClick={() => setEditing(true)}><Pencil size={17} /> Editar</button></div></section><div className="treatment-metrics"><article><span>Autorizadas</span><strong>{row.stats.autorizadas ?? 'Sin límite'}</strong></article><article><span>Realizadas</span><strong>{row.stats.realizadas}</strong></article><article><span>Ausencias</span><strong>{row.stats.ausencias}</strong></article><article className="highlight"><span>Restantes</span><strong>{row.stats.restantes ?? '—'}</strong></article></div><section className="panel treatment-info"><div><h2><CalendarDays size={17} /> Información del plan</h2><dl><div><dt>Inicio</dt><dd>{formatDate(row.fecha_inicio)}</dd></div><div><dt>Finalización estimada</dt><dd>{formatDate(row.fecha_estimada_fin)}</dd></div><div><dt>Obra social</dt><dd>{row.obra_social?.nombre ?? 'Particular'}</dd></div><div><dt>Box sugerido</dt><dd>{row.box?.nombre ?? 'Sin preferencia'}</dd></div><div><dt>Autorización</dt><dd>{row.numero_autorizacion ?? '—'}</dd></div><div><dt>Valor por sesión</dt><dd>{row.precio_sesion === null ? '—' : row.precio_sesion.toLocaleString('es-AR', { style:'currency', currency:'ARS' })}</dd></div></dl></div>{row.indicaciones && <aside><strong>Indicaciones</strong><p>{row.indicaciones}</p></aside>}</section><SesionesPage pacienteId={row.paciente_id} tratamientoId={row.id} embedded /><Modal open={editing} title="Editar tratamiento" onClose={() => setEditing(false)} wide><TratamientoForm tratamiento={row} onCancel={() => setEditing(false)} onSuccess={() => { setEditing(false); void load() }} /></Modal></>
}
