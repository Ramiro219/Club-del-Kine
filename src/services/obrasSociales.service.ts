import { supabase } from './supabase'
import { friendlyDatabaseError } from './errorMessage'
import type { ObraSocialFormData, ObraSocialRow, RequisitoObraSocial } from '../types/stage3'

function client() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

export async function listObrasSociales(includeInactive = true) {
  let query = client().from('obras_sociales').select('*').order('nombre')
  if (!includeInactive) query = query.eq('activo', true)
  const { data, error } = await query
  if (error) throw new Error(friendlyDatabaseError(error))
  return (data ?? []) as unknown as ObraSocialRow[]
}

export async function createObraSocial(values: ObraSocialFormData) {
  const { data, error } = await client().from('obras_sociales').insert(values).select('id').single()
  if (error) throw new Error(friendlyDatabaseError(error))
  return data
}

export async function updateObraSocial(id: string, values: ObraSocialFormData) {
  const { error } = await client().from('obras_sociales').update(values).eq('id', id)
  if (error) throw new Error(friendlyDatabaseError(error))
}

export async function listRequisitos(obraSocialId: string) {
  const { data, error } = await client().from('requisitos_obra_social').select('*').eq('obra_social_id', obraSocialId).order('nombre')
  if (error) throw new Error(friendlyDatabaseError(error))
  return (data ?? []) as RequisitoObraSocial[]
}
