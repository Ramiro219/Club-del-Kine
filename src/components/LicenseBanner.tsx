import{AlertTriangle,Clock3}from'lucide-react'
import{Link}from'react-router-dom'
import{useLicense}from'../contexts/LicenseContext'
export function LicenseBanner(){const{license}=useLicense();if(!license||license.estado==='vigente')return null;const urgency=license.estado==='vencida'?'vencida':license.dias_restantes<=1?'critica':license.dias_restantes<=3?'urgente':'preventiva';return<div className={`license-banner ${urgency}`}><span>{license.estado==='vencida'?<AlertTriangle size={17}/>:<Clock3 size={17}/>}<strong>{license.estado==='vencida'?'Licencia vencida':`Licencia próxima a vencer: ${license.dias_restantes} día${license.dias_restantes===1?'':'s'}`}</strong></span><Link to="/licencia">Ver estado</Link></div>}
