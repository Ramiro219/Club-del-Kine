export function requiredText(value: string, label: string, max = 120) {
  const clean = value.trim()
  if (!clean) throw new Error(`${label} es obligatorio.`)
  if (clean.length > max) throw new Error(`${label} no puede superar ${max} caracteres.`)
  return clean
}

export function optionalEmail(value: string | null | undefined) {
  const clean = value?.trim().toLowerCase() || null
  if (clean && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new Error('Ingresá un email válido.')
  return clean
}

export function integerRange(value: number, label: string, min: number, max: number) {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${label} debe estar entre ${min} y ${max}.`)
  return value
}
