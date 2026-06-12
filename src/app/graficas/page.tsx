'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const TIPOS = ['tour','transfer','renta','local','oficina']
const COLORES: any = {
  tour:     { bar: 'bg-purple-500', text: 'text-purple-400' },
  transfer: { bar: 'bg-blue-500',   text: 'text-blue-400'   },
  renta:    { bar: 'bg-amber-500',  text: 'text-amber-400'  },
  local:    { bar: 'bg-green-500',  text: 'text-green-400'  },
  oficina:  { bar: 'bg-gray-500',   text: 'text-gray-400'   },
}

export default function Graficas() {
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))
  const [operadores, setOperadores] = useState<any[]>([])
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [mes])

  async function cargar() {
    setLoading(true)
    const { data: ops } = await supabase.from('operadores').select('*').eq('activo', true).order('nombre')
    const { data: asig } = await supabase.from('asignaciones').select('*, operadores(nombre)').gte('fecha', `${mes}-01`).lte('fecha', `${mes}-31`)
    if (ops) setOperadores(ops)
    if (asig) setAsignaciones(asig)
    setLoading(false)
  }

  const resumen = (opId: string) => {
    const asig = asignaciones.filter(a => a.operador_id === opId)
    const res: any = {}
    TIPOS.forEach(t => res[t] = asig.filter(a => a.tipo === t).length)
    res.total = asig.length
    return res
  }

  const maxTotal = Math.max(...operadores.map(op => resumen(op.id).total), 1)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-semibold">Gráficas</h1><p className="text-gray-400 text-sm">Actividad por operador</p></div>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
        </div>
        {loading ? <div className="text-center text-gray-400 py-12">Cargando...</div> : (
          <>
            <div className="bg-gray-900 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-medium text-gray-400 mb-4">Total de servicios por operador</h2>
              <div className="space-y-3">
                {operadores.map(op => {
                  const r = resumen(op.id)
                  return (
                    <div key={op.id}>
                      <div className="flex justify-between text-sm mb-1"><span className="font-medium">{op.nombre}</span><span className="text-gray-400">{r.total} servicios</span></div>
                      <div className="h-5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${Math.round((r.total/maxTotal)*100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {TIPOS.map(tipo => (
                <div key={tipo} className="bg-gray-900 rounded-xl p-4 text-center">
                  <p className={`text-3xl font-bold ${COLORES[tipo].text}`}>{asignaciones.filter(a => a.tipo === tipo).length}</p>
                  <p className="text-sm text-gray-400 capitalize mt-1">{tipo}s</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Operador</th>
                    {TIPOS.map(t => <th key={t} className={`px-3 py-3 text-center font-medium capitalize ${COLORES[t].text}`}>{t}</th>)}
                    <th className="px-3 py-3 text-center text-white font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {operadores.map((op, i) => {
                    const r = resumen(op.id)
                    return (
                      <tr key={op.id} className={`border-b border-gray-800 ${i%2===0?'':'bg-gray-950'}`}>
                        <td className="px-4 py-3 font-medium">{op.nombre}</td>
                        {TIPOS.map(t => <td key={t} className={`px-3 py-3 text-center ${COLORES[t].text}`}>{r[t]||'—'}</td>)}
                        <td className="px-3 py-3 text-center font-bold text-white">{r.total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
