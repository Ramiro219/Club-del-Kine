import type { Database } from './database.types'
import type { LicenseStatus } from './stage10'

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export interface CenterConfig {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  email: string | null
  zona_horaria: string
  created_at: string
  updated_at: string
}

export interface Professional {
  id: string
  nombre_completo: string
  matricula: string
  especialidad: string
  telefono: string | null
  email: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface AlertConfig {
  id: string
  sesiones_bajas_activa: boolean
  sesiones_restantes_umbral: number
  tratamiento_vencido_activa: boolean
  documentacion_pendiente_activa: boolean
  pago_pendiente_activa: boolean
  turno_proximo_activa: boolean
  turno_proximo_horas: number
  lista_espera_activa: boolean
  capacidad_activa: boolean
  capacidad_dias_anticipacion: number
  created_at: string
  updated_at: string
}

type Public = Database['public']
export type Stage12Database = Omit<Database, 'public'> & {
  public: Omit<Public, 'Tables'> & {
    Tables: Omit<Public['Tables'], 'configuracion_centro' | 'profesionales' | 'configuracion_alertas'> & {
      configuracion_centro: Table<CenterConfig, Omit<CenterConfig, 'created_at' | 'updated_at'> & Partial<Pick<CenterConfig, 'created_at' | 'updated_at'>>>
      profesionales: Table<Professional, Omit<Professional, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Professional, 'id' | 'created_at' | 'updated_at'>>>
      configuracion_alertas: Table<AlertConfig, Omit<AlertConfig, 'created_at' | 'updated_at'> & Partial<Pick<AlertConfig, 'created_at' | 'updated_at'>>>
    },
    Functions: Omit<Public['Functions'], 'estado_licencia' | 'renovar_licencia_30_dias' | 'historial_licencia'> & {
      estado_licencia: { Args: Record<PropertyKey, never>; Returns: LicenseStatus }
      renovar_licencia_30_dias: { Args: { p_observaciones?: string }; Returns: string }
      historial_licencia: { Args: Record<PropertyKey, never>; Returns: import('./stage10').LicenseRenewal[] }
    },
  }
}

export type ProfileConfig = Database['public']['Tables']['profiles']['Row']
export type BoxConfig = Database['public']['Tables']['boxes']['Row']
export type ScheduleConfig = Database['public']['Tables']['configuracion_horarios']['Row']
export type TreatmentTypeConfig = Database['public']['Tables']['tipos_tratamiento']['Row']
export type PaymentMethodConfig = Database['public']['Tables']['metodos_pago']['Row']

export interface ConfigurationOverview {
  center: CenterConfig | null
  users: ProfileConfig[]
  professionals: Professional[]
  boxes: BoxConfig[]
  schedules: ScheduleConfig[]
  treatmentTypes: TreatmentTypeConfig[]
  paymentMethods: PaymentMethodConfig[]
  alerts: AlertConfig | null
  license: LicenseStatus | null
}
