'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Importar() {
  const [texto, setTexto] = useState('')
  const [preview, setPreview] = useState<any[]>([])
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState('')
  const [operadores, setOperadores] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [cargado, setCargado] = useState(false)

  async function cargarCatalogos() {
    if (cargado) return
    const { data: ops } = await supabase.from('operadores').select('*').eq('activo', true)
    const { data: unis } = await supabase.from('unidades').select('*').eq('activo', true)
    if (ops) setOperadores(ops)
    if (unis) setUnidades(unis)
    setCargado(true)
  }

  function parsearCSV() {
    cargarCatalogos()
    const lineas = texto.trim().split('\n').filter(l => l.trim() && !l.toLowerCase().startsWith('fecha'))
    const filas = lineas.map((linea, i) => {
      const cols = linea.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      return { _idx: i+1, fecha: cols[0]||'', tipo: cols[1]?.toLowerCase()||'', destino: cols[2]||'', pax: parseInt(cols[3])||1, operador_nombre: cols[4]||'', unidad_nombre: cols[5]||'', hora_inicio: cols[6]||'', hora_fin: cols[7]||'', nota: cols[8]||'' }
    }).filter(f => f.fecha && f.tipo)
    setPreview(filas)
    setResultado('')
  }

  async function importar() {
    setImportando(true)
    let ok = 0, err = 0
    for (const fila of preview) {
      const operador = operadores.find(o => o.nombre.toLowerCase() === fila.operador_nombre.toLowerCase())
      const unidad = unidades.find(u => u.nombre.toLowerCase() === fila.unidad_nombre.toLowerCase())
      if (!operador) { err++; continue }
      const { error } = await supabase.from('asignaciones').insert({ fecha: fila.fecha, tipo: fila.tipo, destino: fila.destino, pax: fila.pax, operador_id: operador.id, unidad_id: unidad?.id||null, hora_inicio: fila.hora_inicio||null, hora_fin: fila.hora_fin||null, nota: fila.nota||null })
      if (error) err++; else ok++
    }
    setImportando(false)
    setResultado(`✅ ${ok} registros importados${err>0?` · ❌ ${err} errores`:''}`)
    if (ok > 0) { setTexto(''); setPreview([]) }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6"><h1 className="text-2xl font-semibold">Importar datos</h1><p className="text-gray-400 text-sm">Pega datos en formato CSV para importar masivamente</p></div>
        <div className="bg-gray-900 rounded-xl p-4 mb-4 text-xs text-gray-400">
          <p className="font-medium text-gray-300 mb-2">Formato CSV:</p>
          <code className="block bg-gray-800 p-2 rounded text-green-400">fecha,tipo,destino,pax,operador,unidad,hora_inicio,hora_fin,nota<br/>2026-01-15,tour,CATEMACO,8,Rafa,Sprinter 1,,,</code>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 mb-4">
          <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={8} placeholder="Pega tu CSV aquí..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono resize-y" />
        </div>
        <div className="flex gap-3 mb-6">
          <button onClick={parsearCSV} disabled={!texto.trim()} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40">👁 Previsualizar</button>
          {preview.length > 0 && <button onClick={importar} disabled={importando} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{importando ? 'Importando...' : `📥 Importar ${preview.length} registros`}</button>}
        </div>
        {resultado && <div className="mb-4 bg-gray-900 border border-gray-700 px-4 py-3 rounded-lg text-sm">{resultado}</div>}
        {preview.length > 0 && (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800"><p className="text-sm font-medium">{preview.length} registros listos</p></div>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-800 text-gray-400"><th className="px-3 py-2 text-left">#</th><th className="px-3 py-2 text-left">Fecha</th><th className="px-3 py-2 text-left">Tipo</th><th className="px-3 py-2 text-left">Destino</th><th className="px-3 py-2 text-left">Operador</th><th className="px-3 py-2 text-left">Unidad</th></tr></thead>
              <tbody>{preview.map((f,i) => <tr key={i} className={`border-b border-gray-800 ${i%2===0?'':'bg-gray-950'}`}><td className="px-3 py-2 text-gray-500">{f._idx}</td><td className="px-3 py-2">{f.fecha}</td><td className="px-3 py-2 capitalize">{f.tipo}</td><td className="px-3 py-2">{f.destino||'—'}</td><td className="px-3 py-2">{f.operador_nombre}</td><td className="px-3 py-2">{f.unidad_nombre||'—'}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
