import { friendlyDatabaseError } from './errorMessage'
import { supabase } from './supabase'
import type { LicenseRenewal,LicenseStatus } from '../types/stage10'
function client(){if(!supabase)throw new Error('Supabase no está configurado.');return supabase}
export async function getLicenseStatus(){const{data,error}=await client().rpc('estado_licencia');if(error)throw new Error(friendlyDatabaseError(error));return data as LicenseStatus}
export async function getLicenseHistory(){const{data,error}=await client().rpc('historial_licencia');if(error)throw new Error(friendlyDatabaseError(error));return(data??[]) as LicenseRenewal[]}
export async function renewLicense(notes:string){const{data,error}=await client().rpc('renovar_licencia_30_dias',{p_observaciones:notes.trim()||undefined});if(error)throw new Error(friendlyDatabaseError(error));return data}
