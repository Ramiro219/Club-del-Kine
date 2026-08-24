import type { Stage4Database } from './stage4'

export type TurnoEstado = 'programado' | 'confirmado' | 'presente' | 'atendido' | 'cancelado' | 'ausente'
export type TurnoRow = Stage4Database['public']['Tables']['turnos']['Row']
export type BoxRow = Stage4Database['public']['Tables']['boxes']['Row']
export type ScheduleRow = Stage4Database['public']['Tables']['configuracion_horarios']['Row']

export interface TurnoFormData {
  paciente_id: string
  tratamiento_id: string
  box_id: string
  inicio_at: string
  fin_at: string
  estado: TurnoEstado
  observaciones: string | null
}

export interface TurnoView extends TurnoRow {
  paciente: { id: string; nombres: string; apellidos: string; dni: string } | null
  tratamiento: { id: string; diagnostico: string | null; tipo_nombre: string } | null
  obra_social_nombre: string | null
  box: BoxRow | null
}

export interface CalendarData {
  turnos: TurnoView[]
  boxes: BoxRow[]
  schedules: ScheduleRow[]
}

export interface BoxFormData {
  nombre: string
  descripcion: string | null
  capacidad: number
  activo: boolean
  dias: number[]
  manana_desde: string
  manana_hasta: string
  tarde_desde: string
  tarde_hasta: string
}
