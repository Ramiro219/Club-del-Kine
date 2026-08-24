import { FileUp } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { documentCatalogs, uploadDocument, validateDocumentFile } from '../../services/documentos.service'
import type { DocumentoEstado, DocumentoTipo } from '../../types/stage7'

const TYPES: DocumentoTipo[] = ['Orden médica', 'Autorización', 'Planilla de asistencia', 'Comprobante', 'Documento', 'Otro']

export function DocumentForm({ patientId, onCancel, onSuccess }: { patientId?: string; onCancel: () => void; onSuccess: () => void }) {
  const [catalogs, setCatalogs] = useState<Awaited<ReturnType<typeof documentCatalogs>> | null>(null)
  const [patient, setPatient] = useState(patientId ?? '')
  const [treatment, setTreatment] = useState('')
  const [insurer, setInsurer] = useState('')
  const [requirement, setRequirement] = useState('')
  const [type, setType] = useState<DocumentoTipo>('Orden médica')
  const [expiry, setExpiry] = useState('')
  const [status, setStatus] = useState<Extract<DocumentoEstado, 'pendiente' | 'vigente' | 'observado'>>('pendiente')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { documentCatalogs(patientId).then(setCatalogs).catch((error) => toast.error(error.message)) }, [patientId])
  const selectedPatient = catalogs?.patients.find((item) => item.id === patient)
  const treatments = useMemo(() => catalogs?.treatments.filter((item) => item.paciente_id === patient) ?? [], [catalogs, patient])
  const requirements = useMemo(() => catalogs?.requirements.filter((item) => item.obra_social_id === insurer) ?? [], [catalogs, insurer])
  useEffect(() => { setTreatment(''); setInsurer(selectedPatient?.obra_social_id ?? ''); setRequirement('') }, [patient, selectedPatient?.obra_social_id])
  useEffect(() => { const selected = treatments.find((item) => item.id === treatment); if (selected?.obra_social_id) setInsurer(selected.obra_social_id) }, [treatment, treatments])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!patient || !file) return toast.error('Seleccioná el paciente y el archivo.')
    try { validateDocumentFile(file) } catch (error) { return toast.error(error instanceof Error ? error.message : 'Archivo inválido.') }
    setSaving(true)
    try {
      await uploadDocument({ paciente_id: patient, tratamiento_id: treatment || null, obra_social_id: insurer || null, requisito_obra_social_id: requirement || null, tipo_documento: type, fecha_vencimiento: expiry || null, estado: status, file })
      toast.success('Documento cargado correctamente.'); onSuccess()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo cargar el documento.') }
    finally { setSaving(false) }
  }

  return <form className="entity-form" onSubmit={submit}><div className="form-grid">
    <label>Paciente *<select value={patient} disabled={Boolean(patientId)} onChange={(event) => setPatient(event.target.value)} required><option value="">Seleccionar paciente</option>{catalogs?.patients.map((item) => <option key={item.id} value={item.id}>{item.apellidos}, {item.nombres} · DNI {item.dni}</option>)}</select></label>
    <label>Tipo *<select value={type} onChange={(event) => setType(event.target.value as DocumentoTipo)}>{TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label>Tratamiento<select value={treatment} onChange={(event) => setTreatment(event.target.value)}><option value="">Sin tratamiento específico</option>{treatments.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
    <label>Obra social<select value={insurer} onChange={(event) => { setInsurer(event.target.value); setRequirement('') }}><option value="">Particular / sin obra social</option>{catalogs?.insurers.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
    <label>Requisito<select value={requirement} onChange={(event) => setRequirement(event.target.value)}><option value="">Sin requisito asociado</option>{requirements.map((item) => <option key={item.id} value={item.id}>{item.nombre}{item.obligatorio ? ' · obligatorio' : ''}</option>)}</select></label>
    <label>Fecha de vencimiento<input type="date" value={expiry} onChange={(event) => setExpiry(event.target.value)} /></label>
    <label>Estado inicial<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="pendiente">Pendiente de revisión</option><option value="vigente">Completo</option><option value="observado">Observado</option></select></label>
    <label className="full document-file"><span>Archivo PDF, JPG o PNG *</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /><small>{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Tamaño máximo: 10 MB'}</small></label>
  </div><div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={saving}><FileUp size={17} />{saving ? 'Subiendo…' : 'Subir documento'}</button></div></form>
}
