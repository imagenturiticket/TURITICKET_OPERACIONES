'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FIJOS = ['Rafa', 'Chema', 'Hector', 'Hervert', 'Alfonso']

export default function Vacaciones() {
  const [operadores, setOperadores] = useState<any[]>([])
  const [vacaciones, setVacaciones] = useState<any[]>([])
  const [operadorId, setOperadorId] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data: ops } = await supabase
      .from('operadores')
      .select('*')
      .eq('activo', true)
      .order('nombre')
    if (ops) {
      const fijos = ops.filter(o => FIJOS.includes(o.nombre))
      setOperadores(fijos)
      if (fijos.length > 0) setOperadorId(fijos[0].id)
    }

    const { data: vac } = await supabase
      .from('vacaciones')
      .select('*, operadores(nombre)')
      .order('fecha_inicio', { ascending: false })
    if (vac) setVacaciones(vac)
  }

  async function agregar() {
    if (!operadorId || !fechaInicio || !fechaFin) {
      setMensaje('⚠️ Completa todos los campos')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    setGuardando(true)
    await supabase.from('vacaciones').insert({
      operador_id: operadorId,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      nota
    })
    setFechaInicio('')
    setFechaFin('')
    setNota('')
    await cargar()
    setGuardando(false)
    setMensaje('✓ Vacaciones registradas')
    setTimeout(() => setMensaje(''), 3000)
  }

  async function eliminar(id: string) {
    await supabase.from('vacaciones').delete().eq('id', id)
    setVacaciones(vacaciones.filter(v => v.id !== id))
  }

  function formatFecha(f: string) {
    const [y, m, d] = f.split('-')
    const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${parseInt(d)} ${meses[parseInt(m)]} ${y}`
  }

  // Verificar quién está de vacaciones hoy
  const hoy = new Date().toISOString().split('T')[0]
  const enVacacionesHoy = vacaciones.filter(v =>
    v.fecha_inicio <= hoy && v.fecha_fin >= hoy
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-semibold">Vacaciones</h1>
          <p className="text-gray-400 text-sm">Registro de períodos de vacaciones</p>
        </div>

        {mensaje && (
          <div className="bg-indigo-900 border border-indigo-700 text-indigo-200 px-4 py-2 rounded-lg text-sm">
            {mensaje}
          </div>
        )}

        {/* Quién está de vacaciones hoy */}
        {enVacacionesHoy.length > 0 && (
          <div className="bg-blue-950 border border-blue-700 rounded-xl p-4">
            <p className="text-blue-300 text-sm font-semibold mb-2">🏖️ De vacaciones hoy:</p>
            {enVacacionesHoy.map(v => (
              <p key={v.id} className="text-blue-200 text-sm">
                • {v.operadores?.nombre} — hasta el {formatFecha(v.fecha_fin)}
              </p>
            ))}
          </div>
        )}

        {/* Formulario */}
        <div className="bg-gray-900 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">➕ Registrar vacaciones</h2>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Operador</label>
            <select value={operadorId} onChange={e => setOperadorId(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-full">
              {operadores.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Fecha inicio</label>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Fecha fin</label>
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-full" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Nota (opcional)</label>
            <input placeholder="ej. Vacaciones de verano" value={nota} onChange={e => setNota(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-full" />
          </div>

          <button onClick={agregar} disabled={guardando}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 w-full">
            {guardando ? 'Guardando...' : 'Registrar vacaciones'}
          </button>
        </div>

        {/* Lista de vacaciones */}
        {vacaciones.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">📋 Períodos registrados</h2>
            <div className="space-y-2">
              {vacaciones.map(v => {
                const activo = v.fecha_inicio <= hoy && v.fecha_fin >= hoy
                const pasado = v.fecha_fin < hoy
                return (
                  <div key={v.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${activo ? 'bg-blue-950 border border-blue-700' : pasado ? 'bg-gray-800 opacity-60' : 'bg-gray-800'}`}>
                    <div>
                      <span className="font-medium text-sm">{v.operadores?.nombre}</span>
                      <span className="text-gray-400 text-sm mx-2">·</span>
                      <span className="text-gray-300 text-sm">{formatFecha(v.fecha_inicio)} → {formatFecha(v.fecha_fin)}</span>
                      {v.nota && <span className="text-gray-500 text-xs ml-2">({v.nota})</span>}
                      {activo && <span className="ml-2 text-xs text-blue-400">🏖️ Activo</span>}
                    </div>
                    <button onClick={() => eliminar(v.id)}
                      className="text-gray-500 hover:text-red-400 text-lg ml-4">×</button>
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