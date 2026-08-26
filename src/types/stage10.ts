import type { Stage9Database } from './stage9'
export type Stage10Database=Omit<Stage9Database,'public'>&{public:Omit<Stage9Database['public'],'Functions'>&{Functions:Stage9Database['public']['Functions']&{
 estado_licencia:{Args:Record<PropertyKey,never>;Returns:LicenseStatus}
 renovar_licencia_30_dias:{Args:{p_observaciones?:string};Returns:string}
 historial_licencia:{Args:Record<PropertyKey,never>;Returns:LicenseRenewal[]}
}}}
export interface LicenseStatus{id:string;cliente_nombre:string;inicio_at:string;vence_at:string;activa:boolean;dias_restantes:number;estado:'vigente'|'por_vencer'|'vencida'}
export interface LicenseRenewal{id:string;created_at:string;periodo_dias:number;vigencia_anterior_at:string;vigencia_nueva_at:string;observaciones:string|null;responsable:string}
