import type { Database } from './database.types'

type PacienteBase = Database['public']['Tables']['pacientes']
type ObraSocialBase = Database['public']['Tables']['obras_sociales']

type PacienteStage3Columns = {
  patologia_general: string | null
  antecedentes: string | null
}

type ObraSocialStage3Columns = {
  sitio_web: string | null
  portal_url: string | null
  portal_paciente_url_template: string | null
  sesiones_tipicas: number | null
  requisitos_generales: string | null
}

/**
 * Superposición temporal del esquema de la Etapa 3.
 *
 * Permite comprobar el frontend antes de aplicar la migración remota. Después de
 * ejecutar `supabase db push` y regenerar database.types.ts, este tipo puede
 * reemplazarse por Database directamente sin editar el archivo generado a mano.
 */
export type Stage3Database = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: Omit<Database['public']['Tables'], 'pacientes' | 'obras_sociales'> & {
      pacientes: Omit<PacienteBase, 'Row' | 'Insert' | 'Update'> & {
        Row: PacienteBase['Row'] & PacienteStage3Columns
        Insert: PacienteBase['Insert'] & Partial<PacienteStage3Columns>
        Update: PacienteBase['Update'] & Partial<PacienteStage3Columns>
      }
      obras_sociales: Omit<ObraSocialBase, 'Row' | 'Insert' | 'Update'> & {
        Row: ObraSocialBase['Row'] & ObraSocialStage3Columns
        Insert: ObraSocialBase['Insert'] & Partial<ObraSocialStage3Columns>
        Update: ObraSocialBase['Update'] & Partial<ObraSocialStage3Columns>
      }
    }
  }
}

export type PacienteRow = Stage3Database['public']['Tables']['pacientes']['Row']

export type ObraSocialRow = Stage3Database['public']['Tables']['obras_sociales']['Row']

export interface PacienteConObraSocial extends PacienteRow {
  obra_social: Pick<ObraSocialRow, 'id' | 'nombre' | 'portal_url' | 'portal_paciente_url_template'> | null
}

export type PacienteFormData = Pick<PacienteRow,
  'dni' | 'nombres' | 'apellidos' | 'fecha_nacimiento' | 'telefono' | 'email' |
  'direccion' | 'obra_social_id' | 'numero_afiliado' | 'patologia_general' |
  'antecedentes' | 'observaciones' | 'contacto_emergencia' | 'telefono_emergencia' | 'estado'
>

export type ObraSocialFormData = Pick<ObraSocialRow,
  'nombre' | 'codigo' | 'telefono' | 'email' | 'sitio_web' | 'portal_url' |
  'portal_paciente_url_template' | 'sesiones_tipicas' | 'requisitos_generales' |
  'observaciones' | 'activo'
>

export interface RequisitoObraSocial {
  id: string
  obra_social_id: string
  nombre: string
  descripcion: string | null
  obligatorio: boolean
  activo: boolean
}
