import type { Stage4Database } from './stage4'

export type Stage6Database=Omit<Stage4Database,'public'>&{public:Omit<Stage4Database['public'],'Functions'>&{Functions:Stage4Database['public']['Functions']&{
 registrar_pago_atomico:{Args:{p_paciente_id:string;p_tratamiento_id:string|null;p_metodo_pago_id:string;p_fecha_pago:string;p_importe:number;p_referencia:string|null;p_concepto:string;p_estado:string;p_sesion_ids:string[]};Returns:string}
 registrar_devolucion_atomica:{Args:{p_pago_id:string;p_importe:number;p_motivo:string;p_referencia?:string|null};Returns:string}
 cerrar_caja_diaria:{Args:{p_fecha:string;p_observaciones?:string|null};Returns:string}
}}}

export type PagoRow=Stage6Database['public']['Tables']['pagos']['Row']
export type DevolucionRow=Stage6Database['public']['Tables']['devoluciones']['Row']
export type MetodoPagoRow=Stage6Database['public']['Tables']['metodos_pago']['Row']
export interface PagoView extends PagoRow{paciente:{nombres:string;apellidos:string;dni:string}|null;tratamiento_nombre:string|null;metodo:MetodoPagoRow|null;aplicaciones:Array<{sesion_id:string|null;importe_aplicado:number;estado:string}>;devoluciones:DevolucionRow[]}
export interface CashMovement{id:string;date:string;patient:string;concept:string;amount:number;method:string;type:'ingreso'|'devolucion';status:string;payment?:PagoView}
export interface CashSummary{income:number;refunds:number;net:number;byMethod:Record<string,number>;payments:number;refundCount:number;closed:boolean}
export interface PaymentFormData{paciente_id:string;tratamiento_id:string|null;metodo_pago_id:string;fecha_pago:string;importe:number;referencia:string|null;concepto:string;estado:'pendiente'|'confirmado';sesion_ids:string[]}
