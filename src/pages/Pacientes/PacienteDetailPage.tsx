import { ArrowLeft, ExternalLink, MessageCircle, Pencil, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { getPaciente } from '../../services/pacientes.service'
import type { PacienteConObraSocial } from '../../types/stage3'
import { calculateAge, formatDate } from '../../utils/date'
import { PacienteForm } from './PacienteForm'
import { SesionesPage } from '../Sesiones/SesionesPage'
import { TratamientosPage } from '../Tratamientos/TratamientosPage'
import { PacienteTurnos } from '../Turnos/PacienteTurnos'

const tabs = ['Datos', 'Tratamientos', 'Sesiones', 'Pagos', 'Documentación', 'Turnos']

export function PacienteDetailPage() {
  const { id = '' } = useParams()
  const [patient, setPatient] = useState<PacienteConObraSocial | null>(null)
  const [tab, setTab] = useState('Datos')
  const [editing, setEditing] = useState(false)
  const load = async () => { try { setPatient(await getPaciente(id)) } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo cargar la ficha.') } }
  useEffect(() => { void load() }, [id])
  if (!patient) return <div className="table-loading">Cargando ficha del paciente…</div>
  const portal = patient.obra_social?.portal_paciente_url_template?.replace('{dni}', patient.dni).replace('{afiliado}', patient.numero_afiliado ?? '') || patient.obra_social?.portal_url
  const whatsapp = patient.telefono ? `https://wa.me/${patient.telefono.replace(/\D/g, '')}` : null
  return <>
    <Link className="back-link" to="/pacientes"><ArrowLeft size={17} /> Volver a pacientes</Link>
    <section className="patient-hero"><div className="patient-avatar"><UserRound size={28} /></div><div className="patient-title"><div><h1>{patient.nombres} {patient.apellidos}</h1><span>DNI {patient.dni} · {calculateAge(patient.fecha_nacimiento) ?? 'Edad no informada'}{calculateAge(patient.fecha_nacimiento) !== null ? ' años' : ''}</span></div><Badge tone={patient.estado === 'activo' ? 'green' : 'gray'}>{patient.estado}</Badge></div><div className="hero-actions">{whatsapp && <a className="secondary-button" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp</a>}{portal && <a className="secondary-button" href={portal} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Portal obra social</a>}<button className="primary-button compact" onClick={() => setEditing(true)}><Pencil size={17} /> Editar</button></div></section>
    <nav className="detail-tabs" aria-label="Secciones del paciente">{tabs.map((item) => <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
    {tab === 'Datos' ? <div className="detail-grid"><section className="panel detail-card"><h2>Datos personales</h2><dl><div><dt>Fecha de nacimiento</dt><dd>{formatDate(patient.fecha_nacimiento)}</dd></div><div><dt>Teléfono</dt><dd>{patient.telefono ?? '—'}</dd></div><div><dt>Email</dt><dd>{patient.email ?? '—'}</dd></div><div><dt>Dirección</dt><dd>{patient.direccion ?? '—'}</dd></div><div><dt>Contacto de emergencia</dt><dd>{patient.contacto_emergencia ?? '—'}</dd></div><div><dt>Teléfono de emergencia</dt><dd>{patient.telefono_emergencia ?? '—'}</dd></div></dl></section><section className="panel detail-card"><h2><ShieldCheck size={18} /> Cobertura</h2><dl><div><dt>Obra social</dt><dd>{patient.obra_social?.nombre ?? 'Particular'}</dd></div><div><dt>Número de afiliado</dt><dd>{patient.numero_afiliado ?? '—'}</dd></div><div><dt>Fecha de registro</dt><dd>{formatDate(patient.fecha_registro)}</dd></div></dl></section><section className="panel detail-card wide"><h2>Información clínica inicial</h2><dl><div><dt>Patología general</dt><dd>{patient.patologia_general || 'Sin información'}</dd></div><div><dt>Antecedentes</dt><dd>{patient.antecedentes || 'Sin información'}</dd></div><div><dt>Observaciones</dt><dd>{patient.observaciones || 'Sin observaciones'}</dd></div></dl></section></div> : tab === 'Tratamientos' ? <TratamientosPage pacienteId={patient.id} embedded /> : tab === 'Sesiones' ? <SesionesPage pacienteId={patient.id} embedded /> : tab === 'Turnos' ? <PacienteTurnos pacienteId={patient.id} /> : <section className="panel tab-coming"><h2>{tab}</h2><p>La pestaña quedó integrada en la ficha. Su información se incorporará en la etapa funcional correspondiente sin perder el contexto del paciente.</p></section>}
    <Modal open={editing} title="Editar paciente" onClose={() => setEditing(false)} wide><PacienteForm paciente={patient} onCancel={() => setEditing(false)} onSuccess={() => { setEditing(false); void load() }} /></Modal>
  </>
}
