import { friendlyDatabaseError } from './errorMessage'
import { supabase } from './supabase'
import type { SesionFormData, SesionView } from '../types/stage4'

const PAGE_SIZE = 12

function client() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

export async function listSesiones(page: number, pacienteId?: string, tratamientoId?: string) {
  const from = (page - 1) * PAGE_SIZE
  let query = client().from('sesiones').select('*', { count: 'exact' }).order('fecha_atencion', { ascending: false }).range(from, from + PAGE_SIZE - 1)
  if (pacienteId) query = query.eq('paciente_id', pacienteId)
  if (tratamientoId) query = query.eq('tratamiento_id', tratamientoId)
  const { data: sessions, count, error } = await query
  if (error) throw new Error(friendlyDatabaseError(error))
  if (!sessions?.length) return { data: [], count: count ?? 0, pageSize: PAGE_SIZE }

  const patientIds = [...new Set(sessions.map((item) => item.paciente_id))]
  const treatmentIds = [...new Set(sessions.map((item) => item.tratamiento_id))]
  const boxIds = [...new Set(sessions.map((item) => item.box_id).filter((id): id is string => Boolean(id)))]
  const [patientsResult, treatmentsResult, boxesResult, paymentsResult] = await Promise.all([
    client().from('pacientes').select('id,nombres,apellidos,dni').in('id', patientIds),
    client().from('tratamientos').select('id,diagnostico,tipo_tratamiento_id').in('id', treatmentIds),
    boxIds.length ? client().from('boxes').select('id,nombre').in('id', boxIds) : Promise.resolve({ data: [], error: null }),
    client().from('pago_aplicaciones').select('id,estado,sesion_id').in('sesion_id', sessions.map((item) => item.id)),
  ])
  const relatedError = patientsResult.error ?? treatmentsResult.error ?? boxesResult.error ?? paymentsResult.error
  if (relatedError) throw new Error(friendlyDatabaseError(relatedError))

  const typeIds = [...new Set((treatmentsResult.data ?? []).map((item) => item.tipo_tratamiento_id))]
  const typesResult = typeIds.length
    ? await client().from('tipos_tratamiento').select('id,nombre').in('id', typeIds)
    : { data: [], error: null }
  if (typesResult.error) throw new Error(friendlyDatabaseError(typesResult.error))

  const patients = new Map((patientsResult.data ?? []).map((item) => [item.id, item]))
  const boxes = new Map((boxesResult.data ?? []).map((item) => [item.id, item]))
  const types = new Map((typesResult.data ?? []).map((item) => [item.id, item]))
  const treatments = new Map((treatmentsResult.data ?? []).map((item) => [item.id, item]))
  const rows: SesionView[] = sessions.map((session) => {
    const treatment = treatments.get(session.tratamiento_id)
    return {
      ...session,
      paciente: patients.get(session.paciente_id) ?? null,
      box: session.box_id ? boxes.get(session.box_id) ?? null : null,
      tratamiento: treatment ? {
        id: treatment.id,
        diagnostico: treatment.diagnostico,
        tipo: types.get(treatment.tipo_tratamiento_id) ?? null,
      } : null,
      pago_aplicaciones: (paymentsResult.data ?? [])
        .filter((payment) => payment.sesion_id === session.id)
        .map(({ id, estado }) => ({ id, estado })),
    }
  })
  return { data: rows, count: count ?? 0, pageSize: PAGE_SIZE }
}

export async function listActiveTreatments(pacienteId?: string) {
  let query = client().from('tratamientos').select('id,paciente_id,diagnostico,tipo:tipos_tratamiento(nombre)').in('estado', ['activo', 'pausado']).order('fecha_inicio', { ascending: false })
  if (pacienteId) query = query.eq('paciente_id', pacienteId)
  const { data, error } = await query
  if (error) throw new Error(friendlyDatabaseError(error))
  return data ?? []
}

export async function createSesion(values: SesionFormData) {
  const { data, error } = await client().from('sesiones').insert(values).select('id,unidades_consumidas').single()
  if (error) throw new Error(friendlyDatabaseError(error))
  return data
}

export async function updateSesion(id: string, values: SesionFormData) {
  const { error } = await client().from('sesiones').update(values).eq('id', id)
  if (error) throw new Error(friendlyDatabaseError(error))
}

export async function anularSesion(id: string, motivo: string) {
  const { error } = await client().from('sesiones').update({ estado: 'anulada', motivo_anulacion: motivo.trim(), anulada_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(friendlyDatabaseError(error))
}
