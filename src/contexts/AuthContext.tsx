import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../services/supabase'
import type { AppUser } from '../types/auth'

interface AuthContextValue {
  user: AppUser | null
  loading: boolean
  demoMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  enterDemo: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const demoUser: AppUser = { id: 'demo', email: 'recepcion@demo.local', name: 'Marina López', role: 'recepcion' }

const mapSession = (session: Session): AppUser => ({
  id: session.user.id,
  email: session.user.email ?? '',
  name: String(session.user.user_metadata.full_name ?? session.user.email?.split('@')[0] ?? 'Usuario'),
  role: session.user.user_metadata.role === 'desarrollador' ? 'desarrollador' : session.user.user_metadata.role === 'administrador' ? 'administrador' : 'recepcion',
})

async function mapSessionWithProfile(session: Session): Promise<AppUser> {
  const fallback = mapSession(session)
  if (!supabase) return fallback
  const { data } = await supabase.from('profiles').select('nombre_completo,rol').eq('id', session.user.id).maybeSingle()
  return data ? { ...fallback, name: data.nombre_completo || fallback.name, role: data.rol === 'desarrollador' ? 'desarrollador' : data.rol === 'administrador' ? 'administrador' : 'recepcion' } : fallback
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(() => sessionStorage.getItem('cdk-demo') === 'true')

  useEffect(() => {
    if (demoMode) {
      setUser(demoUser)
      setLoading(false)
      return
    }
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session ? await mapSessionWithProfile(data.session) : null)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (session) void mapSessionWithProfile(session).then(setUser); else setUser(null) })
    return () => data.subscription.unsubscribe()
  }, [demoMode])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    demoMode,
    signIn: async (email, password) => {
      if (!supabase) throw new Error('Configurá las variables de Supabase o ingresá al modo demostración.')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error('El email o la contraseña no son correctos.')
    },
    enterDemo: () => {
      sessionStorage.setItem('cdk-demo', 'true')
      setDemoMode(true)
    },
    signOut: async () => {
      sessionStorage.removeItem('cdk-demo')
      setDemoMode(false)
      setUser(null)
      if (isSupabaseConfigured && supabase) await supabase.auth.signOut()
    },
  }), [user, loading, demoMode])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  return value
}
