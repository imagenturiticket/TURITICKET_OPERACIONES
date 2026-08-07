export const OFICINA_PERSONAS = ['ZEUS', 'LIC.JUAN', 'AMA', 'OSMAR', 'GABY', 'MICHELL', 'MARI']
export const OPCIONES_REPORTA = ['ZEUS', 'LIC.JUAN', 'AMA', 'OPERADOR']

export const CATEGORIAS_PERSONAL = [
  { value: 'llegada_tarde',        label: 'Llegada tarde' },
  { value: 'cambio_horario',       label: 'Cambio de horario/turno' },
  { value: 'falta',                label: 'Falta / Inasistencia' },
  { value: 'salida_anticipada',    label: 'Salida anticipada' },
  { value: 'prestamo',             label: 'Préstamo' },
  { value: 'acta_administrativa',  label: 'Acta administrativa' },
  { value: 'reconocimiento',       label: 'Reconocimiento' },
  { value: 'otro',                 label: 'Otro' },
]

export const CATEGORIA_LABEL: any = Object.fromEntries(CATEGORIAS_PERSONAL.map(c => [c.value, c.label]))

export const CATEGORIA_COLOR: any = {
  llegada_tarde:       'bg-orange-900 text-orange-200',
  cambio_horario:      'bg-blue-900 text-blue-200',
  falta:               'bg-red-900 text-red-200',
  salida_anticipada:   'bg-amber-900 text-amber-200',
  prestamo:            'bg-emerald-900 text-emerald-200',
  acta_administrativa: 'bg-rose-900 text-rose-200',
  reconocimiento:      'bg-indigo-900 text-indigo-200',
  otro:                'bg-gray-700 text-gray-300',
}

const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

export function formatFecha(fecha: string) {
  if (!fecha) return '—'
  const [y, m, d] = fecha.split('-').map(Number)
  return `${d} de ${MESES_ES[m - 1]} de ${y}`
}

export function formatFechaHora(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export async function calcularHash(payload: string) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

