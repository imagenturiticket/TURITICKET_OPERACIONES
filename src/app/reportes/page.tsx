'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Reportes() {
  const [operadores, setOperadores] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [reportes, setReportes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    unidad_id: '',
    operador_responsable_id: '',
    reportado_por_id: '',
    tipo: 'unidad_sucia',
    descripcion: '',
    bono_descontado: true,
  })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data: ops } = await supabase.from('operadores').select('*').eq('activo', true).order('nombre')
    const { data: unis } = await supabase.from('unidades').select('*').eq('activo', true).order('nombre')
    const { data: reps } = await supabase.from('reportes_incidencia')
      .select('*, unidades(nombre), operador_resp:operadores!operador_responsable_id(nombre), reportado_por:operadores!reportado_por_id(nombre)')
      .order('fecha', { ascending: false })
      .limit(50)
    if (ops) setOperadores(ops)
    if (unis) setUnidades(unis)
    if (reps) setReportes(reps)
    setLoading(false)
  }

  async function buscarUltimoOperador(unidadId: string, fecha: string) {
    const { data } = await supabase.from('asignaciones')
      .select('*, operadores(nombre)')
      .eq('unidad_id', unidadId)
      .lt('fecha', fecha)
      .order('fecha', { ascending: false })
      .limit(1)
    if (data && data.length > 0) {
      setForm(f => ({ ...f, operador_responsable_id: data[0].operador_id }))
      setMensaje(`Último operador detectado: ${data[0].operadores?.nombre} (${data[0].fecha})`)
      setTimeout(() => setMensaje(''), 4000)
    } else {
      setMensaje('No se encontró uso previo de esta unidad')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function guardar() {
    if (!form.unidad_id || !form.operador_responsable_id) {
      setMensaje('⚠️ Selecciona unidad y operador responsable')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    setGuardando(true)
    const { error } = await supabase.from('reportes_incidencia').insert(form)
    if (error) {
      setMensaje('❌ Error al guardar: ' + error.message)
    } else {
      setMensaje('✅ Reporte guardado correctamente')
      setMostrarForm(false)
      setForm({ fecha: new Date().toISOString().split('T')[0], unidad_id: '', operador_responsable_id: '', reportado_por_id: '', tipo: 'unidad_sucia', descripcion: '', bono_descontado: true })
      cargar()
    }
    setGuardando(false)
    setTimeout(() => setMensaje(''), 4000)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este reporte?')) return
    await supabase.from('reportes_incidencia').delete().eq('id', id)
    cargar()
  }

  const TIPOS: any = {
    unidad_sucia: { label: 'Unidad sucia', color: 'bg-orange-900 text-orange-200' },
    llegada_tarde: { label: 'Llegada tarde', color: 'bg-yellow-900 text-yellow-200' },
    falta: { label: 'Falta', color: 'bg-red-900 text-red-200' },
    otro: { label: 'Otro', color: 'bg-gray-700 text-gray-200' },
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Reportes de incidencias</h1>
            <p className="text-gray-400 text-sm">Unidades sucias, faltas y llegadas tarde</p>
          </div>
          <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
            {mostrarForm ? 'Cancelar' : '+ Nuevo reporte'}
          </button>
        </div>

        {mensaje && <div className="mb-4 bg-gray-900 border border-gray-700 px-4 py-3 rounded-lg text-sm">{mensaje}</div>}

        {mostrarForm && (
          <div className="bg-gray-900 rounded-xl p-5 mb-6 border border-gray-700">
            <h2 className="text-sm font-medium text-gray-300 mb-4">Nuevo reporte</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tipo de incidencia</label>
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="unidad_sucia">Unidad sucia</option>
                  <option value="llegada_tarde">Llegada tarde</option>
                  <option value="falta">Falta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Unidad</label>
                <div className="flex gap-2">
                  <select value={form.unidad_id} onChange={e => { setForm({...form, unidad_id: e.target.value}); if(e.target.value) buscarUltimoOperador(e.target.value, form.fecha) }}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                    <option value="">Seleccionar...</option>
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Operador responsable</label>
                <select value={form.operador_responsable_id} onChange={e => setForm({...form, operador_responsable_id: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">Seleccionar...</option>
                  {operadores.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Reportado por</label>
                <select value={form.reportado_por_id} onChange={e => setForm({...form, reportado_por_id: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">Seleccionar...</option>
                  {operadores.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.bono_descontado} onChange={e => setForm({...form, bono_descontado: e.target.checked})}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-300">Descontar bono ($100)</span>
                </label>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                rows={2} placeholder="Describe la incidencia..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none" />
            </div>
            <button onClick={guardar} disabled={guardando}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar reporte'}
            </button>
          </div>
        )}

        {loading ? <div className="text-center text-gray-400 py-12">Cargando...</div> : (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            {reportes.length === 0 ? (
              <div className="text-center text-gray-500 py-12">No hay reportes registrados</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Fecha</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Tipo</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Unidad</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Responsable</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Reportó</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Bono</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Descripción</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.map((r, i) => (
                    <tr key={r.id} className={`border-b border-gray-800 ${i%2===0?'':'bg-gray-950'}`}>
                      <td className="px-4 py-3 text-gray-300">{r.fecha}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${TIPOS[r.tipo]?.color || 'bg-gray-700 text-gray-200'}`}>
                          {TIPOS[r.tipo]?.label || r.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{r.unidades?.nombre || '—'}</td>
                      <td className="px-4 py-3 text-red-400 font-medium">{r.operador_resp?.nombre || '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{r.reportado_por?.nombre || '—'}</td>
                      <td className="px-4 py-3">
                        {r.bono_descontado
                          ? <span className="text-red-400 text-xs font-medium">-$100</span>
                          : <span className="text-gray-500 text-xs">Sin descuento</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{r.descripcion || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => eliminar(r.id)} className="text-gray-500 hover:text-red-400 text-lg">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
