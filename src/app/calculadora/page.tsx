'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const TIPOS = ['tour','transfer','renta','local','oficina']
const TARIFAS_DEFAULT: any = { tour:300, transfer:250, renta:200, local:150, oficina:100 }

export default function Calculadora() {
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0,7))
  const [operadores, setOperadores] = useState<any[]>([])
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [tarifas, setTarifas] = useState<any>(TARIFAS_DEFAULT)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [mes])

  async function cargar() {
    setLoading(true)
    const { data: ops } = await supabase.from('operadores').select('*').eq('activo', true).order('nombre')
    const { data: asig } = await supabase.from('asignaciones').select('*').gte('fecha', `${mes}-01`).lte('fecha', `${mes}-31`)
    if (ops) setOperadores(ops)
    if (asig) setAsignaciones(asig)
    setLoading(false)
  }

  const calcular = (opId: string) => {
    const asig = asignaciones.filter(a => a.operador_id === opId)
    let total = 0
    const desglose: any = {}
    TIPOS.forEach(t => { const cant = asig.filter(a => a.tipo === t).length; const subtotal = cant*(tarifas[t]||0); desglose[t]={cant,subtotal}; total+=subtotal })
    return { desglose, total }
  }

  const totalGeneral = operadores.reduce((sum, op) => sum + calcular(op.id).total, 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-semibold">Calculadora de pagos</h1><p className="text-gray-400 text-sm">Estimación de pago por operador</p></div>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
        </div>
        <div className="bg-gray-900 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-medium text-gray-300 mb-3">Tarifas por servicio (MXN)</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {TIPOS.map(t => (
              <div key={t}>
                <label className="text-xs text-gray-400 block mb-1 capitalize">{t}</label>
                <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-2 py-1">
                  <span className="text-gray-500 text-sm mr-1">$</span>
                  <input type="number" value={tarifas[t]} onChange={e => setTarifas({...tarifas,[t]:parseInt(e.target.value)||0})} className="bg-transparent text-white text-sm w-full outline-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {loading ? <div className="text-center text-gray-400 py-12">Cargando...</div> : (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-800"><th className="text-left px-4 py-3 text-gray-400 font-medium">Operador</th>{TIPOS.map(t => <th key={t} className="px-3 py-3 text-center text-gray-400 font-medium capitalize">{t}</th>)}<th className="px-4 py-3 text-right text-white font-medium">Total</th></tr></thead>
              <tbody>
                {operadores.map((op,i) => {
                  const {desglose,total} = calcular(op.id)
                  return (
                    <tr key={op.id} className={`border-b border-gray-800 ${i%2===0?'':'bg-gray-950'}`}>
                      <td className="px-4 py-3 font-medium">{op.nombre}</td>
                      {TIPOS.map(t => <td key={t} className="px-3 py-3 text-center text-gray-300 text-xs">{desglose[t].cant>0?<div><div className="font-medium">{desglose[t].cant}x</div><div className="text-gray-500">${desglose[t].subtotal.toLocaleString()}</div></div>:<span className="text-gray-700">—</span>}</td>)}
                      <td className="px-4 py-3 text-right font-bold text-green-400">${total.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot><tr className="border-t border-gray-700 bg-gray-800"><td colSpan={TIPOS.length+1} className="px-4 py-3 text-sm text-gray-400 font-medium">Total nómina estimada</td><td className="px-4 py-3 text-right font-bold text-white text-base">${totalGeneral.toLocaleString()}</td></tr></tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
