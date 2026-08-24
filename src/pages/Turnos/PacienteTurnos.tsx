import { CalendarDays } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { getCalendarData } from '../../services/turnos.service'
import type { TurnoView } from '../../types/stage5'
import { formatDateTime } from '../../utils/date'

export function PacienteTurnos({ pacienteId }: { pacienteId: string }) {
  const [turns, setTurns] = useState<TurnoView[]>([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const from = new Date()
      from.setFullYear(from.getFullYear() - 1)
      const to = new Date()
      to.setFullYear(to.getFullYear() + 2)
      setTurns((await getCalendarData(from.toISOString(), to.toISOString(), pacienteId)).turnos)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los turnos.')
    } finally { setLoading(false) }
  }, [pacienteId])
  useEffect(() => { void load() }, [load])
  if (loading) return <div className="table-loading">Cargando turnos…</div>
  if (!turns.length) return <section className="panel"><EmptyState icon={CalendarDays} title="Sin turnos registrados" description="Los turnos reservados aparecerán aquí." /></section>
  return <section className="panel entity-panel"><div className="entity-toolbar"><span className="toolbar-note">Historial y próximos turnos</span><span className="toolbar-note">{turns.length} turnos</span></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>Fecha y hora</th><th>Tratamiento</th><th>Box</th><th>Estado</th></tr></thead><tbody>{turns.map((turn) => <tr key={turn.id}><td><strong>{formatDateTime(turn.inicio_at)}</strong></td><td>{turn.tratamiento?.tipo_nombre ?? 'Tratamiento'}</td><td>{turn.box?.nombre ?? '—'}</td><td><Badge tone={turn.estado === 'atendido' ? 'green' : turn.estado === 'cancelado' ? 'red' : 'blue'}>{turn.estado}</Badge></td></tr>)}</tbody></table></div></section>
}
