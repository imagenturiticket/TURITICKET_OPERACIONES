'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TIPO_COLOR: any = {
  tour:     { bg: 'bg-purple-900', text: 'text-purple-200', label: 'Tour' },
  transfer: { bg: 'bg-blue-900',   text: 'text-blue-200',   label: 'Transfer' },
  renta:    { bg: 'bg-amber-900',  text: 'text-amber-200',  label: 'Renta' },
  local:    { bg: 'bg-green-900',  text: 'text-green-200',  label: 'Local' },
  oficina:  { bg: 'bg-gray-700',   text: 'text-gray-300',   label: 'Oficina' },
}

const FIJOS = ['Rafa', 'Chema', 'Hector', 'Hervert', 'Alfonso']

// Días que se capturan desde esta pantalla. Todos se guardan como
// tipo 'local' en asignaciones, cambiando solo el destino.
const OPCIONES_DIA = [
  { valor: 'VACACIONES', label: 'Vacaciones', clase: 'bg-blue-950 text-blue-300 border-blue-800' },
  { valor: 'FALTA',      label: 'Falta',      clase: 'bg-red-950 text-red-300 border-red-800' },
  { valor: 'DESCANSO',   label: 'Descanso',   clase: 'bg-gray-800 text-gray-300 border-gray-600' },
  { valor: 'PIDIO DIA',  label: 'Pidió día',  clase: 'bg-amber-950 text-amber-300 border-amber-800' },
]

function getTipoColor(tipo: string, destino: string, nota: string) {
  const d = (destino || '').toLowerCase()
  const n = (nota || '').toLowerCase()
  if (d.includes('descanso')) return { bg: 'bg-gray-800',  text: 'text-gray-500',  label: 'Descanso' }
  if (d.includes('vacacion')) return { bg: 'bg-blue-950',  text: 'text-blue-400',  label: 'Vacaciones' }
  if (d.includes('falta'))    return { bg: 'bg-red-950',   text: 'text-red-400',   label: 'Falta' }
  if (d.includes('pidio dia') || d.includes('pidió día')) return { bg: 'bg-amber-950', text: 'text-amber-400', label: 'Pidió día' }
  if (d.includes('a. gaby') || d.includes('a. oficina') || d.includes('s. puebla') || n.includes('jornada'))
    return { bg: 'bg-slate-700', text: 'text-slate-300', label: 'Jornada 8H' }
  return TIPO_COLOR[tipo] || { bg: 'bg-gray-700', text: 'text-gray-300', label: tipo }
}

const DIAS_ES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function formatFechaLarga(fecha: string) {
  const [y, m, d] = fecha.split('-').map(Number)
  const date = new Date(y, m-1, d)
  return `${DIAS_ES[date.getDay()]} ${d} de ${MESES_ES[m-1]} de ${y}`
}

function formatFechaCorta(fecha: string) {
  const [, m, d] = fecha.split('-').map(Number)
  return `${d}/${m}`
}

/** Lista todos los días entre dos fechas, ambas incluidas. */
function listarFechas(inicio: string, fin: string): string[] {
  const salida: string[] = []
  const d = new Date(inicio + 'T12:00:00')
  const f = new Date(fin + 'T12:00:00')
  let guarda = 0
  while (d <= f && guarda < 400) {
    salida.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() + 1)
    guarda++
  }
  return salida
}

