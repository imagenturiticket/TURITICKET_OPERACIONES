'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const TIPOS = ['tour', 'transfer', 'renta', 'local', 'oficina']
const FIJOS = ['Rafa', 'Chema', 'Hector', 'Hervert', 'Alfonso']

const COLORES: any = {
  tour:     { bar: 'bg-purple-500', text: 'text-purple-400', light: 'bg-purple-900' },
  transfer: { bar: 'bg-blue-500',   text: 'text-blue-400',   light: 'bg-blue-900'   },
  renta:    { bar: 'bg-amber-500',  text: 'text-amber-400',  light: 'bg-amber-900'  },
  local:    { bar: 'bg-green-500',  text: 'text-green-400',  light: 'bg-green-900'  },
  oficina:  { bar: 'bg-gray-500',   text: 'text-gray-400',   light: 'bg-gray-700'   },
}

const UNIDAD_COLOR = [
  'bg-indigo-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500',
  'bg-lime-500', 'bg-rose-500', 'bg-teal-500', 'bg-violet-500', 'bg-yellow-500'
]

export default function Graficas() {
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))
  const [operadores, setOperadores] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [mes])

  async function cargar() {
    setLoading(true)
    const [anio, mesNum] = mes.split('-').map(Number)
    const ultimoDia = new Date(anio, mesNum, 0).getDate()
    const inicio = `${mes}-01`
    const fin = `${mes}-${ultimoDia}`

    const { data: ops } = await supabase.from('operadores').select('*').eq('activo', true).order('nombre')
    const { data: unis } = await supabase.from('unidades').select('*').eq('activo', true).order('nombre')
    const { data: asig } = await supabase.from('asignaciones').select('*, operadores(nombre), unidades(nombre)').gte('fecha', inicio).lte('fecha', fin)

    if (ops) setOperadores(ops)
    if (unis) setUnidades(unis)
    if (asig) setAsignaciones(asig)
    setLoading(false)
  }

  const resumenOp = (opId: string) => {
    const asig = asignaciones.filter(a => a.operador_id === opId)
    const res: any = {}
    TIPOS.forEach(t => res[t] = asig.filter(a => a.tipo === t).length)
    res.total = asig.length
    return res
  }

  const resumenUni = (uniId: string) => {
    const asig = asignaciones.filter(a => a.unidad_id === uniId)
    const res: any = {}
    TIPOS.forEach(t => res[t] = asig.filter(a => a.tipo === t).length)
    res.total = asig.length
    return res
  }

  const fijos = operadores.filter(op => FIJOS.includes(op.nombre))
  const maxTotalOp = Math.max(...fijos.map(op => resumenOp(op.id).total), 1)
  const maxTotalUni = Math.max(...unidades.map(u => resumenUni(u.id).total), 1)

  const totalPorTipo = TIPOS.map(t => ({
    tipo: t,
    count: asignaciones.filter(a => a.tipo === t).length
  }))
  const maxTipo = Math.max(...totalPorTipo.map(t => t.count), 1)

  const nombreMes = new Date(`${mes}-15`).toLocaleString('es-MX', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Gráficas</h1>
            <p className="text-gray-400 text-sm capitalize">{nombreMes}</p>
          </div>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Cargando...</div>
        ) : (
          <>
            {/* Tarjetas totales por tipo */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {totalPorTipo.map(({ tipo, count }) => (
                <div key={tipo} className={`${COLORES[tipo].light} rounded-xl p-4 text-center`}>
                  <p className={`text-3xl font-bold ${COLORES[tipo].text}`}>{count}</p>
                  <p className="text-sm text-gray-300 capitalize mt-1">{tipo}s</p>
                </div>
              ))}
            </div>

            {/* Gráfica 1 — Rendimiento por operador */}
            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">📊 Servicios por operador</h2>
              <div className="space-y-4">
                {fijos.map(op => {
                  const r = resumenOp(op.id)
                  return (
                    <div key={op.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{op.nombre}</span>
                        <span className="text-gray-400">{r.total} servicios</span>
                      </div>
                      {/* Barra segmentada por tipo */}
                      <div className="h-6 bg-gray-800 rounded-full overflow-hidden flex">
                        {TIPOS.map(t => {
                          const pct = r.total > 0 ? Math.round((r[t] / r.total) * 100) : 0
                          return pct > 0 ? (
                            <div key={t} className={`h-full ${COLORES[t].bar} flex items-center justify-center text-xs text-white font-medium`}
                              style={{ width: `${pct}%` }} title={`${t}: ${r[t]}`}>
                              {pct > 8 ? r[t] : ''}
                            </div>
                          ) : null
                        })}
                        {/* Relleno vacío */}
                        <div className="h-full bg-gray-800 flex-1" style={{ width: `${Math.max(0, 100 - Math.round((r.total / maxTotalOp) * 100))}%` }} />
                      </div>
                      {/* Leyenda pequeña */}
                      <div className="flex gap-3 mt-1 flex-wrap">
                        {TIPOS.map(t => r[t] > 0 ? (
                          <span key={t} className={`text-xs ${COLORES[t].text}`}>{t}: {r[t]}</span>
                        ) : null)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Gráfica 2 — Distribución por tipo */}
            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">🥧 Distribución por tipo de servicio</h2>
              <div className="space-y-3">
                {totalPorTipo.map(({ tipo, count }) => (
                  <div key={tipo}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`capitalize font-medium ${COLORES[tipo].text}`}>{tipo}</span>
                      <span className="text-gray-400">{count} — {asignaciones.length > 0 ? Math.round((count / asignaciones.length) * 100) : 0}%</span>
                    </div>
                    <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${COLORES[tipo].bar} rounded-full transition-all duration-500`}
                        style={{ width: `${asignaciones.length > 0 ? Math.round((count / maxTipo) * 100) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfica 3 — Comparativa operadores (tabla) */}
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="text-sm font-semibold text-gray-300">📋 Comparativa detallada</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Operador</th>
                    {TIPOS.map(t => (
                      <th key={t} className={`px-3 py-3 text-center font-medium capitalize ${COLORES[t].text}`}>{t}</th>
                    ))}
                    <th className="px-3 py-3 text-center text-white font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {fijos.map((op, i) => {
                    const r = resumenOp(op.id)
                    return (
                      <tr key={op.id} className={`border-b border-gray-800 ${i % 2 === 0 ? '' : 'bg-gray-950'}`}>
                        <td className="px-4 py-3 font-medium">{op.nombre}</td>
                        {TIPOS.map(t => (
                          <td key={t} className={`px-3 py-3 text-center ${COLORES[t].text}`}>{r[t] || '—'}</td>
                        ))}
                        <td className="px-3 py-3 text-center font-bold text-white">{r.total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Gráfica 4 — Uso de unidades */}
            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">🚐 Uso de unidades</h2>
              <div className="space-y-4">
                {unidades.filter(u => resumenUni(u.id).total > 0).sort((a, b) => resumenUni(b.id).total - resumenUni(a.id).total).map((u, idx) => {
                  const r = resumenUni(u.id)
                  return (
                    <div key={u.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{u.nombre}</span>
                        <span className="text-gray-400">{r.total} servicios</span>
                      </div>
                      <div className="h-6 bg-gray-800 rounded-full overflow-hidden flex">
                        {TIPOS.map(t => {
                          const pct = r.total > 0 ? Math.round((r[t] / r.total) * 100) : 0
                          return pct > 0 ? (
                            <div key={t} className={`h-full ${COLORES[t].bar} flex items-center justify-center text-xs text-white font-medium`}
                              style={{ width: `${pct}%` }} title={`${t}: ${r[t]}`}>
                              {pct > 8 ? r[t] : ''}
                            </div>
                          ) : null
                        })}
                      </div>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        {TIPOS.map(t => r[t] > 0 ? (
                          <span key={t} className={`text-xs ${COLORES[t].text}`}>{t}: {r[t]}</span>
                        ) : null)}
                      </div>
                    </div>
                  )
                })}
                {unidades.filter(u => resumenUni(u.id).total === 0).length > 0 && (
                  <p className="text-xs text-gray-600 mt-2">
                    Sin uso: {unidades.filter(u => resumenUni(u.id).total === 0).map(u => u.nombre).join(', ')}
                  </p>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  )
}