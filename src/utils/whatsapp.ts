export type WhatsAppTemplate='recordatorio'|'documentacion'|'reprogramacion'|'disponible'
export const whatsappTemplates:Record<WhatsAppTemplate,string>={
 recordatorio:'Hola [nombre], te recordamos tu turno en Club del Kine el [fecha] a las [hora].',
 documentacion:'Hola [nombre], te avisamos que tenés documentación pendiente para presentar en Club del Kine.',
 reprogramacion:'Hola [nombre], necesitamos reprogramar tu turno. Por favor comunicate con Club del Kine.',
 disponible:'Hola [nombre], se liberó un turno compatible con tu solicitud. ¿Querés que lo reservemos?',
}
export function whatsappUrl(phone:string,name:string,message:string){const number=phone.replace(/\D/g,'');if(!number)throw new Error('El paciente no tiene un teléfono válido.');return`https://wa.me/${number}?text=${encodeURIComponent(message.replaceAll('[nombre]',name))}`}
