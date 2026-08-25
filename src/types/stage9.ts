import type { Stage7Database } from './stage7'
export type Stage9Database=Omit<Stage7Database,'public'>&{public:Omit<Stage7Database['public'],'Functions'>&{Functions:Stage7Database['public']['Functions']&{
 sincronizar_alertas_operativas:{Args:Record<PropertyKey,never>;Returns:number}
 cambiar_estado_alerta:{Args:{p_alerta_id:string;p_estado:string};Returns:undefined}
}}}
export type AlertaRow=Stage9Database['public']['Tables']['alertas']['Row']&{clave_dedupe?:string|null}
export type EsperaRow=Stage9Database['public']['Tables']['lista_espera']['Row']
export interface AlertView extends AlertaRow{paciente:{nombres:string;apellidos:string;telefono:string|null}|null}
export interface WaitingView extends EsperaRow{paciente:{nombres:string;apellidos:string;dni:string;telefono:string|null}|null;tratamiento_nombre:string|null;box_nombre:string|null}
