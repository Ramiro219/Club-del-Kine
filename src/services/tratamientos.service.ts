import { friendlyDatabaseError } from './errorMessage'
import { supabase } from './supabase'
import type { Stage4Catalogs, TratamientoFormData, TratamientoView, TreatmentStats } from '../types/stage4'

const PAGE_SIZE = 10

function client() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

function stats(row: TratamientoView): TreatmentStats {
  const sessions = row.sesiones ?? []
  const consumidas = sessions.reduce((sum, item) => sum + Number(item.unidades_consumidas), 0)
  const autorizadas = row.sesiones_autorizadas === null ? null : Number(row.sesiones_autorizadas)
  return {
    autorizadas,
    realizadas: sessions.filter((item) => item.estado === 'realizada').length,
    ausencias: sessions.filter((item) => item.estado.startsWith('ausente')).length,
    canceladas: sessions.filter((item) => ['cancelada', 'reprogramada', 'anulada'].includes(item.estado)).length,
    consumidas,
    restantes: autorizadas === null ? null : Math.max(autorizadas - consumidas, 0),
  }
}

function hydrate(rows: unknown[]) {
  return (rows as TratamientoView[]).map((row) => ({ ...row, stats: stats(row) }))
}

export async function listTratamientos(search: string, page: number, pacienteId?: string) {
  const from = (page - 1) * PAGE_SIZE
  let query = client().from('tratamientos').select(`*, paciente:pacientes(id,nombres,apellidos,dni), tipo:tipos_tratamiento(id,nombre), obra_social:obras_sociales(id,nombre), box:boxes(id,nombre), sesiones(id,estado,unidades_consumidas)`, { count: 'exact' }).order('fecha_inicio', { ascending: false }).range(from, from + PAGE_SIZE - 1)
  if (pacienteId) query = query.eq('paciente_id', pacienteId)
  const term = search.trim().slice(0, 80)
  if (term) {
    const { data: patients, error: patientError } = await client().from('pacientes').select('id').or(`dni.ilike.%${term}%,nombres.ilike.%${term}%,apellidos.ilike.%${term}%`).limit(100)
    if (patientError) throw new Error(friendlyDatabaseError(patientError))
    const ids = (patients ?? []).map((item) => item.id)
    if (!ids.length) return { data: [], count: 0, pageSize: PAGE_SIZE }
    query = query.in('paciente_id', ids)
  }
  const { data, count, error } = await query
  if (error) throw new Error(friendlyDatabaseError(error))
  return { data: hydrate(data ?? []), count: count ?? 0, pageSize: PAGE_SIZE }
}

export async function getTratamiento(id: string) {
  const { data, error } = await client().from('tratamientos').select(`*, paciente:pacientes(id,nombres,apellidos,dni), tipo:tipos_tratamiento(id,nombre), obra_social:obras_sociales(id,nombre), box:boxes(id,nombre), sesiones(id,estado,unidades_consumidas)`).eq('id', id).single()
  if (error) throw new Error(friendlyDatabaseError(error))
  return hydrate([data])[0]
}

export async function createTratamiento(values: TratamientoFormData) {
  const { data, error } = await client().from('tratamientos').insert(values).select('id').single()
  if (error) throw new Error(friendlyDatabaseError(error))
  return data
}

export async function updateTratamiento(id: string, values: TratamientoFormData) {
  const { error } = await client().from('tratamientos').update(values).eq('id', id)
  if (error) throw new Error(friendlyDatabaseError(error))
}

export async function updateTratamientoEstado(id: string, estado: string) {
  const patch = estado === 'finalizado' ? { estado, fecha_alta_clinica: new Date().toISOString().slice(0, 10) } : { estado }
  const { error } = await client().from('tratamientos').update(patch).eq('id', id)
  if (error) throw new Error(friendlyDatabaseError(error))
}

export async function getStage4Catalogs(): Promise<Stage4Catalogs> {
  const [pacientes, tipos, obras, boxes] = await Promise.all([
    client().from('pacientes').select('id,nombres,apellidos,dni,obra_social_id').eq('estado', 'activo').order('apellidos').limit(5000),
    client().from('tipos_tratamiento').select('id,nombre,precio_referencia').eq('activo', true).order('nombre'),
    client().from('obras_sociales').select('id,nombre').eq('activo', true).order('nombre'),
    client().from('boxes').select('id,nombre').eq('activo', true).order('nombre'),
  ])
  const error = pacientes.error ?? tipos.error ?? obras.error ?? boxes.error
  if (error) throw new Error(friendlyDatabaseError(error))
  return { pacientes: pacientes.data ?? [], tipos: tipos.data ?? [], obras: obras.data ?? [], boxes: boxes.data ?? [] }
}
