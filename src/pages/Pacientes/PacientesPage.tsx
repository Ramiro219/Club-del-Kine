import { ExternalLink, Eye, Pencil, Plus, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/ui/Pagination'
import { SearchInput } from '../../components/ui/SearchInput'
import { listPacientes } from '../../services/pacientes.service'
import type { PacienteConObraSocial } from '../../types/stage3'
import { PacienteForm } from './PacienteForm'

export function PacientesPage() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<PacienteConObraSocial[]>([])
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PacienteConObraSocial | null>(null)

  useEffect(() => { const timer = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(timer) }, [search])
  useEffect(() => setPage(1), [debounced])
  const load = useCallback(async () => {
    setLoading(true)
    try { const result = await listPacientes(debounced, page); setPatients(result.data); setTotal(result.count); setPageSize(result.pageSize) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los pacientes.') }
    finally { setLoading(false) }
  }, [debounced, page])
  useEffect(() => { void load() }, [load])
  function openEdit(patient: PacienteConObraSocial) { setEditing(patient); setModalOpen(true) }
  function close() { setModalOpen(false); setEditing(null) }
  return <>
    <div className="page-heading module-heading"><div><span className="eyebrow">GESTIÓN DE PACIENTES</span><h1>Pacientes</h1><p>{total} registros encontrados</p></div><button className="primary-button compact" onClick={() => setModalOpen(true)}><Plus size={18} /> Nuevo paciente</button></div>
    <section className="panel entity-panel">
      <div className="entity-toolbar"><SearchInput value={search} onChange={setSearch} placeholder="Buscar por DNI, nombre, apellido o teléfono" /><span className="toolbar-note">Resultados paginados para una búsqueda rápida</span></div>
      {loading ? <div className="table-loading">Cargando pacientes…</div> : patients.length === 0 ? <EmptyState title="No encontramos pacientes" description={search ? 'Probá con otro nombre, DNI o teléfono.' : 'Registrá el primer paciente para comenzar.'} /> : <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Paciente</th><th>DNI</th><th>Teléfono</th><th>Obra social</th><th>Afiliado</th><th>Estado</th><th aria-label="Acciones" /></tr></thead><tbody>{patients.map((patient) => <tr key={patient.id}><td><button className="patient-link" onClick={() => navigate(`/pacientes/${patient.id}`)}><i><UserRound size={16} /></i><span><strong>{patient.apellidos}, {patient.nombres}</strong><small>{patient.email ?? 'Sin email'}</small></span></button></td><td>{patient.dni}</td><td>{patient.telefono ?? '—'}</td><td>{patient.obra_social?.nombre ?? 'Particular'}</td><td>{patient.numero_afiliado ?? '—'}</td><td><Badge tone={patient.estado === 'activo' ? 'green' : 'gray'}>{patient.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge></td><td><div className="row-actions"><button onClick={() => navigate(`/pacientes/${patient.id}`)} title="Ver ficha"><Eye size={17} /></button><button onClick={() => openEdit(patient)} title="Editar"><Pencil size={17} /></button>{patient.obra_social?.portal_url && <a href={patient.obra_social.portal_url} target="_blank" rel="noreferrer" title="Portal de obra social"><ExternalLink size={17} /></a>}</div></td></tr>)}</tbody></table></div>}
      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
    </section>
    <Modal open={modalOpen} title={editing ? 'Editar paciente' : 'Nuevo paciente'} onClose={close} wide><PacienteForm paciente={editing} onCancel={close} onSuccess={() => { close(); void load() }} /></Modal>
  </>
}
