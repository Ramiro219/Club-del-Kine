import { friendlyDatabaseError } from './errorMessage'
import { supabase } from './supabase'
import type { FinancialReportRow, ReportCatalogs, ReportFilters, ReportGroupRow, ReportPatientRow, ReportResult } from '../types/stage8'

function client() { if (!supabase) throw new Error('Supabase no está configurado.'); return supabase }
function dayBounds(from: string, to: string) {
  const start = new Date(`${from}T00:00:00-03:00`)
  const end = new Date(`${to}T00:00:00-03:00`); end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function reportCatalogs(): Promise<ReportCatalogs> {
  const [insurers, boxes, treatmentTypes] = await Promise.all([
    client().from('obras_sociales').select('id,nombre').eq('activo', true).order('nombre'),
    client().from('boxes').select('id,nombre').eq('activo', true).order('nombre'),
    client().from('tipos_tratamiento').select('id,nombre').eq('activo', true).order('nombre'),
  ])
  const error = insurers.error ?? boxes.error ?? treatmentTypes.error
  if (error) throw new Error(friendlyDatabaseError(error))
  return { insurers: insurers.data ?? [], boxes: boxes.data ?? [], treatmentTypes: treatmentTypes.data ?? [] }
}

export async function getReport(filters: ReportFilters): Promise<ReportResult> {
  const { start, end } = dayBounds(filters.from, filters.to)
  const [treatmentsResult, sessionsResult, paymentsResult, refundsResult, documentsResult, patientsResult, catalogs] = await Promise.all([
    client().from('tratamientos').select('id,paciente_id,obra_social_id,tipo_tratamiento_id'),
    client().from('sesiones').select('id,paciente_id,tratamiento_id,box_id,fecha_atencion,estado').gte('fecha_atencion', start).lt('fecha_atencion', end).limit(10000),
    client().from('pagos').select('id,paciente_id,tratamiento_id,metodo_pago_id,fecha_pago,importe,concepto,estado').gte('fecha_pago', start).lt('fecha_pago', end).limit(10000),
    client().from('devoluciones').select('id,pago_id,metodo_pago_id,fecha_devolucion,importe,motivo,estado').gte('fecha_devolucion', start).lt('fecha_devolucion', end).limit(10000),
    client().from('documentos').select('id,paciente_id,tratamiento_id,obra_social_id,estado').limit(10000),
    client().from('pacientes').select('id,nombres,apellidos,dni,obra_social_id').limit(5000),
    reportCatalogs(),
  ])
  const error = treatmentsResult.error ?? sessionsResult.error ?? paymentsResult.error ?? refundsResult.error ?? documentsResult.error ?? patientsResult.error
  if (error) throw new Error(friendlyDatabaseError(error))
  const methodResult = await client().from('metodos_pago').select('id,nombre')
  if (methodResult.error) throw new Error(friendlyDatabaseError(methodResult.error))

  const insurers = new Map(catalogs.insurers.map((item) => [item.id, item.nombre]))
  const boxes = new Map(catalogs.boxes.map((item) => [item.id, item.nombre]))
  const treatmentTypes = new Map(catalogs.treatmentTypes.map((item) => [item.id, item.nombre]))
  const methods = new Map((methodResult.data ?? []).map((item) => [item.id, item.nombre]))
  const patients = new Map((patientsResult.data ?? []).map((item) => [item.id, item]))
  const allTreatments = treatmentsResult.data ?? []
  const acceptedTreatments = allTreatments.filter((item) => (!filters.insurerId || item.obra_social_id === filters.insurerId) && (!filters.treatmentTypeId || item.tipo_tratamiento_id === filters.treatmentTypeId))
  const acceptedIds = new Set(acceptedTreatments.map((item) => item.id))
  const treatmentMap = new Map(allTreatments.map((item) => [item.id, item]))
  const sessions = (sessionsResult.data ?? []).filter((item) => acceptedIds.has(item.tratamiento_id) && (!filters.boxId || item.box_id === filters.boxId))
  const relevantPatientIds = new Set(sessions.map((item) => item.paciente_id))

  const patientRows: ReportPatientRow[] = [...relevantPatientIds].map((patientId) => {
    const patient = patients.get(patientId)
    const patientSessions = sessions.filter((item) => item.paciente_id === patientId)
    const patientTreatments = acceptedTreatments.filter((item) => item.paciente_id === patientId)
    const documents = (documentsResult.data ?? []).filter((item) => item.paciente_id === patientId && (!filters.insurerId || item.obra_social_id === filters.insurerId))
    const insurerId = patientTreatments.find((item) => item.obra_social_id)?.obra_social_id ?? patient?.obra_social_id
    return {
      id: patientId,
      patient: patient ? `${patient.apellidos}, ${patient.nombres}` : 'Paciente',
      dni: patient?.dni ?? '—',
      insurer: insurerId ? insurers.get(insurerId) ?? 'Obra social' : 'Particular',
      treatment: [...new Set(patientTreatments.map((item) => treatmentTypes.get(item.tipo_tratamiento_id) ?? 'Tratamiento'))].join(', ') || '—',
      performed: patientSessions.filter((item) => item.estado === 'realizada').length,
      absences: patientSessions.filter((item) => item.estado.startsWith('ausente')).length,
      cancellations: patientSessions.filter((item) => ['cancelada', 'anulada'].includes(item.estado)).length,
      documentsComplete: documents.filter((item) => item.estado === 'vigente').length,
      documentsPending: documents.filter((item) => ['pendiente', 'observado', 'vencido'].includes(item.estado)).length,
    }
  }).sort((a, b) => a.patient.localeCompare(b.patient, 'es'))

  const confirmedPayments = (paymentsResult.data ?? []).filter((item) => item.estado === 'confirmado' && (!(filters.insurerId || filters.treatmentTypeId) || (item.tratamiento_id ? acceptedIds.has(item.tratamiento_id) : acceptedTreatments.some((treatment) => treatment.paciente_id === item.paciente_id))))
  const paymentIds = new Set(confirmedPayments.map((item) => item.id))
  const confirmedRefunds = (refundsResult.data ?? []).filter((item) => item.estado === 'confirmada' && paymentIds.has(item.pago_id))
  const financialRows: FinancialReportRow[] = [
    ...confirmedPayments.map((item) => ({ id: item.id, date: item.fecha_pago, patient: patients.has(item.paciente_id) ? `${patients.get(item.paciente_id)!.apellidos}, ${patients.get(item.paciente_id)!.nombres}` : 'Paciente', concept: item.concepto, method: methods.get(item.metodo_pago_id) ?? 'Otro', type: 'pago' as const, amount: Number(item.importe) })),
    ...confirmedRefunds.map((item) => { const payment = confirmedPayments.find((payment) => payment.id === item.pago_id); return { id: item.id, date: item.fecha_devolucion, patient: payment && patients.has(payment.paciente_id) ? `${patients.get(payment.paciente_id)!.apellidos}, ${patients.get(payment.paciente_id)!.nombres}` : 'Paciente', concept: item.motivo, method: methods.get(item.metodo_pago_id) ?? 'Otro', type: 'devolucion' as const, amount: Number(item.importe) } }),
  ].sort((a, b) => b.date.localeCompare(a.date))

  function groups(kind: 'insurer' | 'box'): ReportGroupRow[] {
    const source = kind === 'insurer' ? insurers : boxes
    const ids = kind === 'insurer' ? [...new Set(acceptedTreatments.map((item) => item.obra_social_id).filter((id): id is string => Boolean(id)))] : [...new Set(sessions.map((item) => item.box_id).filter((id): id is string => Boolean(id)))]
    return ids.map((id) => {
      const groupSessions = sessions.filter((session) => kind === 'box' ? session.box_id === id : treatmentMap.get(session.tratamiento_id)?.obra_social_id === id)
      const groupPatients = new Set(groupSessions.map((item) => item.paciente_id))
      const amount = kind === 'insurer' ? confirmedPayments.filter((payment) => payment.tratamiento_id ? treatmentMap.get(payment.tratamiento_id)?.obra_social_id === id : acceptedTreatments.some((treatment) => treatment.obra_social_id === id && treatment.paciente_id === payment.paciente_id)).reduce((sum, item) => sum + Number(item.importe), 0) : 0
      return { id, name: source.get(id) ?? (kind === 'box' ? 'Box' : 'Obra social'), patients: groupPatients.size, performed: groupSessions.filter((item) => item.estado === 'realizada').length, absences: groupSessions.filter((item) => item.estado.startsWith('ausente')).length, cancellations: groupSessions.filter((item) => ['cancelada', 'anulada'].includes(item.estado)).length, amount }
    }).sort((a, b) => b.performed - a.performed)
  }

  const income = confirmedPayments.reduce((sum, item) => sum + Number(item.importe), 0)
  const refunds = confirmedRefunds.reduce((sum, item) => sum + Number(item.importe), 0)
  return { summary: { patients: new Set(sessions.map((item) => item.paciente_id)).size, performed: sessions.filter((item) => item.estado === 'realizada').length, absences: sessions.filter((item) => item.estado.startsWith('ausente')).length, cancellations: sessions.filter((item) => ['cancelada', 'anulada'].includes(item.estado)).length, income, refunds, net: income - refunds, documentsComplete: patientRows.reduce((sum, item) => sum + item.documentsComplete, 0), documentsPending: patientRows.reduce((sum, item) => sum + item.documentsPending, 0) }, patientRows, insurerRows: groups('insurer'), boxRows: groups('box'), financialRows }
}
