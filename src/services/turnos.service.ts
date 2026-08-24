import { friendlyDatabaseError } from './errorMessage'
import { supabase } from './supabase'
import type { BoxFormData, CalendarData, TurnoFormData, TurnoView } from '../types/stage5'

function client() { if (!supabase) throw new Error('Supabase no está configurado.'); return supabase }

export async function getCalendarData(from: string, to: string, pacienteId?: string): Promise<CalendarData> {
  let turnsQuery = client().from('turnos').select('*').gte('inicio_at', from).lt('inicio_at', to).order('inicio_at')
  if (pacienteId) turnsQuery = turnsQuery.eq('paciente_id', pacienteId)
  const [turnsResult, boxesResult, schedulesResult] = await Promise.all([
    turnsQuery,
    client().from('boxes').select('*').eq('activo', true).order('nombre'),
    client().from('configuracion_horarios').select('*').eq('activo', true),
  ])
  const error = turnsResult.error ?? boxesResult.error ?? schedulesResult.error
  if (error) throw new Error(friendlyDatabaseError(error))
  const turns = turnsResult.data ?? []
  if (!turns.length) return { turnos: [], boxes: boxesResult.data ?? [], schedules: schedulesResult.data ?? [] }
  const patientIds = [...new Set(turns.map((item) => item.paciente_id))]
  const treatmentIds = [...new Set(turns.map((item) => item.tratamiento_id))]
  const [patientsResult, treatmentsResult] = await Promise.all([
    client().from('pacientes').select('id,nombres,apellidos,dni').in('id', patientIds),
    client().from('tratamientos').select('id,diagnostico,tipo_tratamiento_id,obra_social_id').in('id', treatmentIds),
  ])
  if (patientsResult.error || treatmentsResult.error) throw new Error(friendlyDatabaseError(patientsResult.error ?? treatmentsResult.error))
  const treatments = treatmentsResult.data ?? []
  const typeIds = [...new Set(treatments.map((item) => item.tipo_tratamiento_id))]
  const insurerIds = [...new Set(treatments.map((item) => item.obra_social_id).filter((id): id is string => Boolean(id)))]
  const [typesResult, insurersResult] = await Promise.all([
    client().from('tipos_tratamiento').select('id,nombre').in('id', typeIds),
    insurerIds.length ? client().from('obras_sociales').select('id,nombre').in('id', insurerIds) : Promise.resolve({ data: [], error: null }),
  ])
  if (typesResult.error || insurersResult.error) throw new Error(friendlyDatabaseError(typesResult.error ?? insurersResult.error))
  const patients = new Map((patientsResult.data ?? []).map((item) => [item.id,item]))
  const boxes = new Map((boxesResult.data ?? []).map((item) => [item.id,item]))
  const types = new Map((typesResult.data ?? []).map((item) => [item.id,item.nombre]))
  const insurers = new Map((insurersResult.data ?? []).map((item) => [item.id,item.nombre]))
  const treatmentMap = new Map(treatments.map((item) => [item.id,item]))
  const hydrated: TurnoView[] = turns.map((turn) => { const treatment=treatmentMap.get(turn.tratamiento_id); return { ...turn, paciente:patients.get(turn.paciente_id)??null, box:boxes.get(turn.box_id)??null, tratamiento:treatment?{id:treatment.id,diagnostico:treatment.diagnostico,tipo_nombre:types.get(treatment.tipo_tratamiento_id)??'Tratamiento'}:null, obra_social_nombre:treatment?.obra_social_id?insurers.get(treatment.obra_social_id)??null:null } })
  return { turnos: hydrated, boxes: boxesResult.data ?? [], schedules: schedulesResult.data ?? [] }
}

export async function createTurno(values: TurnoFormData) { const {data,error}=await client().from('turnos').insert(values).select('id').single(); if(error)throw new Error(friendlyDatabaseError(error)); return data }
export async function updateTurno(id:string,values:TurnoFormData) { const {error}=await client().from('turnos').update({...values,motivo_cancelacion:null,cancelado_at:null}).eq('id',id); if(error)throw new Error(friendlyDatabaseError(error)) }
export async function setTurnoEstado(id:string,estado:string,motivo?:string) { const patch=estado==='cancelado'?{estado,motivo_cancelacion:motivo?.trim(),cancelado_at:new Date().toISOString()}:{estado,motivo_cancelacion:null,cancelado_at:null}; const {error}=await client().from('turnos').update(patch).eq('id',id); if(error)throw new Error(friendlyDatabaseError(error)) }

export async function listBoxesWithSchedules() { const [boxes,schedules]=await Promise.all([client().from('boxes').select('*').order('nombre'),client().from('configuracion_horarios').select('*').eq('activo',true).order('dia_semana')]); const error=boxes.error??schedules.error;if(error)throw new Error(friendlyDatabaseError(error));return{boxes:boxes.data??[],schedules:schedules.data??[]} }

export async function saveBox(id:string|null,values:BoxFormData) {
  const boxPayload={nombre:values.nombre.trim(),descripcion:values.descripcion,capacidad:values.capacidad,activo:values.activo}
  const result=id?await client().from('boxes').update(boxPayload).eq('id',id).select('id').single():await client().from('boxes').insert(boxPayload).select('id').single()
  if(result.error)throw new Error(friendlyDatabaseError(result.error));const boxId=result.data.id
  const {data:existing,error:existingError}=await client().from('configuracion_horarios').select('id').eq('box_id',boxId).eq('activo',true)
  if(existingError)throw new Error(friendlyDatabaseError(existingError))
  if(existing?.length){const{error}=await client().from('configuracion_horarios').update({activo:false}).in('id',existing.map((item)=>item.id));if(error)throw new Error(friendlyDatabaseError(error))}
  const today=new Date().toISOString().slice(0,10)
  const rows=values.dias.flatMap((dia_semana)=>[
    {box_id:boxId,dia_semana,hora_desde:values.manana_desde,hora_hasta:values.manana_hasta,capacidad:values.capacidad,vigencia_desde:today,activo:true},
    {box_id:boxId,dia_semana,hora_desde:values.tarde_desde,hora_hasta:values.tarde_hasta,capacidad:values.capacidad,vigencia_desde:today,activo:true},
  ])
  const{error}=await client().from('configuracion_horarios').insert(rows);if(error)throw new Error(friendlyDatabaseError(error))
}
