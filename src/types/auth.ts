export type AppRole = 'administrador' | 'recepcion'

export interface AppUser {
  id: string
  email: string
  name: string
  role: AppRole
}
