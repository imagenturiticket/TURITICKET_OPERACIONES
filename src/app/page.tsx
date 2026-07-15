'use client'
import { useState, useEffect, useRef, Fragment } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TIPO_COLOR: any = {
  tour:     'bg-purple-100 text-purple-800',
  transfer: 'bg-blue-100 text-blue-800',
  renta:    'bg-amber-100 text-amber-800',
  local:    'bg-green-100 text-green-800',
  oficina:  'bg-gray-200 text-gray-800',
}

const TIPO_EMOJI: any = {
  tour: '🗺️', transfer: '🚐', renta: '🔑', local: '🏙️', oficina: '🏢'
}

const TIPO_BG: any = {
  tour:     'bg-purple-900 text-purple-200',
  transfer: 'bg-blue-900 text-blue-200',
  renta:    'bg-amber-900 text-amber-200',
  local:    'bg-green-900 text-green-200',
  oficina:  'bg-gray-700 text-gray-300',
}

const DESTINOS_TOUR = [
  'CATEMACO', 'TAJIN', 'XALAPA', 'ORIZABA', 'CEMPOALA',
  'ROCA', 'ALVARADO', 'CAFE', 'DUNAS', 'RAFTING'
]

const FIJOS = ['Rafa', 'Chema', 'Hector', 'Hervert', 'Alfonso']