function Modal({ servicio, operadorNombre, onClose, onAgregar }: any) {
  if (!servicio) return null
  const c = getTipoColor(servicio.tipo, servicio.destino || '', servicio.nota || '')

  let clienteNombre = ''
  let notaLimpia = servicio.nota || ''
  if (servicio.tipo === 'renta' && servicio.nota?.startsWith('Cliente:')) {
    const partes = servicio.nota.split('|')
    clienteNombre = partes[0].replace('Cliente:', '').trim()
    notaLimpia = partes.slice(1).join('|').trim()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">×</button>
        <div className={`inline-block ${c.bg} ${c.text} text-xs font-semibold px-3 py-1 rounded-full mb-4`}>{c.label}</div>
        <h2 className="text-lg font-bold text-white mb-4">{formatFechaLarga(servicio.fecha)}</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Operador</span>
            <span className="text-white font-medium">{operadorNombre}</span>
          </div>
          {servicio.destino && !['DESCANSO','VACACIONES','FALTA'].includes(servicio.destino?.toUpperCase()) && (
            <div className="flex justify-between">
              <span className="text-gray-400">{servicio.tipo === 'tour' ? 'Destino' : servicio.tipo === 'renta' ? 'Servicio' : 'Tipo'}</span>
              <span className="text-white font-medium">
                {servicio.tipo === 'tour' ? `Tour a ${servicio.destino}` :
                 servicio.tipo === 'renta' ? `Renta de ${servicio.destino}` :
                 servicio.destino}
              </span>
            </div>
          )}
          {servicio.unidad_nombre && (
            <div className="flex justify-between">
              <span className="text-gray-400">Unidad</span>
              <span className="text-white font-medium">{servicio.unidad_nombre}</span>
            </div>
          )}
          {servicio.tipo === 'renta' && clienteNombre && (
            <div className="flex justify-between">
              <span className="text-gray-400">Cliente</span>
              <span className="text-white font-medium">{clienteNombre}</span>
            </div>
          )}
          {servicio.tipo === 'tour' && servicio.pax && (
            <div className="flex justify-between">
              <span className="text-gray-400">Pasajeros</span>
              <span className="text-white font-medium">{servicio.pax} pax</span>
            </div>
          )}
          {servicio.hora_inicio && (
            <div className="flex justify-between">
              <span className="text-gray-400">Hora inicio</span>
              <span className="text-white font-medium">{servicio.hora_inicio}</span>
            </div>
          )}
          {servicio.hora_fin && (
            <div className="flex justify-between">
              <span className="text-gray-400">Hora fin</span>
              <span className="text-white font-medium">{servicio.hora_fin}</span>
            </div>
          )}
          {notaLimpia && (
            <div className="flex justify-between">
              <span className="text-gray-400">Notas</span>
              <span className="text-white font-medium text-right max-w-[180px]">{notaLimpia}</span>
            </div>
          )}
        </div>

        {/* Este descanso no está guardado, se muestra solo porque el día
            quedó vacío. Desde aquí se puede registrar algo real. */}
        {servicio.virtual && (
          <div className="mt-5 pt-4 border-t border-gray-800">
            <p className="text-[11px] text-gray-500 mb-2">
              Este descanso no está registrado, se muestra porque el día quedó vacío.
            </p>
            <button
              onClick={() => { onClose(); onAgregar(servicio.operador_id, servicio.fecha) }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg"
            >
              Registrar vacaciones, falta u otro
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ModalAgregar({ operadores, inicial, onClose, onGuardado }: any) {
  const [operadorId, setOperadorId] = useState(inicial?.operadorId || '')
  const [destino, setDestino] = useState('VACACIONES')
  const [rango, setRango] = useState(false)
  const [fechaIni, setFechaIni] = useState(inicial?.fecha || '')
  const [fechaFin, setFechaFin] = useState(inicial?.fecha || '')
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [conflictos, setConflictos] = useState<string[]>([])
  const [pendiente, setPendiente] = useState<string[] | null>(null)

  const opNombre = operadores.find((o: any) => o.id === operadorId)?.nombre || ''

  function validar(): string {
    if (!operadorId) return 'Selecciona el operador.'
    if (!fechaIni) return 'Indica la fecha.'
    if (rango) {
      if (!fechaFin) return 'Indica la fecha final.'
      if (fechaFin < fechaIni) return 'La fecha final no puede ser anterior a la inicial.'
    }
    return ''
  }

  /** Primer paso: revisa si esos días ya tienen algo capturado. */
  async function revisar() {
    const error = validar()
    if (error) { setMensaje(error); return }
    setMensaje('')
    setGuardando(true)

    const fechas = rango ? listarFechas(fechaIni, fechaFin) : [fechaIni]
    const { data: existentes } = await supabase
      .from('asignaciones')
      .select('fecha')
      .eq('operador_id', operadorId)
      .in('fecha', fechas)

    const ocupadas: string[] = Array.from(
      new Set<string>((existentes || []).map((e: any) => String(e.fecha)))
    ).sort()
    setGuardando(false)

    if (ocupadas.length > 0) {
      setConflictos(ocupadas)
      setPendiente(fechas)
      return
    }
    await guardar(fechas)
  }

  async function guardar(fechas: string[]) {
    if (fechas.length === 0) {
      setMensaje('No quedó ningún día por agregar.')
      return
    }
    setGuardando(true)

    const filas = fechas.map(f => ({
      fecha: f,
      tipo: 'local',
      destino,
      operador_id: operadorId,
      unidad_id: null,
      nota: nota.trim() || null,
    }))

    const { error } = await supabase.from('asignaciones').insert(filas)
    if (error) {
      setGuardando(false)
      setMensaje('No se pudo guardar: ' + error.message)
      return
    }

    // Las vacaciones se guardan TAMBIÉN en su propia tabla, para que
    // aparezcan en el módulo de Vacaciones y en el expediente.
    if (destino === 'VACACIONES') {
      const ordenadas = [...fechas].sort()
      const { error: errVac } = await supabase.from('vacaciones').insert({
        operador_id: operadorId,
        fecha_inicio: ordenadas[0],
        fecha_fin: ordenadas[ordenadas.length - 1],
        nota: nota.trim() || null,
      })
      if (errVac) {
        setGuardando(false)
        setMensaje('Se guardó en el calendario, pero no en el módulo de Vacaciones: ' + errVac.message)
        onGuardado()
        return
      }
    }

    setGuardando(false)
    onGuardado(`Se agregaron ${fechas.length} día${fechas.length === 1 ? '' : 's'} a ${opNombre}.`)
  }

  const opcion = OPCIONES_DIA.find(o => o.valor === destino)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">×</button>
        <h2 className="text-lg font-bold text-white mb-5">Agregar días</h2>

        {conflictos.length > 0 ? (
          <div>
            <p className="text-sm text-amber-300 mb-3">
              {conflictos.length === 1
                ? 'Este día ya tiene algo capturado:'
                : `Estos ${conflictos.length} días ya tienen algo capturado:`}
            </p>
            <div className="bg-gray-800 rounded-lg p-3 mb-4 text-sm text-gray-300 max-h-32 overflow-y-auto">
              {conflictos.map(f => formatFechaCorta(f)).join(' · ')}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Si los agregas de todos modos, ese día va a tener dos registros.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const restantes = (pendiente || []).filter(f => !conflictos.includes(f))
                  setConflictos([])
                  guardar(restantes)
                }}
                disabled={guardando}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50"
              >
                Omitir esos días y agregar el resto
              </button>
              <button
                onClick={() => { const todas = pendiente || []; setConflictos([]); guardar(todas) }}
                disabled={guardando}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm py-2.5 rounded-lg disabled:opacity-50"
              >
                Agregar de todos modos
              </button>
              <button
                onClick={() => { setConflictos([]); setPendiente(null) }}
                className="w-full text-gray-500 hover:text-gray-300 text-sm py-2"
              >
                Regresar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Operador</label>
              <select value={operadorId} onChange={e => setOperadorId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">Seleccionar...</option>
                {operadores.map((o: any) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Qué se registra</label>
              <div className="grid grid-cols-2 gap-2">
                {OPCIONES_DIA.map(o => (
                  <button
                    key={o.valor}
                    onClick={() => setDestino(o.valor)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      destino === o.valor ? o.clase : 'bg-gray-800 text-gray-500 border-gray-700'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setRango(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${!rango ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  Un solo día
                </button>
                <button onClick={() => { setRango(true); if (!fechaFin) setFechaFin(fechaIni) }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${rango ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  Rango de fechas
                </button>
              </div>
              <div className={`grid gap-2 ${rango ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">{rango ? 'Desde' : 'Fecha'}</label>
                  <input type="date" value={fechaIni}
                    onChange={e => { setFechaIni(e.target.value); if (!rango) setFechaFin(e.target.value) }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                {rango && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Hasta</label>
                    <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                  </div>
                )}
              </div>
              {rango && fechaIni && fechaFin && fechaFin >= fechaIni && (
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Son {listarFechas(fechaIni, fechaFin).length} días.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Nota (opcional)</label>
              <input type="text" value={nota} onChange={e => setNota(e.target.value)}
                placeholder="Motivo, autorizó, etc."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>

            {destino === 'VACACIONES' && (
              <p className="text-[11px] text-blue-400/80 bg-blue-950/40 border border-blue-900/50 rounded-lg px-3 py-2">
                Además del calendario, se va a registrar en el módulo de Vacaciones.
              </p>
            )}

            {mensaje && <p className="text-sm text-red-400">{mensaje}</p>}

            <div className="flex gap-2 pt-1">
              <button onClick={revisar} disabled={guardando}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Agregar'}
              </button>
              <button onClick={onClose}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-5 py-2.5 rounded-lg">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Historial() {
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [operadores, setOperadores] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalServicio, setModalServicio] = useState<any>(null)
  const [modalOperador, setModalOperador] = useState<string>('')
  const [agregar, setAgregar] = useState<any>(null)
  const [aviso, setAviso] = useState('')

  useEffect(() => { cargar() }, [mes])

  async function cargar() {
    setLoading(true)
    const inicio = `${mes}-01`
    const [anio, mesNum] = mes.split('-').map(Number)
    const ultimoDia = new Date(anio, mesNum, 0).getDate()
    const fin = `${mes}-${ultimoDia}`

    const { data: ops } = await supabase
      .from('operadores').select('id, nombre').eq('activo', true).order('nombre', { ascending: true })
    const { data: unis } = await supabase.from('unidades').select('id, nombre')
    const { data: asig, error } = await supabase
      .from('asignaciones')
      .select('id, fecha, tipo, destino, nota, operador_id, unidad_id, pax, hora_inicio, hora_fin')
      .gte('fecha', inicio).lte('fecha', fin).order('fecha', { ascending: true })

    if (error) console.error('Error cargando asignaciones:', error)
    if (ops) setOperadores(ops)
    if (unis) setUnidades(unis)
    if (asig) setAsignaciones(asig)
    setLoading(false)
  }

  const diasDelMes = () => {
    const [anio, mesNum] = mes.split('-').map(Number)
    const ultimoDia = new Date(anio, mesNum, 0).getDate()
    return Array.from({ length: ultimoDia }, (_, i) => {
      const d = i + 1
      return `${mes}-${String(d).padStart(2, '0')}`
    })
  }

  const dias = diasDelMes()
  const hoy = new Date().toISOString().split('T')[0]

  const esPasadoOHoy = (fecha: string) => fecha <= hoy

  const serviciosPorOperadorDia = (operadorId: string, fecha: string) =>
    asignaciones.filter(a => a.operador_id === operadorId && a.fecha === fecha)

  const esFijo = (nombre: string) => FIJOS.includes(nombre)

  const conteoOperador = (operadorId: string) => {
    const asig = asignaciones.filter(a => a.operador_id === operadorId)
    return {
      tours:     asig.filter(a => a.tipo === 'tour').length,
      transfers: asig.filter(a => a.tipo === 'transfer').length,
      rentas:    asig.filter(a => a.tipo === 'renta').length,
      locales:   asig.filter(a => a.tipo === 'local').length,
      descansos: asig.filter(a => a.destino?.toLowerCase().includes('descanso')).length,
      total:     asig.length,
    }
  }

  function abrirModal(servicio: any, operadorNombre: string) {
    const unidad = unidades.find(u => u.id === servicio.unidad_id)
    setModalServicio({ ...servicio, unidad_nombre: unidad?.nombre || '' })
    setModalOperador(operadorNombre)
  }

  function abrirAgregar(operadorId?: string, fecha?: string) {
    setAgregar({ operadorId: operadorId || '', fecha: fecha || '' })
  }

  function alGuardar(texto?: string) {
    setAgregar(null)
    if (texto) {
      setAviso(texto)
      setTimeout(() => setAviso(''), 5000)
    }
    cargar()
  }

  const nombreMes = new Date(`${mes}-15`).toLocaleString('es-MX', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-screen-2xl mx-auto">

        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Historial de operadores</h1>
            <p className="text-gray-400 text-sm">Vista mensual por operador</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => abrirAgregar()}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
              + Agregar días
            </button>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg" />
          </div>
        </div>

        {aviso && (
          <div className="mb-4 bg-green-950/50 border border-green-800 text-green-300 px-4 py-2.5 rounded-lg text-sm">
            {aviso}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(TIPO_COLOR).map(([k, v]: any) => (
            <span key={k} className={`${v.bg} ${v.text} text-xs px-3 py-1 rounded-full font-medium`}>{v.label}</span>
          ))}
          <span className="bg-gray-800 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">Descanso</span>
          <span className="bg-blue-950 text-blue-400 text-xs px-3 py-1 rounded-full font-medium">Vacaciones</span>
          <span className="bg-red-950 text-red-400 text-xs px-3 py-1 rounded-full font-medium">Falta</span>
          <span className="bg-amber-950 text-amber-400 text-xs px-3 py-1 rounded-full font-medium">Pidió día</span>
          <span className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full font-medium">Jornada 8H</span>
        </div>

        {loading && <p className="text-gray-400">Cargando...</p>}

        {!loading && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
              {operadores.map(op => {
                const c = conteoOperador(op.id)
                return (
                  <div key={op.id} className="bg-gray-900 rounded-xl p-3 text-sm">
                    <div className="font-semibold mb-2">{op.nombre}</div>
                    <div className="text-purple-300">Tours <span className="font-bold">{c.tours}</span></div>
                    <div className="text-blue-300">Transfers <span className="font-bold">{c.transfers}</span></div>
                    <div className="text-amber-300">Rentas <span className="font-bold">{c.rentas}</span></div>
                    <div className="text-green-300">Locales <span className="font-bold">{c.locales}</span></div>
                    <div className="text-gray-400">Descansos <span className="font-bold">{c.descansos}</span></div>
                    <div className="mt-2 pt-2 border-t border-gray-700 text-gray-200">
                      Total <span className="font-bold">{c.total}</span> días
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-[11px] text-gray-600 mb-2">
              Da clic en un día vacío para registrar vacaciones, falta u otro.
            </p>

            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr>
                    <th className="bg-gray-900 text-gray-400 px-2 py-2 text-left sticky left-0 z-10 min-w-[80px]">
                      {nombreMes}
                    </th>
                    {dias.map(d => {
                      const fecha = new Date(`${d}T12:00:00`)
                      const diaSemana = fecha.toLocaleString('es-MX', { weekday: 'short' })
                      const diaN = fecha.getDate()
                      const esFinSemana = fecha.getDay() === 0 || fecha.getDay() === 6
                      return (
                        <th key={d} className={`px-1 py-2 text-center min-w-[36px] ${esFinSemana ? 'bg-gray-800' : 'bg-gray-900'} text-gray-400`}>
                          <div>{diaN}</div>
                          <div className="text-gray-600">{diaSemana}</div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {operadores.map((op, i) => (
                    <tr key={op.id} className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900'}>
                      <td className="px-2 py-1 font-medium sticky left-0 z-10 bg-inherit">{op.nombre}</td>
                      {dias.map(d => {
                        const servicios = serviciosPorOperadorDia(op.id, d)
                        const esFinSemana = new Date(`${d}T12:00:00`).getDay() === 0 || new Date(`${d}T12:00:00`).getDay() === 6
                        const mostrarDescanso = servicios.length === 0 && esPasadoOHoy(d) && esFijo(op.nombre)

                        return (
                          <td key={d} className={`px-0.5 py-0.5 align-top ${esFinSemana ? 'opacity-75' : ''}`}>
                            {servicios.length === 0 ? (
                              mostrarDescanso ? (
                                <div
                                  onClick={() => abrirModal({ fecha: d, tipo: 'local', destino: 'DESCANSO', nota: '', unidad_id: null, pax: null, hora_inicio: null, hora_fin: null, virtual: true, operador_id: op.id }, op.nombre)}
                                  className="bg-gray-800 text-gray-500 rounded px-1 py-0.5 text-center leading-tight cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                  <div className="font-medium">Descanso</div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => abrirAgregar(op.id, d)}
                                  title="Agregar vacaciones, falta u otro"
                                  className="w-full text-gray-700 hover:text-indigo-400 hover:bg-gray-800 rounded py-0.5 transition-colors"
                                >
                                  —
                                </button>
                              )
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                {servicios.map((s, idx) => {
                                  const c = getTipoColor(s.tipo, s.destino || '', s.nota || '')
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => abrirModal(s, op.nombre)}
                                      className={`${c.bg} ${c.text} rounded px-1 py-0.5 text-center leading-tight cursor-pointer hover:opacity-80 transition-opacity`}
                                    >
                                      <div className="font-medium">{c.label}</div>
                                      {s.destino && !['DESCANSO','VACACIONES','FALTA'].includes(s.destino?.toUpperCase()) && (
                                        <div className="opacity-75 truncate max-w-[60px]">{s.destino}</div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal
        servicio={modalServicio}
        operadorNombre={modalOperador}
        onClose={() => setModalServicio(null)}
        onAgregar={(opId: string, fecha: string) => abrirAgregar(opId, fecha)}
      />

      {agregar && (
        <ModalAgregar
          operadores={operadores}
          inicial={agregar}
          onClose={() => setAgregar(null)}
          onGuardado={alGuardar}
        />
      )}
    </div>
  )
}
