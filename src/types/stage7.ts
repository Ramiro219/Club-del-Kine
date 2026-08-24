import type { Stage6Database } from './stage6'

export type Stage7Database = Omit<Stage6Database, 'public'> & {
  public: Omit<Stage6Database['public'], 'Functions'> & {
    Functions: Stage6Database['public']['Functions'] & {
      reemplazar_documento_atomico: {
        Args: {
          p_documento_id: string
          p_nombre: string
          p_storage_path: string
          p_mime_type: string
          p_tamanio_bytes: number
        }
        Returns: string
      }
    }
  }
}

export type DocumentoRow = Stage7Database['public']['Tables']['documentos']['Row']
export type DocumentoEstado = 'pendiente' | 'vigente' | 'observado' | 'vencido' | 'reemplazado' | 'archivado'
export type DocumentoTipo = 'Orden médica' | 'Autorización' | 'Planilla de asistencia' | 'Comprobante' | 'Documento' | 'Otro'

export interface DocumentoView extends Omit<DocumentoRow, 'estado'> {
  estado: DocumentoEstado
  paciente: { nombres: string; apellidos: string; dni: string } | null
  tratamiento_nombre: string | null
  obra_social_nombre: string | null
}

export interface DocumentoFormData {
  paciente_id: string
  tratamiento_id: string | null
  obra_social_id: string | null
  requisito_obra_social_id: string | null
  tipo_documento: DocumentoTipo
  fecha_vencimiento: string | null
  estado: 'pendiente' | 'vigente' | 'observado'
  file: File
}
