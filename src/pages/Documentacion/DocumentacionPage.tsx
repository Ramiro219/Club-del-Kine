import { CheckCircle2, Download, Eye, FileCheck2, FileClock, FileText, Plus, RefreshCcw, Replace } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { documentUrl, listDocuments, replaceDocument, updateDocumentState } from '../../services/documentos.service'
import type { DocumentoEstado, DocumentoView } from '../../types/stage7'
import { formatDate } from '../../utils/date'
import { DocumentForm } from './DocumentForm'

const tone: Record<DocumentoEstado, BadgeTone> = { pendiente: 'amber', vigente: 'green', observado: 'red', vencido: 'red', reemplazado: 'gray', archivado: 'gray' }
const label: Record<DocumentoEstado, string> = { pendiente: 'Pendiente', vigente: 'Completo', observado: 'Observado', vencido: 'Vencido', reemplazado: 'Reemplazado', archivado: 'Archivado' }

export function DocumentacionPage({ pacienteId, embedded = false }: { pacienteId?: string; embedded?: boolean }) {
  const [documents, setDocuments] = useState<DocumentoView[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('activos')
  const [type, setType] = useState('')
  const replacing = useRef<DocumentoView | null>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const load = useCallback(async () => { setLoading(true); try { setDocuments(await listDocuments(pacienteId)) } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo cargar la documentación.') } finally { setLoading(false) } }, [pacienteId])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => documents.filter((item) => {
    const text = `${item.nombre} ${item.tipo_documento} ${item.paciente?.nombres ?? ''} ${item.paciente?.apellidos ?? ''} ${item.paciente?.dni ?? ''}`.toLocaleLowerCase('es')
    const statusOk = status === '' || (status === 'activos' ? !['reemplazado', 'archivado'].includes(item.estado) : item.estado === status)
    return text.includes(search.toLocaleLowerCase('es')) && statusOk && (!type || item.tipo_documento === type)
  }), [documents, search, status, type])
  const pending = documents.filter((item) => item.estado === 'pendiente').length
  const observed = documents.filter((item) => item.estado === 'observado').length
  const complete = documents.filter((item) => item.estado === 'vigente').length

  async function openFile(document: DocumentoView, download = false) {
    try { window.open(await documentUrl(document, download), '_blank', 'noopener,noreferrer') } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo abrir el archivo.') }
  }
  async function reviewed(document: DocumentoView) {
    try { await updateDocumentState(document.id, 'vigente'); toast.success('Documento marcado como revisado.'); void load() } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo actualizar.') }
  }
  async function replaceSelected(file?: File) {
    const document = replacing.current; replacing.current = null
    if (!document || !file) return
    if (!window.confirm(`¿Reemplazar “${document.nombre}”? El archivo anterior seguirá en el historial.`)) return
    try { await replaceDocument(document, file); toast.success('Documento reemplazado correctamente.'); void load() } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo reemplazar.') }
  }

  return <>
    <header className={embedded ? 'embedded-heading' : 'page-heading module-heading'}><div><p>{embedded ? 'Archivos del paciente' : 'Gestión documental'}</p><h1>Documentación</h1><span>Órdenes, autorizaciones, planillas y comprobantes</span></div><button className="primary-button" onClick={() => setOpen(true)}><Plus size={18} /> Subir documento</button></header>
    {!embedded && <div className="document-stats"><article><FileClock /><span>Pendientes<strong>{pending}</strong></span></article><article><FileCheck2 /><span>Completos<strong>{complete}</strong></span></article><article><FileText /><span>Observados<strong>{observed}</strong></span></article></div>}
    <section className="panel entity-panel"><div className="entity-toolbar document-toolbar"><input placeholder="Buscar archivo, paciente o DNI…" value={search} onChange={(event) => setSearch(event.target.value)} /><select value={type} onChange={(event) => setType(event.target.value)}><option value="">Todos los tipos</option>{[...new Set(documents.map((item) => item.tipo_documento))].map((item) => <option key={item}>{item}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="activos">Documentos activos</option><option value="">Todos los estados</option><option value="pendiente">Pendientes</option><option value="vigente">Completos</option><option value="observado">Observados</option><option value="vencido">Vencidos</option><option value="reemplazado">Reemplazados</option></select><button onClick={() => void load()}><RefreshCcw size={15} /> Actualizar</button></div>
      {loading ? <div className="table-loading">Cargando documentación.</div> : filtered.length ? <div className="data-table-wrap"><table className="data-table document-table"><thead><tr><th>Archivo / paciente</th><th>Tipo</th><th>Contexto</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.nombre}</strong><small className="cell-note">{item.paciente ? `${item.paciente.apellidos}, ${item.paciente.nombres} · DNI ${item.paciente.dni}` : 'Paciente'}</small></td><td>{item.tipo_documento}</td><td>{item.obra_social_nombre ?? 'Particular'}<small className="cell-note">{item.tratamiento_nombre ?? 'Sin tratamiento específico'}</small></td><td>{formatDate(item.created_at)}<small className="cell-note">{item.fecha_vencimiento ? `Vence ${formatDate(item.fecha_vencimiento)}` : 'Sin vencimiento'}</small></td><td><Badge tone={tone[item.estado]}>{label[item.estado]}</Badge></td><td><div className="row-actions"><button title="Visualizar" onClick={() => void openFile(item)}><Eye size={15} /></button><button title="Descargar" onClick={() => void openFile(item, true)}><Download size={15} /></button>{!['reemplazado', 'archivado'].includes(item.estado) && <><button title="Reemplazar" onClick={() => { replacing.current = item; replaceInput.current?.click() }}><Replace size={15} /></button>{item.estado !== 'vigente' && <button title="Marcar como revisado" onClick={() => void reviewed(item)}><CheckCircle2 size={15} /></button>}</>}</div></td></tr>)}</tbody></table></div> : <div className="empty-state"><FileText size={30} /><strong>Sin documentación</strong><p>No hay archivos que coincidan con los filtros seleccionados.</p></div>}
    </section><input ref={replaceInput} className="hidden-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => { void replaceSelected(event.target.files?.[0]); event.currentTarget.value = '' }} />
    <Modal open={open} title="Subir documentación" onClose={() => setOpen(false)} wide><DocumentForm patientId={pacienteId} onCancel={() => setOpen(false)} onSuccess={() => { setOpen(false); void load() }} /></Modal>
  </>
}
