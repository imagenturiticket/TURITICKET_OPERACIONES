'use client'
import { useState, useEffect } from 'react'
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
  const [semana, setSemana] = useState<any[]>([])
  const [diasSemana, setDiasSemana] = useState<string[]>([])

  useEffect(() => { cargarDatos() }, [])
  useEffect(() => { if (fecha) { cargarGuardadas(); cargarSemana() } }, [fecha])

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
      // Extraer cliente de la nota si es renta
      setGuardadas(data.map((a: any) => {
        if (a.tipo === 'renta' && a.nota?.startsWith('Cliente:')) {
          const partes = a.nota.split('|')
          return { ...a, cliente: partes[0].replace('Cliente:', '').trim(), nota: partes.slice(1).join('|').trim() }
        }
        return a
      }))
    }
  }

  async function cargarSemana() {
    const d = new Date(fecha + 'T12:00:00')
    const dia = d.getDay()
    const lunes = new Date(d)
    lunes.setDate(d.getDate() - (dia === 0 ? 6 : dia - 1))

    const dias: string[] = []
    for (let i = 0; i < 7; i++) {
      const dd = new Date(lunes)
      dd.setDate(lunes.getDate() + i)
      dias.push(dd.toISOString().split('T')[0])
    }
    setDiasSemana(dias)

    const inicio = dias[0]
    const fin = dias[6]

    const { data } = await supabase
      .from('asignaciones')
      .select('*, operadores(nombre), unidades(nombre)')
      .gte('fecha', inicio)
      .lte('fecha', fin)
    if (data) setSemana(data)
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

  // Construir nota con cliente para rentas
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
    await cargarSemana()
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
    await cargarSemana()
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

  function labelDia(fechaStr: string) {
    const hoy = new Date().toISOString().split('T')[0]
    const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const antier = new Date(Date.now() - 172800000).toISOString().split('T')[0]
    const d = new Date(fechaStr + 'T12:00:00')
    const nombreDia = d.toLocaleString('es-MX', { weekday: 'short' })
    const numDia = d.getDate()
    if (fechaStr === hoy) return `Hoy ${numDia}`
    if (fechaStr === ayer) return `Ayer ${numDia}`
    if (fechaStr === antier) return `Antier ${numDia}`
    return `${nombreDia} ${numDia}`
  }

  function esFuturo(fechaStr: string) {
    const hoy = new Date().toISOString().split('T')[0]
    return fechaStr > hoy
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

        {fijosOrdenados.length > 0 && diasSemana.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">📊 Semana en detalle</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {fijosOrdenados.map(op => {
                const asigOp = semana.filter(a => a.operador_id === op.id)
                const alertas: string[] = []
                const rentas = asigOp.filter(a => a.tipo === 'renta').length
                const locales = asigOp.filter(a => a.tipo === 'local' && !a.destino?.toLowerCase().includes('descanso')).length
                const descansos = asigOp.filter(a => a.destino?.toLowerCase().includes('descanso')).length
                if (descansos === 0 && asigOp.length >= 5) alertas.push('⚠️ Sin descanso')
                if (locales >= 3) alertas.push('📍 Muchos locales')
                if (rentas >= 3) alertas.push('🔑 Varias rentas')

                return (
                  <div key={op.id} className={`rounded-xl p-3 text-xs ${alertas.length ? 'bg-gray-800 border border-yellow-700' : 'bg-gray-800'}`}>
                    <div className="font-semibold text-sm mb-3 text-white">{op.nombre}</div>
                    <div className="space-y-1.5">
                      {diasSemana.map(d => {
                        const serviciosDia = asigOp.filter(a => a.fecha === d)
                        const futuro = esFuturo(d)
                        const label = labelDia(d)

                        return (
                          <div key={d} className={`flex gap-2 items-start ${futuro ? 'opacity-40' : ''}`}>
                            <span className="text-gray-500 w-16 shrink-0 pt-0.5">{label}</span>
                            <div className="flex flex-col gap-0.5 flex-1">
                              {serviciosDia.length === 0 ? (
                                futuro ? (
                                  <span className="text-gray-600">—</span>
                                ) : (
                                  <span className="bg-gray-700 text-gray-400 rounded px-1.5 py-0.5 text-xs font-medium">
                                    💤 Descanso
                                  </span>
                                )
                              ) : (
                                serviciosDia.map((s, i) => {
                                  const esDescanso = s.destino?.toLowerCase().includes('descanso')
                                  const esVacaciones = s.destino?.toLowerCase().includes('vacacion')
                                  const bg = esDescanso ? 'bg-gray-700 text-gray-400' : esVacaciones ? 'bg-blue-900 text-blue-300' : TIPO_BG[s.tipo] || 'bg-gray-700 text-gray-300'
                                  const texto = esDescanso ? '💤 Descanso' : esVacaciones ? '🏖️ Vacaciones' :
                                    s.tipo === 'tour' ? `🗺️ ${s.destino}` :
                                    s.tipo === 'transfer' ? `🚐 Transfer${s.hora_inicio ? ' ' + s.hora_inicio : ''}` :
                                    s.tipo === 'renta' ? `🔑 Renta${s.hora_inicio ? ' ' + s.hora_inicio : ''}` :
                                    s.tipo === 'local' ? `🏙️ Locales` :
                                    s.tipo === 'oficina' ? `🏢 Oficina` : s.tipo
                                  return (
                                    <span key={i} className={`${bg} rounded px-1.5 py-0.5 text-xs font-medium`}>
                                      {texto}
                                    </span>
                                  )
                                })
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {alertas.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-700 space-y-0.5">
                        {alertas.map((a, i) => (
                          <div key={i} className="text-yellow-400 text-xs">{a}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}