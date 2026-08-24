export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      alertas: {
        Row: {
          asignada_a: string | null
          created_at: string
          created_by: string | null
          estado: string
          id: string
          mensaje: string
          paciente_id: string | null
          resuelta_at: string | null
          resuelta_por: string | null
          severidad: string
          tipo: string
          titulo: string
          tratamiento_id: string | null
          turno_id: string | null
          updated_at: string
          vence_at: string | null
        }
        Insert: {
          asignada_a?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          mensaje: string
          paciente_id?: string | null
          resuelta_at?: string | null
          resuelta_por?: string | null
          severidad?: string
          tipo: string
          titulo: string
          tratamiento_id?: string | null
          turno_id?: string | null
          updated_at?: string
          vence_at?: string | null
        }
        Update: {
          asignada_a?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          mensaje?: string
          paciente_id?: string | null
          resuelta_at?: string | null
          resuelta_por?: string | null
          severidad?: string
          tipo?: string
          titulo?: string
          tratamiento_id?: string | null
          turno_id?: string | null
          updated_at?: string
          vence_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_asignada_a_fkey"
            columns: ["asignada_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_resuelta_por_fkey"
            columns: ["resuelta_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_tratamiento_id_fkey"
            columns: ["tratamiento_id"]
            isOneToOne: false
            referencedRelation: "tratamientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_tratamiento_paciente_fk"
            columns: ["tratamiento_id", "paciente_id"]
            isOneToOne: false
            referencedRelation: "tratamientos"
            referencedColumns: ["id", "paciente_id"]
          },
          {
            foreignKeyName: "alertas_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_turno_paciente_tratamiento_fk"
            columns: ["turno_id", "paciente_id", "tratamiento_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id", "paciente_id", "tratamiento_id"]
          },
        ]
      }
      auditoria: {
        Row: {
          accion: string
          campos_modificados: string[] | null
          created_at: string
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          id: string
          registro_id: string | null
          request_id: string | null
          tabla: string
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          campos_modificados?: string[] | null
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          registro_id?: string | null
          request_id?: string | null
          tabla: string
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          campos_modificados?: string[] | null
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          registro_id?: string | null
          request_id?: string | null
          tabla?: string
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boxes: {
        Row: {
          activo: boolean
          capacidad: number
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          capacidad?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          capacidad?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      cierres_caja: {
        Row: {
          cantidad_devoluciones: number
          cantidad_pagos: number
          cerrado_at: string
          cerrado_por: string
          created_at: string
          estado: string
          fecha_operativa: string
          id: string
          observaciones: string | null
          reabierto_at: string | null
          reabierto_por: string | null
          saldo_neto: number | null
          total_devoluciones: number
          total_ingresos: number
          updated_at: string
        }
        Insert: {
          cantidad_devoluciones?: number
          cantidad_pagos?: number
          cerrado_at?: string
          cerrado_por: string
          created_at?: string
          estado?: string
          fecha_operativa: string
          id?: string
          observaciones?: string | null
          reabierto_at?: string | null
          reabierto_por?: string | null
          saldo_neto?: number | null
          total_devoluciones?: number
          total_ingresos?: number
          updated_at?: string
        }
        Update: {
          cantidad_devoluciones?: number
          cantidad_pagos?: number
          cerrado_at?: string
          cerrado_por?: string
          created_at?: string
          estado?: string
          fecha_operativa?: string
          id?: string
          observaciones?: string | null
          reabierto_at?: string | null
          reabierto_por?: string | null
          saldo_neto?: number | null
          total_devoluciones?: number
          total_ingresos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cierres_caja_cerrado_por_fkey"
            columns: ["cerrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierres_caja_reabierto_por_fkey"
            columns: ["reabierto_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_horarios: {
        Row: {
          activo: boolean
          box_id: string | null
          capacidad: number
          created_at: string
          dia_semana: number
          hora_desde: string
          hora_hasta: string
          id: string
          updated_at: string
          vigencia_desde: string
          vigencia_hasta: string | null
        }
        Insert: {
          activo?: boolean
          box_id?: string | null
          capacidad?: number
          created_at?: string
          dia_semana: number
          hora_desde: string
          hora_hasta: string
          id?: string
          updated_at?: string
          vigencia_desde?: string
          vigencia_hasta?: string | null
        }
        Update: {
          activo?: boolean
          box_id?: string | null
          capacidad?: number
          created_at?: string
          dia_semana?: number
          hora_desde?: string
          hora_hasta?: string
          id?: string
          updated_at?: string
          vigencia_desde?: string
          vigencia_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_horarios_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      devoluciones: {
        Row: {
          anulada_at: string | null
          created_at: string
          created_by: string | null
          estado: string
          fecha_devolucion: string
          id: string
          importe: number
          metodo_pago_id: string
          motivo: string
          motivo_anulacion: string | null
          pago_id: string
          referencia: string | null
          updated_at: string
        }
        Insert: {
          anulada_at?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_devolucion?: string
          id?: string
          importe: number
          metodo_pago_id: string
          motivo: string
          motivo_anulacion?: string | null
          pago_id: string
          referencia?: string | null
          updated_at?: string
        }
        Update: {
          anulada_at?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_devolucion?: string
          id?: string
          importe?: number
          metodo_pago_id?: string
          motivo?: string
          motivo_anulacion?: string | null
          pago_id?: string
          referencia?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devoluciones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_metodo_pago_id_fkey"
            columns: ["metodo_pago_id"]
            isOneToOne: false
            referencedRelation: "metodos_pago"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          created_at: string
          created_by: string | null
          estado: string
          fecha_vencimiento: string | null
          id: string
          mime_type: string | null
          nombre: string
          obra_social_id: string | null
          paciente_id: string
          reemplazado_por_id: string | null
          requisito_obra_social_id: string | null
          storage_bucket: string
          storage_path: string
          tamanio_bytes: number | null
          tipo_documento: string
          tratamiento_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_vencimiento?: string | null
          id?: string
          mime_type?: string | null
          nombre: string
          obra_social_id?: string | null
          paciente_id: string
          reemplazado_por_id?: string | null
          requisito_obra_social_id?: string | null
          storage_bucket: string
          storage_path: string
          tamanio_bytes?: number | null
          tipo_documento: string
          tratamiento_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_vencimiento?: string | null
          id?: string
          mime_type?: string | null
          nombre?: string
          obra_social_id?: string | null
          paciente_id?: string
          reemplazado_por_id?: string | null
          requisito_obra_social_id?: string | null
          storage_bucket?: string
          storage_path?: string
          tamanio_bytes?: number | null
          tipo_documento?: string
          tratamiento_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_obra_social_id_fkey"
            columns: ["obra_social_id"]
            isOneToOne: false
            referencedRelation: "obras_sociales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_reemplazado_por_id_fkey"
            columns: ["reemplazado_por_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_requisito_obra_fk"
            columns: ["requisito_obra_social_id", "obra_social_id"]
            isOneToOne: false
            referencedRelation: "requisitos_obra_social"
            referencedColumns: ["id", "obra_social_id"]
          },
          {
            foreignKeyName: "documentos_requisito_obra_social_id_fkey"
            columns: ["requisito_obra_social_id"]
            isOneToOne: false
            referencedRelation: "requisitos_obra_social"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_tratamiento_id_fkey"
            columns: ["tratamiento_id"]
            isOneToOne: false
            referencedRelation: "tratamientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_tratamiento_paciente_fk"
            columns: ["tratamiento_id", "paciente_id"]
            isOneToOne: false
            referencedRelation: "tratamientos"
            referencedColumns: ["id", "paciente_id"]
          },
        ]
      }
      excepciones_horarias: {
        Row: {
          activo: boolean
          box_id: string | null
          capacidad: number | null
          created_at: string
          fecha: string
          hora_desde: string | null
          hora_hasta: string | null
          id: string
          motivo: string
          tipo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          box_id?: string | null
          capacidad?: number | null
          created_at?: string
          fecha: string
          hora_desde?: string | null
          hora_hasta?: string | null
          id?: string
          motivo: string
          tipo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          box_id?: string | null
          capacidad?: number | null
          created_at?: string
          fecha?: string
          hora_desde?: string | null
          hora_hasta?: string | null
          id?: string
          motivo?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "excepciones_horarias_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_espera: {
        Row: {
          box_id: string | null
          created_at: string
          created_by: string | null
          dias_semana: number[]
          estado: string
          fecha_desde: string
          fecha_hasta: string | null
          hora_desde: string | null
          hora_hasta: string | null
          id: string
          observaciones: string | null
          paciente_id: string
          prioridad: number
          tipo_tratamiento_id: string | null
          tratamiento_id: string | null
          updated_at: string
        }
        Insert: {
          box_id?: string | null
          created_at?: string
          created_by?: string | null
          dias_semana?: number[]
          estado?: string
          fecha_desde?: string
          fecha_hasta?: string | null
          hora_desde?: string | null
          hora_hasta?: string | null
          id?: string
          observaciones?: string | null
          paciente_id: string
          prioridad?: number
          tipo_tratamiento_id?: string | null
          tratamiento_id?: string | null
          updated_at?: string
        }
        Update: {
          box_id?: string | null
          created_at?: string
          created_by?: string | null
          dias_semana?: number[]
          estado?: string
          fecha_desde?: string
          fecha_hasta?: string | null
          hora_desde?: string | null
          hora_hasta?: string | null
          id?: string
          observaciones?: string | null
          paciente_id?: string
          prioridad?: number
          tipo_tratamiento_id?: string | null
          tratamiento_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lista_espera_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_tipo_tratamiento_id_fkey"
            columns: ["tipo_tratamiento_id"]
            isOneToOne: false
            referencedRelation: "tipos_tratamiento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_tratamiento_id_fkey"
            columns: ["tratamiento_id"]
            isOneToOne: false
            referencedRelation: "tratamientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_tratamiento_paciente_fk"
            columns: ["tratamiento_id", "paciente_id"]
            isOneToOne: false
            referencedRelation: "tratamientos"
            referencedColumns: ["id", "paciente_id"]
          },
        ]
      }
      metodos_pago: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          requiere_referencia: boolean
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          requiere_referencia?: boolean
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          requiere_referencia?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      obras_sociales: {
        Row: {
          activo: boolean
          codigo: string | null
          created_at: string
          email: string | null
          id: string
          nombre: string
          observaciones: string | null
          portal_paciente_url_template: string | null
          portal_url: string | null
          requisitos_generales: string | null
          sesiones_tipicas: number | null
          sitio_web: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nombre: string
          observaciones?: string | null
          portal_paciente_url_template?: string | null
          portal_url?: string | null
          requisitos_generales?: string | null
          sesiones_tipicas?: number | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          observaciones?: string | null
          portal_paciente_url_template?: string | null
          portal_url?: string | null
          requisitos_generales?: string | null
          sesiones_tipicas?: number | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pacientes: {
        Row: {
          antecedentes: string | null
          apellidos: string
          contacto_emergencia: string | null
          created_at: string
          created_by: string | null
          direccion: string | null
          dni: string
          email: string | null
          estado: string
          fecha_nacimiento: string | null
          fecha_registro: string
          id: string
          nombres: string
          numero_afiliado: string | null
          obra_social_id: string | null
          observaciones: string | null
          patologia_general: string | null
          telefono: string | null
          telefono_emergencia: string | null
          updated_at: string
        }
        Insert: {
          antecedentes?: string | null
          apellidos: string
          contacto_emergencia?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          dni: string
          email?: string | null
          estado?: string
          fecha_nacimiento?: string | null
          fecha_registro?: string
          id?: string
          nombres: string
          numero_afiliado?: string | null
          obra_social_id?: string | null
          observaciones?: string | null
          patologia_general?: string | null
          telefono?: string | null
          telefono_emergencia?: string | null
          updated_at?: string
        }
        Update: {
          antecedentes?: string | null
          apellidos?: string
          contacto_emergencia?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          dni?: string
          email?: string | null
          estado?: string
          fecha_nacimiento?: string | null
          fecha_registro?: string
          id?: string
          nombres?: string
          numero_afiliado?: string | null
          obra_social_id?: string | null
          observaciones?: string | null
          patologia_general?: string | null
          telefono?: string | null
          telefono_emergencia?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_obra_social_id_fkey"
            columns: ["obra_social_id"]
            isOneToOne: false
            referencedRelation: "obras_sociales"
            referencedColumns: ["id"]
          },
        ]
      }
      pago_aplicaciones: {
        Row: {
          created_at: string
          created_by: string | null
          estado: string
          id: string
          importe_aplicado: number
          pago_id: string
          sesion_id: string | null
          tratamiento_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          importe_aplicado: number
          pago_id: string
          sesion_id?: string | null
          tratamiento_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          importe_aplicado?: number
          pago_id?: string
          sesion_id?: string | null
          tratamiento_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pago_aplicaciones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_aplicaciones_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_aplicaciones_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_aplicaciones_tratamiento_id_fkey"
            columns: ["tratamiento_id"]
            isOneToOne: false
            referencedRelation: "tratamientos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          anulado_at: string | null
          concepto: string
          created_at: string
          created_by: string | null
          estado: string
          fecha_pago: string
          id: string
          importe: number
          metodo_pago_id: string
          motivo_anulacion: string | null
          paciente_id: string
          referencia: string | null
          tratamiento_id: string | null
          updated_at: string
        }
        Insert: {
          anulado_at?: string | null
          concepto: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_pago?: string
          id?: string
          importe: number
          metodo_pago_id: string
          motivo_anulacion?: string | null
          paciente_id: string
          referencia?: string | null
          tratamiento_id?: string | null
          updated_at?: string
        }
        Update: {
          anulado_at?: string | null
          concepto?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_pago?: string
          id?: string
          importe?: number
          metodo_pago_id?: string
          motivo_anulacion?: string | null
          paciente_id?: string
          referencia?: string | null
          tratamiento_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_metodo_pago_id_fkey"
            columns: ["metodo_pago_id"]
            isOneToOne: false
            referencedRelation: "metodos_pago"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_tratamiento_id_fkey"
            columns: ["tratamiento_id"]
            isOneToOne: false
            referencedRelation: "tratamientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_tratamiento_paciente_fk"
            columns: ["tratamiento_id", "paciente_id"]
            isOneToOne: false
            referencedRelation: "tratamientos"
            referencedColumns: ["id", "paciente_id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          created_at: string
          email: string
          id: string
          nombre_completo: string
          rol: string
          ultimo_acceso_at: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email: string
          id: string
          nombre_completo: string
          rol?: string
          ultimo_acceso_at?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string
          id?: string
          nombre_completo?: string
          rol?: string
          ultimo_acceso_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reglas_consumo_sesion: {
        Row: {
          activo: boolean
          cantidad: number
          consume_sesion: boolean
          created_at: string
          estado_turno: string
          id: string
          obra_social_id: string | null
          prioridad: number
          updated_at: string
          vigencia_desde: string
          vigencia_hasta: string | null
        }
        Insert: {
          activo?: boolean
          cantidad?: number
          consume_sesion: boolean
          created_at?: string
          estado_turno: string
          id?: string
          obra_social_id?: string | null
          prioridad?: number
          updated_at?: string
          vigencia_desde?: string
          vigencia_hasta?: string | null
        }
        Update: {
          activo?: boolean
          cantidad?: number
          consume_sesion?: boolean
          created_at?: string
          estado_turno?: string
          id?: string
          obra_social_id?: string | null
          prioridad?: number
          updated_at?: string
          vigencia_desde?: string
          vigencia_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reglas_consumo_sesion_obra_social_id_fkey"
            columns: ["obra_social_id"]
            isOneToOne: false
            referencedRelation: "obras_sociales"
            referencedColumns: ["id"]
          },
        ]
      }
      requisitos_obra_social: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          obligatorio: boolean
          obra_social_id: string
          updated_at: string
          vigencia_desde: string | null
          vigencia_hasta: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          obligatorio?: boolean
          obra_social_id: string
          updated_at?: string
          vigencia_desde?: string | null
          vigencia_hasta?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          obligatorio?: boolean
          obra_social_id?: string
          updated_at?: string
          vigencia_desde?: string | null
          vigencia_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisitos_obra_social_obra_social_id_fkey"
            columns: ["obra_social_id"]
            isOneToOne: false
            referencedRelation: "obras_sociales"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones: {
        Row: {
          anulada_at: string | null
          box_id: string | null
          created_at: string
          created_by: string | null
          estado: string
          fecha_atencion: string
          id: string
          motivo_anulacion: string | null
          notas: string | null
          paciente_id: string
          regla_consumo_id: string | null
          tratamiento_id: string
          turno_id: string | null
          unidades_consumidas: number
          updated_at: string
        }
        Insert: {
          anulada_at?: string | null
          box_id?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_atencion?: string
          id?: string
          motivo_anulacion?: string | null
          notas?: string | null
          paciente_id: string
          regla_consumo_id?: string | null
          tratamiento_id: string
          turno_id?: string | null
          unidades_consumidas?: number
          updated_at?: string
        }
        Update: {
          anulada_at?: string | null
          box_id?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_atencion?: string
          id?: string
          motivo_anulacion?: string | null
          notas?: string | null
          paciente_id?: string
          regla_consumo_id?: string | null
          tratamiento_id?: string
          turno_id?: string | null
          unidades_consumidas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_regla_consumo_id_fkey"
            columns: ["regla_consumo_id"]
            isOneToOne: false
            referencedRelation: "reglas_consumo_sesion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_tratamiento_paciente_fk"
            columns: ["tratamiento_id", "paciente_id"]
            isOneToOne: false
            referencedRelation: "tratamientos"
            referencedColumns: ["id", "paciente_id"]
          },
          {
            foreignKeyName: "sesiones_turno_contexto_fk"
            columns: ["turno_id", "paciente_id", "tratamiento_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id", "paciente_id", "tratamiento_id"]
          },
        ]
      }
      tipos_tratamiento: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          duracion_minutos: number
          id: string
          nombre: string
          precio_referencia: number | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number
          id?: string
          nombre: string
          precio_referencia?: number | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number
          id?: string
          nombre?: string
          precio_referencia?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tratamientos: {
        Row: {
          box_preferido_id: string | null
          created_at: string
          created_by: string | null
          diagnostico: string | null
          estado: string
          fecha_alta_clinica: string | null
          fecha_estimada_fin: string | null
          fecha_inicio: string
          id: string
          indicaciones: string | null
          numero_autorizacion: string | null
          obra_social_id: string | null
          paciente_id: string
          precio_sesion: number | null
          sesiones_autorizadas: number | null
          tipo_tratamiento_id: string
          updated_at: string
        }
        Insert: {
          box_preferido_id?: string | null
          created_at?: string
          created_by?: string | null
          diagnostico?: string | null
          estado?: string
          fecha_alta_clinica?: string | null
          fecha_estimada_fin?: string | null
          fecha_inicio?: string
          id?: string
          indicaciones?: string | null
          numero_autorizacion?: string | null
          obra_social_id?: string | null
          paciente_id: string
          precio_sesion?: number | null
          sesiones_autorizadas?: number | null
          tipo_tratamiento_id: string
          updated_at?: string
        }
        Update: {
          box_preferido_id?: string | null
          created_at?: string
          created_by?: string | null
          diagnostico?: string | null
          estado?: string
          fecha_alta_clinica?: string | null
          fecha_estimada_fin?: string | null
          fecha_inicio?: string
          id?: string
          indicaciones?: string | null
          numero_autorizacion?: string | null
          obra_social_id?: string | null
          paciente_id?: string
          precio_sesion?: number | null
          sesiones_autorizadas?: number | null
          tipo_tratamiento_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tratamientos_box_preferido_id_fkey"
            columns: ["box_preferido_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tratamientos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tratamientos_obra_social_id_fkey"
            columns: ["obra_social_id"]
            isOneToOne: false
            referencedRelation: "obras_sociales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tratamientos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tratamientos_tipo_tratamiento_id_fkey"
            columns: ["tipo_tratamiento_id"]
            isOneToOne: false
            referencedRelation: "tipos_tratamiento"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          box_id: string
          cancelado_at: string | null
          created_at: string
          created_by: string | null
          estado: string
          fin_at: string
          id: string
          inicio_at: string
          motivo_cancelacion: string | null
          observaciones: string | null
          paciente_id: string
          tratamiento_id: string
          updated_at: string
        }
        Insert: {
          box_id: string
          cancelado_at?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fin_at: string
          id?: string
          inicio_at: string
          motivo_cancelacion?: string | null
          observaciones?: string | null
          paciente_id: string
          tratamiento_id: string
          updated_at?: string
        }
        Update: {
          box_id?: string
          cancelado_at?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fin_at?: string
          id?: string
          inicio_at?: string
          motivo_cancelacion?: string | null
          observaciones?: string | null
          paciente_id?: string
          tratamiento_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turnos_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_tratamiento_id_fkey"
            columns: ["tratamiento_id"]
            isOneToOne: false
            referencedRelation: "tratamientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_tratamiento_paciente_fk"
            columns: ["tratamiento_id", "paciente_id"]
            isOneToOne: false
            referencedRelation: "tratamientos"
            referencedColumns: ["id", "paciente_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_has_role: { Args: { roles: string[] }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
