import type { Stage3Database } from './stage3'

type TratamientoBase = Stage3Database['public']['Tables']['tratamientos']
type SesionBase = Stage3Database['public']['Tables']['sesiones']

type TratamientoStage4 = { fecha_estimada_fin: string | null }
type SesionStage4 = { box_id: string | null }

export type Stage4Database = Omit<Stage3Database, 'public'> & {
  public: Omit<Stage3Database['public'], 'Tables'> & {
    Tables: Omit<Stage3Database['public']['Tables'], 'tratamientos' | 'sesiones'> & {
      tratamientos: Omit<TratamientoBase, 'Row' | 'Insert' | 'Update'> & {
        Row: TratamientoBase['Row'] & TratamientoStage4
        Insert: TratamientoBase['Insert'] & Partial<TratamientoStage4>
        Update: TratamientoBase['Update'] & Partial<TratamientoStage4>
      }
      sesiones: Omit<SesionBase, 'Row' | 'Insert' | 'Update'> & {
        Row: SesionBase['Row'] & SesionStage4
        Insert: SesionBase['Insert'] & Partial<SesionStage4>
        Update: SesionBase['Update'] & Partial<SesionStage4>
      }
    }
  }
}

export type TratamientoEstado = 'borrador' | 'activo' | 'pausado' | 'finalizado' | 'cancelado'
export type SesionEstado = 'programada' | 'realizada' | 'ausente_avisado' | 'ausente_consumida' | 'cancelada' | 'reprogramada' | 'anulada'

export interface TratamientoFormData {
  paciente_id: string
  tipo_tratamiento_id: string
  obra_social_id: string | null
  box_preferido_id: string | null
  diagnostico: string | null
  indicaciones: string | null
  fecha_inicio: string
  fecha_estimada_fin: string | null
  sesiones_autorizadas: number | null
  numero_autorizacion: string | null
  precio_sesion: number | null
  estado: string
}

export interface SesionFormData {
  paciente_id: string
  tratamiento_id: string
  turno_id: string | null
  box_id: string | null
  fecha_atencion: string
  estado: string
  notas: string | null
}

export interface TreatmentStats {
  autorizadas: number | null
  realizadas: number
  ausencias: number
  canceladas: number
  consumidas: number
  restantes: number | null
}

export type TratamientoView = Stage4Database['public']['Tables']['tratamientos']['Row'] & {
  paciente: { id: string; nombres: string; apellidos: string; dni: string } | null
  tipo: { id: string; nombre: string } | null
  obra_social: { id: string; nombre: string } | null
  box: { id: string; nombre: string } | null
  sesiones: Array<{ id: string; estado: string; unidades_consumidas: number }>
  stats: TreatmentStats
}

export type SesionView = Stage4Database['public']['Tables']['sesiones']['Row'] & {
  paciente: { id: string; nombres: string; apellidos: string; dni: string } | null
  tratamiento: { id: string; diagnostico: string | null; tipo: { nombre: string } | null } | null
  box: { id: string; nombre: string } | null
  pago_aplicaciones: Array<{ id: string; estado: string }>
}

export interface Stage4Catalogs {
  pacientes: Array<{ id: string; nombres: string; apellidos: string; dni: string; obra_social_id: string | null }>
  tipos: Array<{ id: string; nombre: string; precio_referencia: number | null }>
  obras: Array<{ id: string; nombre: string }>
  boxes: Array<{ id: string; nombre: string }>
}
