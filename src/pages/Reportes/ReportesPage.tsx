import { BarChart3, Building2, CalendarRange, Download, FileDown, RefreshCcw, UsersRound, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/Badge'
import { getReport, reportCatalogs } from '../../services/reportes.service'
import type { ReportCatalogs, ReportFilters, ReportResult } from '../../types/stage8'
import { formatDateTime } from '../../utils/date'
import { downloadCsv, printReport } from '../../utils/reportExport'

type Kind = 'cierre' | 'pacientes' | 'sesiones' | 'ausencias' | 'cancelaciones' | 'pagos' | 'devoluciones' | 'recaudacion' | 'boxes' | 'ocupacion' | 'obras'
const money = (value: number) => value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
const localDate = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const initialFilters = (): ReportFilters => { const now = new Date(); return { from: localDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: localDate(now), insurerId: '', boxId: '', treatmentTypeId: '' } }
const EMPTY: ReportResult = { summary: { patients: 0, performed: 0, absences: 0, cancellations: 0, income: 0, refunds: 0, net: 0, documentsComplete: 0, documentsPending: 0 }, patientRows: [], insurerRows: [], boxRows: [], financialRows: [] }

export function ReportesPage() {
  const [kind, setKind] = useState<Kind>('cierre')
  const [filters, setFilters] = useState(initialFilters)
  const [catalogs, setCatalogs] = useState<ReportCatalogs>({ insurers: [], boxes: [], treatmentTypes: [] })
  const [report, setReport] = useState<ReportResult>(EMPTY)
  const [loading, setLoading] = useState(false)
  useEffect(() => { reportCatalogs().then(setCatalogs).catch((error) => toast.error(error.message)) }, [])
  async function load() { if (filters.from > filters.to) return toast.error('La fecha desde no puede ser posterior a la fecha hasta.'); if (kind === 'cierre' && !filters.insurerId) return toast.error('Seleccioná una obra social para generar el cierre.'); setLoading(true); try { setReport(await getReport(filters)) } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo generar el reporte.') } finally { setLoading(false) } }
  const table = useMemo(() => {
    if (['pagos', 'devoluciones', 'recaudacion'].includes(kind)) {
      const rows = report.financialRows.filter((item) => kind === 'recaudacion' || item.type === (kind === 'pagos' ? 'pago' : 'devolucion'))
      return { headers: ['Fecha', 'Paciente', 'Concepto', 'Método', 'Tipo', 'Importe'], rows: rows.map((item) => [formatDateTime(item.date), item.patient, item.concept, item.method, item.type, money(item.amount)]) }
    }
    if (['boxes', 'ocupacion'].includes(kind)) return { headers: ['Box', 'Pacientes', 'Realizadas', 'Ausencias', 'Cancelaciones'], rows: report.boxRows.map((item) => [item.name, item.patients, item.performed, item.absences, item.cancellations]) }
    if (kind === 'obras') return { headers: ['Obra social', 'Pacientes', 'Realizadas', 'Ausencias', 'Cancelaciones', 'Ingresos'], rows: report.insurerRows.map((item) => [item.name, item.patients, item.performed, item.absences, item.cancellations, money(item.amount)]) }
    const rows = report.patientRows.filter((item) => kind === 'pacientes' || kind === 'cierre' || (kind === 'sesiones' && item.performed > 0) || (kind === 'ausencias' && item.absences > 0) || (kind === 'cancelaciones' && item.cancellations > 0))
    return { headers: ['Paciente', 'DNI', 'Obra social', 'Tratamiento', 'Realizadas', 'Ausencias', 'Canceladas', 'Documentación'], rows: rows.map((item) => [item.patient, item.dni, item.insurer, item.treatment, item.performed, item.absences, item.cancellations, item.documentsPending ? `${item.documentsPending} pendiente/s` : 'Completa']) }
  }, [kind, report])
  const title = kind === 'cierre' ? `Cierre · ${catalogs.insurers.find((item) => item.id === filters.insurerId)?.nombre ?? 'Obra social'}` : `Reporte · ${kind}`
  const subtitle = `Período ${filters.from.split('-').reverse().join('/')} al ${filters.to.split('-').reverse().join('/')}`
  const metrics: Array<[string, string | number]> = [['Pacientes', report.summary.patients], ['Sesiones realizadas', report.summary.performed], ['Ausencias', report.summary.absences], ['Total neto', money(report.summary.net)]]
  const maxBox = Math.max(1, ...report.boxRows.map((item) => item.performed + item.absences + item.cancellations))

  function exportCsv() { downloadCsv(`club-del-kine-${kind}-${filters.from}-${filters.to}`, table.headers, table.rows) }
  function exportPdf() { try { printReport(title, subtitle, table.headers, table.rows, metrics) } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo abrir la impresión.') } }

  return <><header className="page-heading module-heading"><div><p>Análisis operativo</p><h1>Reportes</h1><span>Actividad, recaudación y cierres por obra social</span></div><div className="heading-actions"><button className="secondary-button" disabled={!table.rows.length} onClick={exportCsv}><Download size={17} /> CSV</button><button className="primary-button" disabled={!table.rows.length} onClick={exportPdf}><FileDown size={17} /> Exportar PDF</button></div></header>
    <section className="panel report-filters"><label>Reporte<select value={kind} onChange={(event) => setKind(event.target.value as Kind)}><option value="cierre">Cierre por obra social</option><option value="pacientes">Pacientes atendidos</option><option value="sesiones">Sesiones realizadas</option><option value="ausencias">Ausencias</option><option value="cancelaciones">Cancelaciones</option><option value="pagos">Pagos</option><option value="devoluciones">Devoluciones</option><option value="recaudacion">Recaudación</option><option value="boxes">Uso por box</option><option value="ocupacion">Ocupación registrada</option><option value="obras">Sesiones por obra social</option></select></label><label>Desde<input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label><label>Hasta<input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label><label>Obra social<select value={filters.insurerId} onChange={(event) => setFilters({ ...filters, insurerId: event.target.value })}><option value="">Todas</option>{catalogs.insurers.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><label>Box<select value={filters.boxId} onChange={(event) => setFilters({ ...filters, boxId: event.target.value })}><option value="">Todos</option>{catalogs.boxes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><label>Tratamiento<select value={filters.treatmentTypeId} onChange={(event) => setFilters({ ...filters, treatmentTypeId: event.target.value })}><option value="">Todos</option>{catalogs.treatmentTypes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><button className="primary-button" disabled={loading} onClick={() => void load()}><RefreshCcw size={17} />{loading ? 'Generando…' : 'Generar'}</button></section>
    <div className="report-stats"><article><UsersRound /><span>Pacientes<strong>{report.summary.patients}</strong></span></article><article><CalendarRange /><span>Realizadas<strong>{report.summary.performed}</strong></span></article><article><Building2 /><span>Documentos pendientes<strong>{report.summary.documentsPending}</strong></span></article><article className="featured"><WalletCards /><span>Total neto<strong>{money(report.summary.net)}</strong></span></article></div>
    <div className="report-layout"><section className="panel entity-panel"><div className="panel-title report-title"><div><small>RESULTADO</small><h2>{title}</h2><p>{subtitle} · {table.rows.length} filas</p></div>{kind === 'cierre' && <Badge tone={report.summary.documentsPending ? 'amber' : 'green'}>{report.summary.documentsPending ? 'Documentación pendiente' : 'Documentación completa'}</Badge>}</div>{loading ? <div className="table-loading">Generando reporte.</div> : table.rows.length ? <div className="data-table-wrap"><table className="data-table report-table"><thead><tr>{table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{table.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div> : <div className="empty-state"><BarChart3 size={30} /><strong>Sin resultados</strong><p>Seleccioná los filtros y generá el reporte.</p></div>}</section>
      <aside className="panel report-chart"><div className="panel-title"><div><small>ACTIVIDAD</small><h2>Distribución por box</h2></div></div>{report.boxRows.length ? report.boxRows.map((item) => { const total = item.performed + item.absences + item.cancellations; return <div className="report-bar" key={item.id}><span><strong>{item.name}</strong><small>{total} registros</small></span><div><i style={{ width: `${Math.max(4, total / maxBox * 100)}%` }} /></div></div> }) : <p>Sin actividad para graficar.</p>}</aside></div>
  </>
}
