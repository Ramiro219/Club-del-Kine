import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { createPaciente, updatePaciente } from '../../services/pacientes.service'
import { listObrasSociales } from '../../services/obrasSociales.service'
import type { ObraSocialRow, PacienteConObraSocial, PacienteFormData } from '../../types/stage3'
import { calculateAge } from '../../utils/date'

const empty: PacienteFormData = { dni: '', nombres: '', apellidos: '', fecha_nacimiento: null, telefono: null, email: null, direccion: null, obra_social_id: null, numero_afiliado: null, patologia_general: null, antecedentes: null, observaciones: null, contacto_emergencia: null, telefono_emergencia: null, estado: 'activo' }

export function PacienteForm({ paciente, onSuccess, onCancel }: { paciente?: PacienteConObraSocial | null; onSuccess: () => void; onCancel: () => void }) {
  const [values, setValues] = useState<PacienteFormData>(empty)
  const [obras, setObras] = useState<ObraSocialRow[]>([])
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    void listObrasSociales(false).then(setObras).catch((e: Error) => toast.error(e.message))
    if (paciente) setValues({ dni: paciente.dni, nombres: paciente.nombres, apellidos: paciente.apellidos, fecha_nacimiento: paciente.fecha_nacimiento, telefono: paciente.telefono, email: paciente.email, direccion: paciente.direccion, obra_social_id: paciente.obra_social_id, numero_afiliado: paciente.numero_afiliado, patologia_general: paciente.patologia_general, antecedentes: paciente.antecedentes, observaciones: paciente.observaciones, contacto_emergencia: paciente.contacto_emergencia, telefono_emergencia: paciente.telefono_emergencia, estado: paciente.estado })
    else setValues(empty)
  }, [paciente])
  const set = (key: keyof PacienteFormData, value: string | null) => setValues((current) => ({ ...current, [key]: value || null }))
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!/^\d{6,10}$/.test(values.dni)) return toast.error('El DNI debe tener entre 6 y 10 números.')
    if (!values.nombres.trim() || !values.apellidos.trim()) return toast.error('Nombre y apellido son obligatorios.')
    setSaving(true)
    try {
      if (paciente) await updatePaciente(paciente.id, values)
      else await createPaciente(values)
      toast.success(paciente ? 'Paciente actualizado.' : 'Paciente registrado.')
      onSuccess()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo guardar.') }
    finally { setSaving(false) }
  }
  const age = calculateAge(values.fecha_nacimiento)
  return <form className="entity-form" onSubmit={submit}>
    <div className="form-section"><h3>Identificación</h3><div className="form-grid three"><label><span>DNI *</span><input inputMode="numeric" maxLength={10} value={values.dni} onChange={(e) => set('dni', e.target.value.replace(/\D/g, ''))} required /></label><label><span>Nombres *</span><input value={values.nombres} onChange={(e) => set('nombres', e.target.value)} required /></label><label><span>Apellidos *</span><input value={values.apellidos} onChange={(e) => set('apellidos', e.target.value)} required /></label><label><span>Fecha de nacimiento</span><input type="date" max={new Date().toISOString().slice(0, 10)} value={values.fecha_nacimiento ?? ''} onChange={(e) => set('fecha_nacimiento', e.target.value)} /></label><label><span>Edad calculada</span><input value={age === null ? '—' : `${age} años`} disabled /></label><label><span>Estado</span><select value={values.estado} onChange={(e) => set('estado', e.target.value)}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></label></div></div>
    <div className="form-section"><h3>Contacto</h3><div className="form-grid"><label><span>Teléfono</span><input value={values.telefono ?? ''} onChange={(e) => set('telefono', e.target.value)} /></label><label><span>Email</span><input type="email" value={values.email ?? ''} onChange={(e) => set('email', e.target.value)} /></label><label className="full"><span>Dirección</span><input value={values.direccion ?? ''} onChange={(e) => set('direccion', e.target.value)} /></label><label><span>Contacto de emergencia</span><input value={values.contacto_emergencia ?? ''} onChange={(e) => set('contacto_emergencia', e.target.value)} /></label><label><span>Teléfono de emergencia</span><input value={values.telefono_emergencia ?? ''} onChange={(e) => set('telefono_emergencia', e.target.value)} /></label></div></div>
    <div className="form-section"><h3>Cobertura</h3><div className="form-grid"><label><span>Obra social</span><select value={values.obra_social_id ?? ''} onChange={(e) => set('obra_social_id', e.target.value)}><option value="">Particular / Sin cobertura</option>{obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}</select></label><label><span>Número de afiliado</span><input value={values.numero_afiliado ?? ''} onChange={(e) => set('numero_afiliado', e.target.value)} /></label></div></div>
    <div className="form-section"><h3>Información clínica inicial</h3><div className="form-grid"><label className="full"><span>Patología general</span><textarea value={values.patologia_general ?? ''} onChange={(e) => set('patologia_general', e.target.value)} /></label><label className="full"><span>Antecedentes</span><textarea value={values.antecedentes ?? ''} onChange={(e) => set('antecedentes', e.target.value)} /></label><label className="full"><span>Observaciones</span><textarea value={values.observaciones ?? ''} onChange={(e) => set('observaciones', e.target.value)} /></label></div></div>
    <footer className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? 'Guardando…' : paciente ? 'Guardar cambios' : 'Registrar paciente'}</button></footer>
  </form>
}
