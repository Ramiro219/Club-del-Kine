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
