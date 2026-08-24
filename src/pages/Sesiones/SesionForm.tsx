import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { createSesion, listActiveTreatments, updateSesion } from '../../services/sesiones.service'
import { getStage4Catalogs } from '../../services/tratamientos.service'
import type { SesionFormData, SesionView, Stage4Catalogs } from '../../types/stage4'
import { toLocalDateTimeInput } from '../../utils/date'

type TreatmentOption = { id: string; paciente_id: string; diagnostico: string | null; tipo: { nombre: string } | null }

function initial(patientId = '', treatmentId = ''): SesionFormData { return { paciente_id: patientId, tratamiento_id: treatmentId, turno_id: null, box_id: null, fecha_atencion: new Date().toISOString(), estado: 'realizada', notas: null } }

export function SesionForm({ sesion, pacienteId, tratamientoId, onSuccess, onCancel }: { sesion?: SesionView | null; pacienteId?: string; tratamientoId?: string; onSuccess: () => void; onCancel: () => void }) {
  const [values, setValues] = useState<SesionFormData>(initial(pacienteId, tratamientoId))
  const [catalogs, setCatalogs] = useState<Stage4Catalogs | null>(null)
  const [treatments, setTreatments] = useState<TreatmentOption[]>([])
  const [saving, setSaving] = useState(false)
  useEffect(() => { void getStage4Catalogs().then(setCatalogs).catch((error) => toast.error(error.message)) }, [])
  useEffect(() => { void listActiveTreatments(values.paciente_id || pacienteId).then((data) => setTreatments(data as unknown as TreatmentOption[])).catch((error) => toast.error(error.message)) }, [values.paciente_id, pacienteId])
  useEffect(() => { setValues(sesion ? { paciente_id: sesion.paciente_id, tratamiento_id: sesion.tratamiento_id, turno_id: sesion.turno_id, box_id: sesion.box_id, fecha_atencion: sesion.fecha_atencion, estado: sesion.estado, notas: sesion.notas } : initial(pacienteId, tratamientoId)) }, [sesion, pacienteId, tratamientoId])
  const set = (key: keyof SesionFormData, value: string | null) => setValues((current) => ({ ...current, [key]: value === '' ? null : value }))
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.paciente_id || !values.tratamiento_id) return toast.error('Paciente y tratamiento son obligatorios.')
    setSaving(true)
    try { const payload = { ...values, fecha_atencion: new Date(values.fecha_atencion).toISOString() }; if (sesion) await updateSesion(sesion.id, payload); else await createSesion(payload); toast.success(sesion ? 'Sesión actualizada.' : values.estado === 'realizada' ? 'Llegada registrada.' : 'Sesión registrada.'); onSuccess() } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo guardar.') } finally { setSaving(false) }
  }
  return <form className="entity-form" onSubmit={submit}><div className="form-section"><h3>Contexto de atención</h3><div className="form-grid"><label className="full"><span>Paciente *</span><select value={values.paciente_id} disabled={Boolean(pacienteId || sesion)} onChange={(e) => { setValues((current) => ({ ...current, paciente_id:e.target.value, tratamiento_id:'' })) }} required><option value="">Seleccionar paciente</option>{catalogs?.pacientes.map((item) => <option key={item.id} value={item.id}>{item.apellidos}, {item.nombres} · DNI {item.dni}</option>)}</select></label><label className="full"><span>Tratamiento *</span><select value={values.tratamiento_id} disabled={Boolean(tratamientoId || sesion)} onChange={(e) => set('tratamiento_id', e.target.value)} required><option value="">Seleccionar tratamiento activo</option>{treatments.map((item) => <option key={item.id} value={item.id}>{item.tipo?.nombre ?? 'Tratamiento'}{item.diagnostico ? ` · ${item.diagnostico}` : ''}</option>)}</select></label><label><span>Fecha y hora *</span><input type="datetime-local" value={toLocalDateTimeInput(values.fecha_atencion)} onChange={(e) => set('fecha_atencion', e.target.value)} required /></label><label><span>Box utilizado</span><select value={values.box_id ?? ''} onChange={(e) => set('box_id', e.target.value)}><option value="">Sin especificar</option>{catalogs?.boxes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label></div></div><div className="form-section"><h3>Resultado</h3><div className="form-grid"><label><span>Estado *</span><select value={values.estado} onChange={(e) => set('estado', e.target.value)} required><option value="realizada">Asistió</option><option value="ausente_avisado">Ausente avisado</option><option value="ausente_consumida">Ausente sin aviso</option><option value="cancelada">Cancelada</option><option value="reprogramada">Reprogramada</option><option value="programada">Programada</option></select><small>El consumo se calcula automáticamente según la obra social y sus reglas.</small></label><label className="full"><span>Observaciones</span><textarea value={values.notas ?? ''} onChange={(e) => set('notas', e.target.value)} placeholder="Evolución, ejercicios realizados o notas de recepción…" /></label></div></div><footer className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? 'Guardando…' : sesion ? 'Guardar cambios' : values.estado === 'realizada' ? 'Registrar llegada' : 'Registrar sesión'}</button></footer></form>
}