function FilaAsignacion({ a, operadores, unidades, onChange, onDelete }: any) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 flex flex-wrap gap-2 items-center border border-gray-700">
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${TIPO_COLOR[a.tipo]}`}>{a.tipo}</span>

      {a.tipo === 'tour' && (
        <>
          <select value={a.destino || ''} onChange={e => onChange(a.id, 'destino', e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white w-36">
            <option value="">Destino</option>
            {DESTINOS_TOUR.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="number" placeholder="Pax" value={a.pax || ''} onChange={e => onChange(a.id, 'pax', parseInt(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-16 text-white" />
        </>
      )}

      {a.tipo === 'transfer' && (
        <>
          <input placeholder="Hora" value={a.hora_inicio || ''} onChange={e => onChange(a.id, 'hora_inicio', e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-24 text-white" />
          <input placeholder="Notas" value={a.nota || ''} onChange={e => onChange(a.id, 'nota', e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-36 text-white" />
        </>
      )}

      {a.tipo === 'renta' && (
        <>
          <input placeholder="Hora inicio" value={a.hora_inicio || ''} onChange={e => onChange(a.id, 'hora_inicio', e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-24 text-white" />
          <input placeholder="Hora fin" value={a.hora_fin || ''} onChange={e => onChange(a.id, 'hora_fin', e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-24 text-white" />
          <input placeholder="Cliente" value={a.cliente || ''} onChange={e => onChange(a.id, 'cliente', e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-32 text-white" />
        </>
      )}

      <select value={a.operador_id || ''} onChange={e => onChange(a.id, 'operador_id', e.target.value)}
        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white">
        <option value="" disabled className="text-gray-500">— Seleccionar —</option>
        {operadores.map((o: any) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
      </select>

      <select value={a.unidad_id || ''} onChange={e => onChange(a.id, 'unidad_id', e.target.value)}
        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white">
        <option value="" disabled className="text-gray-500">— Seleccionar —</option>
        {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
      </select>

      <button onClick={() => onDelete(a.id, a.isNew)} className="ml-auto text-gray-500 hover:text-red-400 text-xl leading-none">×</button>
    </div>
  )
}

export default function Home() {
  const [operadores, setOperadores] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [nuevas, setNuevas] = useState<any[]>([])
  const [guardadas, setGuardadas] = useState<any[]>([])
  const [guardando, setGuardando] = useState(false)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [refreshTimeline, setRefreshTimeline] = useState(0)

  useEffect(() => { cargarDatos() }, [])
  useEffect(() => { if (fecha) { cargarGuardadas() } }, [fecha])

  async function cargarDatos() {
    const { data: ops } = await supabase.from('operadores').select('*').eq('activo', true).order('nombre')
    const { data: unis } = await supabase.from('unidades').select('*').eq('activo', true).order('nombre')
    if (ops) setOperadores(ops)
    if (unis) setUnidades(unis)
  }

  async function cargarGuardadas() {
    const { data } = await supabase
      .from('asignaciones')
      .select('*, operadores(nombre), unidades(nombre)')
      .eq('fecha', fecha)
      .order('tipo')
    if (data) {
      setGuardadas(data.map((a: any) => {
        if (a.tipo === 'renta' && a.nota?.startsWith('Cliente:')) {
          const partes = a.nota.split('|')
          return { ...a, cliente: partes[0].replace('Cliente:', '').trim(), nota: partes.slice(1).join('|').trim() }
        }
        return a
      }))
    }
  }

  function agregarFila(tipo: string) {
    setNuevas([...nuevas, {
      id: 'new-' + Date.now(), tipo, fecha,
      operador_id: '',
      unidad_id: '',
      destino: '', pax: 2, hora_inicio: '', hora_fin: '', nota: '', cliente: '',
      isNew: true
    }])
  }

  function actualizarNueva(id: string, campo: string, valor: any) {
    setNuevas(nuevas.map(a => a.id !== id ? a : { ...a, [campo]: valor }))
  }

  function actualizarGuardada(id: string, campo: string, valor: any) {
    setGuardadas(guardadas.map(a => {
      if (a.id !== id) return a
      const updated = { ...a, [campo]: valor }
      if (campo === 'operador_id') updated.operadores = { nombre: operadores.find(o => o.id === valor)?.nombre || '' }
      if (campo === 'unidad_id') updated.unidades = { nombre: unidades.find(u => u.id === valor)?.nombre || '' }
      return updated
    }))
  }

  async function eliminarNueva(id: string) {
    setNuevas(nuevas.filter(a => a.id !== id))
  }

  async function eliminarGuardada(id: string) {
    await supabase.from('asignaciones').delete().eq('id', id)
    setGuardadas(guardadas.filter(a => a.id !== id))
  }

  function buildNota(a: any) {
    if (a.tipo === 'renta' && a.cliente) {
      return `Cliente:${a.cliente}${a.nota ? '|' + a.nota : ''}`
    }
    return a.nota || ''
  }

  async function guardar() {
    if (nuevas.length === 0) return
    setGuardando(true)
    for (const a of nuevas) {
      const { isNew, id, operadores: _, unidades: __, cliente, ...data } = a
      await supabase.from('asignaciones').insert({ ...data, fecha, nota: buildNota(a) })
    }
    setNuevas([])
    await cargarGuardadas()
    setRefreshTimeline(x => x + 1)
    setGuardando(false)
    setMensaje('✓ Guardado correctamente')
    setTimeout(() => setMensaje(''), 3000)
  }

  async function guardarEdicion() {
    setGuardandoEdicion(true)
    for (const a of guardadas) {
      const { operadores: _, unidades: __, isNew, cliente, ...data } = a
      await supabase.from('asignaciones').update({
        tipo: data.tipo, destino: data.destino, pax: data.pax,
        hora_inicio: data.hora_inicio, hora_fin: data.hora_fin,
        nota: buildNota(a), operador_id: data.operador_id, unidad_id: data.unidad_id,
      }).eq('id', data.id)
    }
    setRefreshTimeline(x => x + 1)
    setGuardandoEdicion(false)
    setMensaje('✓ Cambios guardados')
    setTimeout(() => setMensaje(''), 3000)
  }

  function generarWhatsApp() {
    const meses = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const [y, m, d] = fecha.split('-')
    const fechaStr = `${parseInt(d)} de ${meses[parseInt(m)]}`
    const todas = [...guardadas]

    const tours = todas.filter(a => a.tipo === 'tour')
    const transfers = todas.filter(a => a.tipo === 'transfer')
    const rentas = todas.filter(a => a.tipo === 'renta')
    const locales = todas.filter(a => a.tipo === 'local')
    const oficinas = todas.filter(a => a.tipo === 'oficina')

    const lines: string[] = [`📅 *Asignaciones ${fechaStr}*`, '']

    if (tours.length) {
      lines.push('🗺️ *TOUR*')
      tours.forEach(a => {
        const op = a.operadores?.nombre || ''
        const uni = a.unidades?.nombre || ''
        lines.push(`• ${a.destino} — ${op}, ${uni}${a.pax ? ` (${a.pax} pax)` : ''}`)
      })
      lines.push('')
    }
    if (transfers.length) {
      lines.push('🚐 *TRANSFER*')
      transfers.forEach(a => {
        const op = a.operadores?.nombre || ''
        const uni = a.unidades?.nombre || ''
        lines.push(`• ${a.hora_inicio ? a.hora_inicio + 'hrs' : ''} — ${op}, ${uni}${a.nota ? ' · ' + a.nota : ''}`)
      })
      lines.push('')
    }
    if (rentas.length) {
      lines.push('🔑 *RENTA*')
      rentas.forEach(a => {
        const op = a.operadores?.nombre || ''
        const uni = a.unidades?.nombre || ''
        const cliente = a.cliente ? ` · ${a.cliente}` : ''
        lines.push(`• ${a.hora_inicio || ''}${a.hora_fin ? ' a ' + a.hora_fin : ''} — ${op}, ${uni}${cliente}`)
      })
      lines.push('')
    }
    if (locales.length) {
      lines.push('🏙️ *LOCALES*')
      locales.forEach(a => {
        const op = a.operadores?.nombre || ''
        const uni = a.unidades?.nombre || ''
        lines.push(`• ${op}${uni ? ', ' + uni : ''}`)
      })
      lines.push('')
    }
    if (oficinas.length) {
      lines.push('🏢 *OFICINA*')
      oficinas.forEach(a => {
        const op = a.operadores?.nombre || ''
        const uni = a.unidades?.nombre || ''
        lines.push(`• ${op}${uni ? ', ' + uni : ''}`)
      })
    }

    const texto = lines.join('\n').trim()
    navigator.clipboard.writeText(texto)
    setMensaje('¡Mensaje copiado para WhatsApp!')
    setTimeout(() => setMensaje(''), 3000)
  }

  const tipos = ['tour', 'transfer', 'renta', 'local', 'oficina']
  const fijosOrdenados = operadores.filter(op => FIJOS.includes(op.nombre))

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Asignaciones</h1>
            <p className="text-gray-400 text-sm">Turiticket Operaciones</p>
          </div>
          <button onClick={generarWhatsApp}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium">
            📱 WhatsApp
          </button>
        </div>

        {mensaje && (
          <div className="bg-indigo-900 border border-indigo-700 text-indigo-200 px-4 py-2 rounded-lg text-sm">
            {mensaje}
          </div>
        )}

        <div className="bg-gray-900 rounded-xl p-4">
          <label className="text-sm text-gray-400 block mb-1">Fecha</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
        </div>

        {guardadas.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-300">📋 Asignaciones del día</h2>
              <button onClick={guardarEdicion} disabled={guardandoEdicion}
                className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">
                {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
            <div className="space-y-2">
              {guardadas.map(a => (
                <FilaAsignacion key={a.id} a={a} operadores={operadores} unidades={unidades}
                  onChange={actualizarGuardada} onDelete={(id: string) => eliminarGuardada(id)} />
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">➕ Nueva asignación</h2>
          {nuevas.length > 0 && (
            <div className="space-y-2 mb-4">
              {nuevas.map(a => (
                <FilaAsignacion key={a.id} a={a} operadores={operadores} unidades={unidades}
                  onChange={actualizarNueva} onDelete={(id: string) => eliminarNueva(id)} />
              ))}
            </div>
          )}
          <div className="flex gap-2 flex-wrap mb-4">
            {tipos.map(t => (
              <button key={t} onClick={() => agregarFila(t)}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg text-sm capitalize">
                {TIPO_EMOJI[t]} + {t}
              </button>
            ))}
          </div>
          {nuevas.length > 0 && (
            <button onClick={guardar} disabled={guardando}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 w-full">
              {guardando ? 'Guardando...' : `Guardar ${nuevas.length} asignación${nuevas.length > 1 ? 'es' : ''}`}
            </button>
          )}
        </div>

        {fijosOrdenados.length > 0 && (
          <LineaTiempoFijos operadoresFijos={fijosOrdenados} refreshKey={refreshTimeline} />
        )}

      </div>
    </div>
  )
}

// ── Línea de tiempo horizontal de operadores fijos ──────────────────────────
// Operadores en filas, días en columnas, scroll horizontal sin fin (carga más
// días automáticamente al acercarte a cualquiera de los dos extremos).

const DAY_WIDTH = 96
const CHUNK_DIAS = 20
const MAX_DIAS = 240
const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function addDays(fechaStr: string, n: number) {
  const d = new Date(fechaStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function rangoFechas(inicio: string, fin: string) {
  const dias: string[] = []
  let cur = inicio
  while (cur <= fin) { dias.push(cur); cur = addDays(cur, 1) }
  return dias
}

function esFuturoLejanoTL(fechaStr: string) {
  const pasadoManana = addDays(new Date().toISOString().split('T')[0], 2)
  return fechaStr >= pasadoManana
}

function LineaTiempoFijos({ operadoresFijos, refreshKey }: any) {
  const [dias, setDias] = useState<string[]>([])
  const [data, setData] = useState<any[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const diasRef = useRef<string[]>([])
  const loadingRef = useRef(false)
  const inicializadoRef = useRef(false)
  const scrolledRef = useRef(false)
  const primerRenderRef = useRef(true)
  const hoyStr = new Date().toISOString().split('T')[0]

  useEffect(() => { diasRef.current = dias }, [dias])

  async function fetchRango(inicioStr: string, finStr: string) {
    const ids = operadoresFijos.map((o: any) => o.id)
    if (ids.length === 0) return []
    const { data: rows } = await supabase
      .from('asignaciones')
      .select('*')
      .gte('fecha', inicioStr)
      .lte('fecha', finStr)
      .in('operador_id', ids)
    return rows || []
  }

  // Inicializar rango (hoy -20 a hoy +40) cuando ya tenemos operadores
  useEffect(() => {
    if (operadoresFijos.length === 0 || inicializadoRef.current) return
    inicializadoRef.current = true
    const inicio = addDays(hoyStr, -20)
    const fin = addDays(hoyStr, 40)
    const d = rangoFechas(inicio, fin)
    setDias(d)
    fetchRango(inicio, fin).then(rows => setData(rows))
  }, [operadoresFijos])

  // Refrescar datos del rango actual cuando cambian las asignaciones guardadas
  useEffect(() => {
    if (primerRenderRef.current) { primerRenderRef.current = false; return }
    const d = diasRef.current
    if (d.length === 0) return
    fetchRango(d[0], d[d.length - 1]).then(rows => setData(rows))
  }, [refreshKey])

  // Centrar en "hoy" la primera vez que se pinta el rango
  useEffect(() => {
    if (dias.length === 0 || scrolledRef.current) return
    scrolledRef.current = true
    requestAnimationFrame(() => irAHoy())
  }, [dias])

  async function extenderInicio() {
    if (loadingRef.current) return
    const actuales = diasRef.current
    if (actuales.length === 0 || actuales.length >= MAX_DIAS) return
    loadingRef.current = true
    const primerDia = actuales[0]
    const nuevoInicio = addDays(primerDia, -CHUNK_DIAS)
    const nuevoFinChunk = addDays(primerDia, -1)
    const nuevosDias = rangoFechas(nuevoInicio, nuevoFinChunk)
    const rows = await fetchRango(nuevoInicio, nuevoFinChunk)
    const el = containerRef.current
    const prevScrollLeft = el ? el.scrollLeft : 0
    setDias(prev => [...nuevosDias, ...prev])
    setData(prev => [...rows, ...prev])
    requestAnimationFrame(() => {
      if (el) el.scrollLeft = prevScrollLeft + nuevosDias.length * DAY_WIDTH
    })
    loadingRef.current = false
  }

  async function extenderFin() {
    if (loadingRef.current) return
    const actuales = diasRef.current
    if (actuales.length === 0 || actuales.length >= MAX_DIAS) return
    loadingRef.current = true
    const ultimoDia = actuales[actuales.length - 1]
    const nuevoInicioChunk = addDays(ultimoDia, 1)
    const nuevoFin = addDays(ultimoDia, CHUNK_DIAS)
    const nuevosDias = rangoFechas(nuevoInicioChunk, nuevoFin)
    const rows = await fetchRango(nuevoInicioChunk, nuevoFin)
    setDias(prev => [...prev, ...nuevosDias])
    setData(prev => [...prev, ...rows])
    loadingRef.current = false
  }

  function onScroll() {
    const el = containerRef.current
    if (!el) return
    const umbral = DAY_WIDTH * 5
    if (el.scrollLeft < umbral) extenderInicio()
    else if (el.scrollWidth - el.scrollLeft - el.clientWidth < umbral) extenderFin()
  }

  function irAHoy() {
    const el = containerRef.current
    if (!el) return
    const idx = dias.indexOf(hoyStr)
    if (idx === -1) return
    el.scrollLeft = Math.max(0, (idx - 2) * DAY_WIDTH)
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-300">📊 Línea de tiempo — Operadores fijos</h2>
        <button onClick={irAHoy} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
          Ir a hoy
        </button>
      </div>

      <div ref={containerRef} onScroll={onScroll} className="overflow-x-auto rounded-lg border border-gray-800">
        <div className="grid" style={{ gridTemplateColumns: `140px repeat(${dias.length}, ${DAY_WIDTH}px)`, minWidth: 'max-content' }}>

          {/* Fila de etiqueta de mes */}
          <div className="sticky left-0 z-30 bg-gray-900" />
          {dias.map((d, i) => {
            const dt = new Date(d + 'T12:00:00')
            const mostrarMes = dt.getDate() === 1 || i === 0
            return (
              <div key={d + '-mes'} className="relative h-5 bg-gray-900">
                {mostrarMes && (
                  <span className="absolute left-1 top-0 text-[11px] font-semibold text-gray-400 whitespace-nowrap z-10">
                    {MESES_ES[dt.getMonth()]} {dt.getFullYear()}
                  </span>
                )}
              </div>
            )
          })}

          {/* Fila de encabezado de días */}
          <div className="sticky left-0 z-30 bg-gray-900 border-b border-r border-gray-800 flex items-end px-2 pb-1 text-[11px] text-gray-500 font-semibold">
            Operador
          </div>
          {dias.map(d => {
            const esHoy = d === hoyStr
            const dt = new Date(d + 'T12:00:00')
            return (
              <div key={d + '-h'} className={`text-center text-[10px] py-1 border-b border-gray-800 ${esHoy ? 'bg-indigo-950 text-indigo-300 font-bold' : 'text-gray-500'}`}>
                <div className="capitalize">{dt.toLocaleString('es-MX', { weekday: 'short' })}</div>
                <div>{dt.getDate()}</div>
              </div>
            )
          })}

          {/* Filas de operadores */}
          {operadoresFijos.map((op: any) => {
            const asigOp = data.filter((a: any) => a.operador_id === op.id)
            return (
              <Fragment key={op.id}>
                <div className="sticky left-0 z-20 bg-gray-900 flex items-center px-2 py-1 text-xs font-medium text-white border-b border-r border-gray-800">
                  {op.nombre}
                </div>
                {dias.map(d => {
                  const esHoy = d === hoyStr
                  const serviciosDia = asigOp.filter((a: any) => a.fecha === d)
                  const futuro = esFuturoLejanoTL(d)
                  return (
                    <div key={d} className={`border-b border-gray-800 px-1 py-1 flex flex-col gap-0.5 justify-center min-h-[42px] ${esHoy ? 'bg-indigo-950/40' : ''}`}>
                      {serviciosDia.length === 0 ? (
                        futuro ? (
                          <span className="text-gray-700 text-center text-xs">—</span>
                        ) : (
                          <span className="border border-dashed border-gray-600 bg-gray-800/30 text-gray-500 italic rounded px-1 text-[10px] text-center truncate" title="Descanso">
                            💤 Descanso
                          </span>
                        )
                      ) : (
                        serviciosDia.map((s: any, i: number) => {
                          const esDescanso = s.destino?.toLowerCase().includes('descanso')
                          const esVacaciones = s.destino?.toLowerCase().includes('vacacion')
                          const bg = esDescanso
                            ? 'border border-dashed border-gray-600 bg-gray-800/30 text-gray-500 italic'
                            : esVacaciones ? 'bg-blue-900 text-blue-300' : TIPO_BG[s.tipo] || 'bg-gray-700 text-gray-300'
                          const texto = esDescanso ? '💤 Descanso' : esVacaciones ? '🏖️ Vacaciones' :
                            s.tipo === 'tour' ? `🗺️ ${s.destino || ''}` :
                            s.tipo === 'transfer' ? '🚐 Transfer' :
                            s.tipo === 'renta' ? '🔑 Renta' :
                            s.tipo === 'local' ? '🏙️ Local' :
                            s.tipo === 'oficina' ? '🏢 Oficina' : s.tipo
                          const titulo = s.tipo === 'tour' ? `${s.destino || ''}${s.pax ? ` (${s.pax} pax)` : ''}` :
                            s.tipo === 'transfer' ? `Transfer${s.hora_inicio ? ' ' + s.hora_inicio : ''}` :
                            s.tipo === 'renta' ? `Renta ${s.hora_inicio || ''}${s.hora_fin ? '-' + s.hora_fin : ''}` :
                            s.tipo === 'local' ? (s.destino || 'Local') :
                            s.tipo === 'oficina' ? (s.destino || 'Oficina') : s.tipo
                          return (
                            <span key={i} title={titulo} className={`${bg} rounded px-1 text-[10px] text-center truncate leading-tight`}>
                              {texto}
                            </span>
                          )
                        })
                      )}
                    </div>
                  )
                })}
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}