export interface ReportFilters {
  from: string
  to: string
  insurerId: string
  boxId: string
  treatmentTypeId: string
}

export interface ReportPatientRow {
  id: string
  patient: string
  dni: string
  insurer: string
  treatment: string
  performed: number
  absences: number
  cancellations: number
  documentsComplete: number
  documentsPending: number
}

export interface ReportGroupRow {
  id: string
  name: string
  patients: number
  performed: number
  absences: number
  cancellations: number
  amount: number
}

export interface FinancialReportRow {
  id: string
  date: string
  patient: string
  concept: string
  method: string
  type: 'pago' | 'devolucion'
  amount: number
}

export interface ReportSummary {
  patients: number
  performed: number
  absences: number
  cancellations: number
  income: number
  refunds: number
  net: number
  documentsComplete: number
  documentsPending: number
}

export interface ReportResult {
  summary: ReportSummary
  patientRows: ReportPatientRow[]
  insurerRows: ReportGroupRow[]
  boxRows: ReportGroupRow[]
  financialRows: FinancialReportRow[]
}

export interface ReportCatalogs {
  insurers: Array<{ id: string; nombre: string }>
  boxes: Array<{ id: string; nombre: string }>
  treatmentTypes: Array<{ id: string; nombre: string }>
}
