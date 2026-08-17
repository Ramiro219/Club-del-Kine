import { Activity, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured, supabase } from '../../services/supabase'

export function LoginPage() {
  const { user, signIn, enterDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await signIn(email, password)
      toast.success('Sesión iniciada correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar sesión.')
    } finally { setSubmitting(false) }
  }

  async function resetPassword() {
    if (!email) return toast.info('Ingresá tu email para recuperar la contraseña.')
    if (!supabase) return toast.info('La recuperación estará disponible al conectar Supabase.')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` })
    if (error) toast.error('No se pudo enviar el correo de recuperación.')
    else toast.success('Te enviamos las instrucciones por email.')
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand"><span className="brand-mark"><Activity size={27} /></span><span><strong>Club del Kine</strong><small>Gestión integral</small></span></div>
        <div className="login-message">
          <span className="eyebrow">EL CENTRO, EN ORDEN</span>
          <h1>Más tiempo para cuidar.<br />Menos tiempo administrando.</h1>
          <p>Pacientes, turnos y caja en un solo lugar, diseñado para el ritmo real de recepción.</p>
          <ul>
            <li><CheckCircle2 size={19} /> Información clínica organizada y segura</li>
            <li><CheckCircle2 size={19} /> Disponibilidad de boxes de un vistazo</li>
            <li><CheckCircle2 size={19} /> Seguimiento simple de sesiones y pagos</li>
          </ul>
        </div>
        <small className="login-legal">Sistema privado · Acceso exclusivo para personal autorizado</small>
      </section>
      <section className="login-form-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="mobile-login-brand"><span className="brand-mark"><Activity /></span><strong>Club del Kine</strong></div>
          <span className="eyebrow">BIENVENIDA</span>
          <h2>Ingresá a tu cuenta</h2>
          <p>Usá tus credenciales para acceder al sistema.</p>
          <label><span>Email</span><div className="input-with-icon"><Mail size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@centro.com" required autoComplete="email" /></div></label>
          <label><span>Contraseña</span><div className="input-with-icon"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          <button className="forgot" type="button" onClick={() => void resetPassword()}>¿Olvidaste tu contraseña?</button>
          <button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Ingresando…' : <>Ingresar <ArrowRight size={18} /></>}</button>
          <div className="divider"><span>o</span></div>
          <button className="demo-button" type="button" onClick={enterDemo}>Explorar versión de demostración</button>
          <small className="config-status">{isSupabaseConfigured ? 'Conexión Supabase configurada' : 'Supabase pendiente de configurar · La demo funciona sin conexión'}</small>
        </form>
      </section>
    </main>
  )
}
