'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [operadores, setOperadores] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    if (fecha) cargarAsignaciones()
  }, [fecha])

  async function cargarDatos() {
    const { data: ops } = await supabase.from('operadores').select('*').eq('activo', true).order('nombre')
    const { data: unis } = await supabase.from('unidades').select('*').eq('activo', true).order('nombre')
    if (ops) setOperadores(ops)
    if (unis) setUnidades(unis)
  }

  async function cargarAsignaciones() {
    const { data } = await supabase.from('asignaciones').select(`*, operadores(nombre), unidades(nombre)`).eq('fecha', fecha)
    if (data) setAsignaciones(data)
  }

  function agregarFila(tipo: string) {
    setAsignaciones([...asignaciones, {
      id: 'new-' + Date.now(), tipo, fecha,
      operador_id: operadores[0]?.id || '',
      unidad_id: unidades[0]?.id || '',
      destino: '', pax: 2, hora_inicio: '', hora_fin: '', nota: '',
      operadores: { nombre: operadores[0]?.nombre || '' },
      unidades: { nombre: unidades[0]?.nombre || '' },
      isNew: true
    }])
  }

  function actualizarFila(id: string, campo: string, valor: any) {
    setAsignaciones(asignaciones.map(a => {
      if (a.id !== id) return a
      const updated = { ...a, [campo]: valor }
      if (campo === 'operador_id') updated.operadores = { nombre: operadores.find(o => o.id === valor)?.nombre || '' }
      if (campo === 'unidad_id') updated.unidades = { nombre: unidades.find(u => u.id === valor)?.nombre || '' }
      return updated
    }))
  }

  async function eliminarFila(id: string, isNew: boolean) {
    if (!isNew) await supabase.from('asignaciones').delete().eq('id', id)
    setAsignaciones(asignaciones.filter(a => a.id !== id))
  }

  async function guardar() {
    setGuardando(true)
    const nuevas = asignaciones.filter(a => a.isNew)
    for (const a of nuevas) {
      const { isNew, operadores: _, unidades: __, id, ...data } = a
      await supabase.from('asignaciones').insert({ ...data, fecha })
    }
    await cargarAsignaciones()
    setGuardando(false)
    setMensaje('Guardado correctamente')
    setTimeout(() => setMensaje(''), 3000)
  }

  function generarWhatsApp() {
    const meses = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const [y,m,d] = fecha.split('-')
    const fechaStr = `${parseInt(d)} de ${meses[parseInt(m)]}`
    const lines = [`Asignación ${fechaStr}`]
    const locales: string[] = []
    asignaciones.forEach(a => {
      const op = a.operadores?.nombre || ''
      const uni = a.unidades?.nombre || ''
      if (a.tipo === 'tour') lines.push(`${a.destino}: ${a.pax} Pax, ${uni}, ${op}`)
      else if (a.tipo === 'transfer') lines.push(`Transfer P. ${a.hora_inicio} - ${uni}, ${op}`)
      else if (a.tipo === 'renta') lines.push(`R. de Spr ${a.hora_inicio} a ${a.hora_fin} - ${op}, ${uni}`)
      else if (a.tipo === 'oficina') lines.push(`Oficina: ${op}, ${uni}`)
      else if (a.tipo === 'local') { let t = op; if (uni) t += `, ${uni}`; if (a.nota) t += ` (${a.nota})`; locales.push(t) }
    })
    if (locales.length) lines.push(`📍 Locales - ${locales.join(' / ')}`)
    navigator.clipboard.writeText(lines.join('\n'))
    setMensaje('¡Mensaje copiado para WhatsApp!')
    setTimeout(() => setMensaje(''), 3000)
  }

  const tipos = ['tour','transfer','renta','local','oficina']
  const colorTipo: any = { tour:'bg-purple-100 text-purple-800', transfer:'bg-blue-100 text-blue-800', renta:'bg-amber-100 text-amber-800', local:'bg-green-100 text-green-800', oficina:'bg-gray-100 text-gray-800' }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Operadores</h1>
            <p className="text-gray-400 text-sm">Turiticket — Asignaciones del día</p>
          </div>
          <div className="flex gap-2">
            <button onClick={generarWhatsApp} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium">📱 WhatsApp</button>
            <button onClick={guardar} disabled={guardando} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{guardando ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>

        {mensaje && <div className="mb-4 bg-indigo-900 border border-indigo-700 text-indigo-200 px-4 py-2 rounded-lg text-sm">{mensaje}</div>}

        <div className="bg-gray-900 rounded-xl p-4 mb-4">
          <label className="text-sm text-gray-400 block mb-1">Fecha</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
        </div>

        <div className="space-y-2 mb-4">
          {asignaciones.map(a => (
            <div key={a.id} className="bg-gray-900 rounded-xl p-3 flex flex-wrap gap-2 items-center">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorTipo[a.tipo]}`}>{a.tipo}</span>
              {a.tipo === 'tour' && <input placeholder="Destino" value={a.destino} onChange={e => actualizarFila(a.id,'destino',e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-28" />}
              {a.tipo === 'tour' && <input type="number" placeholder="Pax" value={a.pax} onChange={e => actualizarFila(a.id,'pax',parseInt(e.target.value))} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-16" />}
              {(a.tipo === 'transfer' || a.tipo === 'renta') && <input placeholder="Hora inicio" value={a.hora_inicio} onChange={e => actualizarFila(a.id,'hora_inicio',e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-24" />}
              {a.tipo === 'renta' && <input placeholder="Hora fin" value={a.hora_fin} onChange={e => actualizarFila(a.id,'hora_fin',e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-24" />}
              {a.tipo === 'local' && <input placeholder="Nota" value={a.nota} onChange={e => actualizarFila(a.id,'nota',e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-36" />}
              <select value={a.operador_id} onChange={e => actualizarFila(a.id,'operador_id',e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm">
                {operadores.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </select>
              {a.tipo !== 'local' && <select value={a.unidad_id} onChange={e => actualizarFila(a.id,'unidad_id',e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm">
                {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>}
              <button onClick={() => eliminarFila(a.id, a.isNew)} className="ml-auto text-gray-500 hover:text-red-400 text-lg">×</button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {tipos.map(t => (
            <button key={t} onClick={() => agregarFila(t)} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg text-sm capitalize">+ {t}</button>
          ))}
        </div>
      </div>
    </div>
  )
}