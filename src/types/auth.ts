export type AppRole = 'administrador' | 'recepcion' | 'desarrollador'

export interface AppUser {
  id: string
  email: string
  name: string
  role: AppRole
}
