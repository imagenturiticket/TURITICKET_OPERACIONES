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

function getTipoColor(tipo: string, destino: string, nota: string) {
  const d = destino?.toLowerCase() || ''
  const n = nota?.toLowerCase() || ''
  if (d.includes('descanso')) return { bg: 'bg-gray-800', text: 'text-gray-500', label: 'Descanso' }
  if (d.includes('vacacion')) return { bg: 'bg-blue-950', text: 'text-blue-400', label: 'Vacaciones' }
  if (d.includes('falta'))    return { bg: 'bg-red-950',  text: 'text-red-400',  label: 'Falta' }
  if (d.includes('a. gaby') || d.includes('a. oficina') || d.includes('s. puebla') || n.includes('jornada'))
    return { bg: 'bg-slate-700', text: 'text-slate-300', label: 'Jornada 8H' }
  return TIPO_COLOR[tipo] || { bg: 'bg-gray-700', text: 'text-gray-300', label: tipo }
}

export default function Historial() {
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [operadores, setOperadores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [mes])

  async function cargar() {
    setLoading(true)
    const inicio = `${mes}-01`
    const fin = `${mes}-31`
    const { data: ops } = await supabase
      .from('operadores')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre', { ascending: true })
    const { data: asig } = await supabase
      .from('asignaciones')
      .select('id, fecha, tipo, destino, nota, operador_id, unidad_id, unidades(nombre)')
      .gte('fecha', inicio)
      .lte('fecha', fin)
      .order('fecha', { ascending: true })
    if (ops) setOperadores(ops)
    if (asig) setAsignaciones(asig)
    setLoading(false)
  }

  const diasDelMes = () => {
    const [y, m] = mes.split('-').map(Number)
    const total = new Date(y, m, 0).getDate()
    return Array.from({ length: total }, (_, i) => {
      const d = String(i + 1).padStart(2, '0')
      return `${mes}-${d}`
    })
  }

  const dias = diasDelMes()

  const porOperadorYDia = (opId: string, fecha: string) =>
    asignaciones.filter(a => a.operador_id === opId && a.fecha === fecha)

  const resumenOperador = (opId: string) => {
    const asig = asignaciones.filter(a => a.operador_id === opId)
    return {
      tours:     asig.filter(a => a.tipo === 'tour').length,
      transfers: asig.filter(a => a.tipo === 'transfer').length,
      rentas:    asig.filter(a => a.tipo === 'renta').length,
      locales:   asig.filter(a => a.tipo === 'local').length,
      descansos: asig.filter(a => a.destino?.toLowerCase().includes('descanso')).length,
      total:     asig.length,
    }
  }

  const nombreDia = (fecha: string) => {
    const d = new Date(fecha + 'T12:00:00')
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Historial de operadores</h1>
            <p className="text-gray-400 text-sm">Vista mensual por operador</p>
          </div>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          {[
            { bg:'bg-purple-900', text:'text-purple-200', label:'Tour foráneo' },
            { bg:'bg-amber-900',  text:'text-amber-200',  label:'Renta' },
            { bg:'bg-green-900',  text:'text-green-200',  label:'Local' },
            { bg:'bg-blue-900',   text:'text-blue-200',   label:'Transfer' },
            { bg:'bg-gray-700',   text:'text-gray-300',   label:'Oficina' },
            { bg:'bg-slate-700',  text:'text-slate-300',  label:'Jornada 8H' },
            { bg:'bg-blue-950',   text:'text-blue-400',   label:'Vacaciones' },
            { bg:'bg-gray-800',   text:'text-gray-500',   label:'Descanso' },
            { bg:'bg-red-950',    text:'text-red-400',    label:'Falta' },
          ].map(c => (
            <span key={c.label} className={`${c.bg} ${c.text} text-xs px-2 py-1 rounded`}>{c.label}</span>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {operadores.map(op => {
            const r = resumenOperador(op.id)
            return (
              <div key={op.id} className="bg-gray-900 rounded-xl p-3">
                <p className="font-medium text-sm mb-2">{op.nombre}</p>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between"><span>Tours</span><span className="text-purple-400 font-medium">{r.tours}</span></div>
                  <div className="flex justify-between"><span>Transfers</span><span className="text-blue-400 font-medium">{r.transfers}</span></div>
                  <div className="flex justify-between"><span>Rentas</span><span className="text-amber-400 font-medium">{r.rentas}</span></div>
                  <div className="flex justify-between"><span>Locales</span><span className="text-green-400 font-medium">{r.locales}</span></div>
                  <div className="flex justify-between"><span>Descansos</span><span className="text-gray-500 font-medium">{r.descansos}</span></div>
                  <div className="flex justify-between border-t border-gray-700 pt-1 mt-1"><span>Total días</span><span className="text-white font-medium">{r.total}</span></div>
                </div>
              </div>
            )
          })}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Cargando...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-900">
                  <th className="text-left px-3 py-2 text-gray-400 font-medium sticky left-0 bg-gray-900 z-10 w-24">Operador</th>
                  {dias.map(d => (
                    <th key={d} className="px-1 py-2 text-gray-400 font-medium text-center min-w-16">
                      {nombreDia(d)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {operadores.map((op, i) => (
                  <tr key={op.id} className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900'}>
                    <td className={`px-3 py-2 font-medium sticky left-0 z-10 ${i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900'}`}>
                      {op.nombre}
                    </td>
                    {dias.map(d => {
                      const servicios = porOperadorYDia(op.id, d)
                      return (
                        <td key={d} className="px-1 py-1 text-center align-top">
                          {servicios.length === 0 ? (
                            <span className="text-gray-700">—</span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              {servicios.map((s, idx) => {
                                const c = getTipoColor(s.tipo, s.destino || '', s.nota || '')
                                return (
                                  <div key={idx} className={`${c.bg} ${c.text} rounded px-1 py-0.5 text-center leading-tight`}>
                                    <div className="font-medium">{c.label}</div>
                                    {s.destino && !['DESCANSO','VACACIONES','FALTA'].includes(s.destino?.toUpperCase()) && (
                                      <div className="opacity-75 truncate max-w-14">{s.destino}</div>
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
        )}
      </div>
    </div>
  )
}
