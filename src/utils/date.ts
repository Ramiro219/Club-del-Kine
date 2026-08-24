export function calculateAge(date: string | null) {
  if (!date) return null
  const birth = new Date(`${date}T12:00:00`)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

export function formatDate(date: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(`${date}T12:00:00`))
}

export function formatDateTime(date: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(date))
}

export function toLocalDateTimeInput(date?: string | null) {
  const value = date ? new Date(date) : new Date()
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}
