import { friendlyDatabaseError } from './errorMessage'
import { supabase } from './supabase'
import { integerRange, optionalEmail, requiredText } from '../utils/configurationValidation'
import type { AlertConfig, CenterConfig, ConfigurationOverview, PaymentMethodConfig, Professional, ProfileConfig, TreatmentTypeConfig } from '../types/stage12'

function client() { if (!supabase) throw new Error('Supabase no está configurado.'); return supabase }
function fail(error: unknown): never { throw new Error(friendlyDatabaseError(error)) }

export async function loadConfiguration(): Promise<ConfigurationOverview> {
  const [center, users, professionals, boxes, schedules, treatmentTypes, paymentMethods, alerts, license] = await Promise.all([
    client().from('configuracion_centro').select('*').maybeSingle(),
    client().from('profiles').select('*').order('nombre_completo'),
    client().from('profesionales').select('*').order('nombre_completo'),
    client().from('boxes').select('*').order('nombre'),
    client().from('configuracion_horarios').select('*').eq('activo', true).order('dia_semana'),
    client().from('tipos_tratamiento').select('*').order('nombre'),
    client().from('metodos_pago').select('*').order('nombre'),
    client().from('configuracion_alertas').select('*').maybeSingle(),
    client().rpc('estado_licencia'),
  ])
  const error = center.error ?? users.error ?? professionals.error ?? boxes.error ?? schedules.error ?? treatmentTypes.error ?? paymentMethods.error ?? alerts.error ?? license.error
  if (error) fail(error)
  return { center: center.data, users: users.data ?? [], professionals: professionals.data ?? [], boxes: boxes.data ?? [], schedules: schedules.data ?? [], treatmentTypes: treatmentTypes.data ?? [], paymentMethods: paymentMethods.data ?? [], alerts: alerts.data, license: license.data }
}

export async function saveCenter(values: CenterConfig) {
  const payload = { nombre: requiredText(values.nombre, 'El nombre del centro'), direccion: values.direccion?.trim() || null, telefono: values.telefono?.trim() || null, email: optionalEmail(values.email), zona_horaria: requiredText(values.zona_horaria, 'La zona horaria', 80) }
  const { error } = await client().from('configuracion_centro').update(payload).eq('id', values.id)
  if (error) fail(error)
}

export async function saveUser(values: ProfileConfig) {
  if (values.rol === 'desarrollador') throw new Error('El rol desarrollador está protegido y no se administra desde este módulo.')
  const payload = { nombre_completo: requiredText(values.nombre_completo, 'El nombre'), rol: values.rol === 'administrador' ? 'administrador' : 'recepcion', activo: values.activo }
  const { error } = await client().from('profiles').update(payload).eq('id', values.id)
  if (error) fail(error)
}

export async function saveProfessional(values: Partial<Professional> & Pick<Professional, 'nombre_completo' | 'matricula' | 'especialidad' | 'activo'>) {
  const payload = { nombre_completo: requiredText(values.nombre_completo, 'El nombre'), matricula: requiredText(values.matricula, 'La matrícula', 60), especialidad: requiredText(values.especialidad, 'La especialidad'), telefono: values.telefono?.trim() || null, email: optionalEmail(values.email), activo: values.activo }
  const result = values.id ? await client().from('profesionales').update(payload).eq('id', values.id) : await client().from('profesionales').insert(payload)
  if (result.error) fail(result.error)
}

export async function saveTreatmentType(values: TreatmentTypeConfig) {
  const payload = { nombre: requiredText(values.nombre, 'El nombre'), descripcion: values.descripcion?.trim() || null, duracion_minutos: integerRange(Number(values.duracion_minutos), 'La duración', 5, 480), precio_referencia: values.precio_referencia === null ? null : Math.max(0, Number(values.precio_referencia)), activo: values.activo }
  const result = values.id ? await client().from('tipos_tratamiento').update(payload).eq('id', values.id) : await client().from('tipos_tratamiento').insert(payload)
  if (result.error) fail(result.error)
}

export async function savePaymentMethod(values: PaymentMethodConfig) {
  const payload = { nombre: requiredText(values.nombre, 'El nombre'), requiere_referencia: values.requiere_referencia, activo: values.activo }
  const result = values.id ? await client().from('metodos_pago').update(payload).eq('id', values.id) : await client().from('metodos_pago').insert(payload)
  if (result.error) fail(result.error)
}

export async function saveAlertConfig(values: AlertConfig) {
  const payload = { sesiones_bajas_activa: values.sesiones_bajas_activa, sesiones_restantes_umbral: integerRange(Number(values.sesiones_restantes_umbral), 'El umbral de sesiones', 1, 20), tratamiento_vencido_activa: values.tratamiento_vencido_activa, documentacion_pendiente_activa: values.documentacion_pendiente_activa, pago_pendiente_activa: values.pago_pendiente_activa, turno_proximo_activa: values.turno_proximo_activa, turno_proximo_horas: integerRange(Number(values.turno_proximo_horas), 'Las horas de anticipación', 1, 168), lista_espera_activa: values.lista_espera_activa, capacidad_activa: values.capacidad_activa, capacidad_dias_anticipacion: integerRange(Number(values.capacidad_dias_anticipacion), 'Los días de capacidad', 1, 30) }
  const { error } = await client().from('configuracion_alertas').update(payload).eq('id', values.id)
  if (error) fail(error)
}
