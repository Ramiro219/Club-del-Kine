import { createClient } from '@supabase/supabase-js'
import type { Stage3Database } from '../types/stage3'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient<Stage3Database>(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
