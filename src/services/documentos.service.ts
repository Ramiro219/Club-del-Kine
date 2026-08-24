import { friendlyDatabaseError } from './errorMessage'
import { supabase } from './supabase'
import type { DocumentoEstado, DocumentoFormData, DocumentoRow, DocumentoView } from '../types/stage7'

const BUCKET = 'documentacion'
const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png'])

function client() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

export function validateDocumentFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !['pdf', 'jpg', 'jpeg', 'png'].includes(extension)) throw new Error('La extensión del archivo no está permitida.')
  if (!ALLOWED.has(file.type)) throw new Error('Solo se permiten archivos PDF, JPG o PNG.')
  if (file.size <= 0) throw new Error('El archivo está vacío.')
  if (file.size > MAX_SIZE) throw new Error('El archivo supera el máximo de 10 MB.')
}

function storagePath(patientId: string, file: File) {
  const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
  return `${patientId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`
}

export async function documentCatalogs(patientId?: string) {
  const patientsQuery = client().from('pacientes').select('id,nombres,apellidos,dni,obra_social_id').order('apellidos').limit(5000)
  const [patients, insurers, requirements, treatments, treatmentTypes] = await Promise.all([
    patientId ? patientsQuery.eq('id', patientId) : patientsQuery.eq('estado', 'activo'),
    client().from('obras_sociales').select('id,nombre').eq('activo', true).order('nombre'),
    client().from('requisitos_obra_social').select('id,obra_social_id,nombre,obligatorio').eq('activo', true).order('nombre'),
    client().from('tratamientos').select('id,paciente_id,obra_social_id,tipo_tratamiento_id,estado').in('estado', ['activo', 'pausado']).order('fecha_inicio', { ascending: false }),
    client().from('tipos_tratamiento').select('id,nombre'),
  ])
  const error = patients.error ?? insurers.error ?? requirements.error ?? treatments.error ?? treatmentTypes.error
  if (error) throw new Error(friendlyDatabaseError(error))
  const names = new Map((treatmentTypes.data ?? []).map((item) => [item.id, item.nombre]))
  return {
    patients: patients.data ?? [],
    insurers: insurers.data ?? [],
    requirements: requirements.data ?? [],
    treatments: (treatments.data ?? []).map((item) => ({ ...item, nombre: names.get(item.tipo_tratamiento_id) ?? 'Tratamiento' })),
  }
}

export async function listDocuments(patientId?: string) {
  let query = client().from('documentos').select('*').order('created_at', { ascending: false }).limit(500)
  if (patientId) query = query.eq('paciente_id', patientId)
  const documentsResult = await query
  if (documentsResult.error) throw new Error(friendlyDatabaseError(documentsResult.error))
  const documents = documentsResult.data ?? []
  const patientIds = [...new Set(documents.map((item) => item.paciente_id))]
  const treatmentIds = [...new Set(documents.map((item) => item.tratamiento_id).filter((id): id is string => Boolean(id)))]
  const insurerIds = [...new Set(documents.map((item) => item.obra_social_id).filter((id): id is string => Boolean(id)))]
  const [patients, treatments, insurers, types] = await Promise.all([
    patientIds.length ? client().from('pacientes').select('id,nombres,apellidos,dni').in('id', patientIds) : Promise.resolve({ data: [], error: null }),
    treatmentIds.length ? client().from('tratamientos').select('id,tipo_tratamiento_id').in('id', treatmentIds) : Promise.resolve({ data: [], error: null }),
    insurerIds.length ? client().from('obras_sociales').select('id,nombre').in('id', insurerIds) : Promise.resolve({ data: [], error: null }),
    client().from('tipos_tratamiento').select('id,nombre'),
  ])
  const error = patients.error ?? treatments.error ?? insurers.error ?? types.error
  if (error) throw new Error(friendlyDatabaseError(error))
  const patientMap = new Map((patients.data ?? []).map((item) => [item.id, item]))
  const insurerMap = new Map((insurers.data ?? []).map((item) => [item.id, item.nombre]))
  const typeMap = new Map((types.data ?? []).map((item) => [item.id, item.nombre]))
  const treatmentMap = new Map((treatments.data ?? []).map((item) => [item.id, typeMap.get(item.tipo_tratamiento_id) ?? 'Tratamiento']))
  return documents.map((item) => ({
    ...item,
    estado: item.estado as DocumentoEstado,
    paciente: patientMap.get(item.paciente_id) ?? null,
    tratamiento_nombre: item.tratamiento_id ? treatmentMap.get(item.tratamiento_id) ?? null : null,
    obra_social_nombre: item.obra_social_id ? insurerMap.get(item.obra_social_id) ?? null : null,
  })) as DocumentoView[]
}

export async function uploadDocument(values: DocumentoFormData) {
  validateDocumentFile(values.file)
  const path = storagePath(values.paciente_id, values.file)
  const upload = await client().storage.from(BUCKET).upload(path, values.file, { contentType: values.file.type, upsert: false })
  if (upload.error) throw new Error(friendlyDatabaseError(upload.error))
  const record: StageDocumentInsert = {
    paciente_id: values.paciente_id,
    tratamiento_id: values.tratamiento_id,
    obra_social_id: values.obra_social_id,
    requisito_obra_social_id: values.requisito_obra_social_id,
    nombre: values.file.name,
    tipo_documento: values.tipo_documento,
    storage_bucket: BUCKET,
    storage_path: path,
    mime_type: values.file.type,
    tamanio_bytes: values.file.size,
    fecha_vencimiento: values.fecha_vencimiento,
    estado: values.estado,
  }
  const inserted = await client().from('documentos').insert(record).select('id').single()
  if (inserted.error) {
    await client().storage.from(BUCKET).remove([path])
    throw new Error(friendlyDatabaseError(inserted.error))
  }
  return inserted.data.id
}

type StageDocumentInsert = Stage7DocumentInsert
type Stage7DocumentInsert = Omit<DocumentoRow, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'reemplazado_por_id'> & { reemplazado_por_id?: string | null }

export async function replaceDocument(document: DocumentoView, file: File) {
  validateDocumentFile(file)
  const path = storagePath(document.paciente_id, file)
  const upload = await client().storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (upload.error) throw new Error(friendlyDatabaseError(upload.error))
  const result = await client().rpc('reemplazar_documento_atomico', {
    p_documento_id: document.id,
    p_nombre: file.name,
    p_storage_path: path,
    p_mime_type: file.type,
    p_tamanio_bytes: file.size,
  })
  if (result.error) {
    await client().storage.from(BUCKET).remove([path])
    throw new Error(friendlyDatabaseError(result.error))
  }
  return result.data
}

export async function updateDocumentState(id: string, estado: DocumentoEstado) {
  const result = await client().from('documentos').update({ estado }).eq('id', id)
  if (result.error) throw new Error(friendlyDatabaseError(result.error))
}

export async function documentUrl(document: DocumentoView, download = false) {
  const result = await client().storage.from(document.storage_bucket).createSignedUrl(
    document.storage_path,
    300,
    download ? { download: document.nombre } : undefined,
  )
  if (result.error) throw new Error(friendlyDatabaseError(result.error))
  return result.data.signedUrl
}
