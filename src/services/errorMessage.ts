export function friendlyDatabaseError(error: unknown): string {
  const value = error as { code?: string; message?: string }
  if (value.message?.includes('capacidad máxima')) return 'Ese box ya alcanzó su capacidad máxima en el horario elegido.'
  if (value.message?.includes('está cerrado')) return 'El box está cerrado en el horario elegido.'
  if (value.message?.includes('inactivo')) return 'El box seleccionado está inactivo.'
  if (value.code === '23505') return 'Ya existe un registro con esos datos. Verificá el DNI o el código.'
  if (value.code === '23503') return 'La operación está relacionada con información que no existe o ya no está disponible.'
  if (value.code === '23514') return 'Uno de los valores ingresados no cumple las reglas del sistema.'
  if (value.code === '42501') return 'Tu usuario no tiene permiso para realizar esta operación.'
  return 'No se pudo completar la operación. Revisá los datos e intentá nuevamente.'
}
