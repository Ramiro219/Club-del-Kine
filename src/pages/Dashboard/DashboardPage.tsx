import { CalendarCheck2, CalendarPlus, ChevronRight, CircleAlert, Clock3, DollarSign, FileWarning, Search, UserPlus, Users, WalletCards } from 'lucide-react'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { StatCard } from '../../components/ui/StatCard'

const appointments = [
  { time: '08:30', patient: 'Sofía Martínez', initials: 'SM', treatment: 'Rehabilitación de rodilla', box: 'Box 1', status: 'En sala', tone: 'blue' },
  { time: '09:00', patient: 'Carlos Benítez', initials: 'CB', treatment: 'Kinesiología respiratoria', box: 'Box 3', status: 'Confirmado', tone: 'green' },
  { time: '09:30', patient: 'Lucía Fernández', initials: 'LF', treatment: 'RPG', box: 'Box 2', status: 'Confirmado', tone: 'green' },
  { time: '10:00', patient: 'Miguel Romero', initials: 'MR', treatment: 'Fisioterapia lumbar', box: 'Box 1', status: 'Pendiente', tone: 'amber' },
]

const alerts = [
  { icon: CircleAlert, text: '4 pacientes tienen pocas sesiones', detail: '1 o 2 sesiones restantes', tone: 'amber' },
  { icon: FileWarning, text: '7 documentos pendientes', detail: 'Requieren revisión esta semana', tone: 'blue' },
  { icon: WalletCards, text: '3 pagos pendientes', detail: 'Total estimado: $42.500', tone: 'red' },
]

export function DashboardPage() {
  const date = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow">RESUMEN DIARIO</span><h1>Buen día, Marina</h1><p>Esto es lo que está pasando hoy, {date}.</p></div>
        <button className="primary-button compact"><CalendarPlus size={18} /> Nuevo turno</button>
      </div>
      <section className="stats-grid" aria-label="Indicadores del día">
        <StatCard label="Turnos de hoy" value="24" helper="8 pendientes" icon={CalendarCheck2} tone="teal" />
        <StatCard label="Pacientes atendidos" value="11" helper="46% del día" icon={Users} tone="blue" />
        <StatCard label="Disponibilidad" value="7" helper="3 mañana · 4 tarde" icon={Clock3} tone="amber" />
        <StatCard label="Caja del día" value="$186.500" helper="12 movimientos" icon={DollarSign} tone="rose" />
      </section>
      <section className="occupancy-card">
        <div><span className="eyebrow">OCUPACIÓN DE HOY</span><h2>Capacidad por turno</h2></div>
        <div className="occupancy-item"><span><strong>Mañana</strong><small>18 de 21 lugares</small></span><div className="progress"><i style={{ width: '86%' }} /></div><b>86%</b></div>
        <div className="occupancy-item afternoon"><span><strong>Tarde</strong><small>14 de 21 lugares</small></span><div className="progress"><i style={{ width: '67%' }} /></div><b>67%</b></div>
      </section>
      <div className="dashboard-grid">
        <section className="panel appointments-panel">
          <div className="panel-title"><div><span className="eyebrow">AGENDA</span><h2>Próximos turnos</h2></div><button>Ver agenda <ChevronRight size={16} /></button></div>
          <div className="appointment-table">
            <div className="table-head"><span>Hora</span><span>Paciente</span><span>Tratamiento</span><span>Box</span><span>Estado</span></div>
            {appointments.map((item) => <div className="appointment-row" key={`${item.time}-${item.patient}`}><strong>{item.time}</strong><span className="patient-cell"><i>{item.initials}</i><b>{item.patient}</b></span><span>{item.treatment}</span><span>{item.box}</span><Badge tone={item.tone as BadgeTone}>{item.status}</Badge></div>)}
          </div>
        </section>
        <aside className="right-column">
          <section className="panel quick-panel"><div className="panel-title"><div><span className="eyebrow">ACCESOS RÁPIDOS</span><h2>¿Qué necesitás hacer?</h2></div></div><div className="quick-grid"><button><UserPlus /><span><strong>Nuevo paciente</strong><small>Registrar ficha</small></span></button><button><CalendarPlus /><span><strong>Nuevo turno</strong><small>Agendar cita</small></span></button><button><WalletCards /><span><strong>Registrar pago</strong><small>Nuevo ingreso</small></span></button><button><Search /><span><strong>Buscar paciente</strong><small>Ver historial</small></span></button></div></section>
          <section className="panel alerts-panel"><div className="panel-title"><div><span className="eyebrow">ATENCIÓN</span><h2>Alertas importantes</h2></div><Badge tone="red">14</Badge></div>{alerts.map(({ icon: Icon, text, detail, tone }) => <button className="alert-row" key={text}><span className={`alert-icon ${tone}`}><Icon size={18} /></span><span><strong>{text}</strong><small>{detail}</small></span><ChevronRight size={16} /></button>)}</section>
        </aside>
      </div>
    </>
  )
}
