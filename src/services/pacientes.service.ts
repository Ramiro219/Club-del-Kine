import { supabase } from './supabase'
import { friendlyDatabaseError } from './errorMessage'
import type { PacienteConObraSocial, PacienteFormData } from '../types/stage3'

const PAGE_SIZE = 10

function client() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

function normalizedSearch(value: string) {
  return value.trim().replace(/[^\p{L}\p{N}\s@.+-]/gu, '').slice(0, 80)
}

export async function listPacientes(search: string, page: number) {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  let query = client()
    .from('pacientes')
    .select('*, obra_social:obras_sociales(id,nombre,portal_url,portal_paciente_url_template)', { count: 'exact' })
    .order('apellidos')
    .order('nombres')
    .range(from, to)

  const term = normalizedSearch(search)
  if (term) query = query.or(`dni.ilike.%${term}%,nombres.ilike.%${term}%,apellidos.ilike.%${term}%,telefono.ilike.%${term}%`)
  const { data, count, error } = await query
  if (error) throw new Error(friendlyDatabaseError(error))
  return { data: (data ?? []) as unknown as PacienteConObraSocial[], count: count ?? 0, pageSize: PAGE_SIZE }
}

export async function getPaciente(id: string) {
  const { data, error } = await client()
    .from('pacientes')
    .select('*, obra_social:obras_sociales(id,nombre,portal_url,portal_paciente_url_template)')
    .eq('id', id)
    .single()
  if (error) throw new Error(friendlyDatabaseError(error))
  return data as unknown as PacienteConObraSocial
}

export async function createPaciente(values: PacienteFormData) {
  const { data, error } = await client().from('pacientes').insert(values).select('id').single()
  if (error) throw new Error(friendlyDatabaseError(error))
  return data
}

export async function updatePaciente(id: string, values: PacienteFormData) {
  const { error } = await client().from('pacientes').update(values).eq('id', id)
  if (error) throw new Error(friendlyDatabaseError(error))
}

export async function setPacienteEstado(id: string, estado: 'activo' | 'inactivo') {
  const { error } = await client().from('pacientes').update({ estado }).eq('id', id)
  if (error) throw new Error(friendlyDatabaseError(error))
}
