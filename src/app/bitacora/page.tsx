'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORIAS = [
  'Servicio', 'Verificación', 'Batería', 'Incidente', 'Frenos', 'Llantas',
  'Revisión', 'Limpiaparabrisas', 'Reporte', 'Refacciones', 'Reparaciones',
  'Alineación y Balanceo', 'Aceite', 'Chasis', 'Fumigación', 'Golpe',
  'Ponche', 'Diagnóstico', 'Accesorios', 'GPS', 'Rotulado', 'Placas',
  'Tapicería', 'Clima', 'Compras', 'Refacciones e insumos', 'Otro'
]

const CAT_COLOR: any = {
  'Servicio':              'bg-blue-900 text-blue-200',
  'Verificación':          'bg-slate-700 text-slate-200',
  'Batería':               'bg-yellow-900 text-yellow-200',
  'Incidente':             'bg-red-900 text-red-200',
  'Frenos':                'bg-orange-900 text-orange-200',
  'Llantas':               'bg-green-900 text-green-200',
  'Revisión':              'bg-slate-700 text-slate-200',
  'Reporte':               'bg-amber-900 text-amber-200',
  'Reparaciones':          'bg-red-800 text-red-200',
  'Refacciones':           'bg-purple-900 text-purple-200',
  'Alineación y Balanceo': 'bg-teal-900 text-teal-200',
  'Aceite':                'bg-amber-800 text-amber-200',
  'Golpe':                 'bg-rose-900 text-rose-200',
  'Ponche':                'bg-orange-800 text-orange-200',
  'Fumigación':            'bg-lime-900 text-lime-200',
  'Diagnóstico':           'bg-indigo-900 text-indigo-200',
}

const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function formatFecha(fecha: string) {
  if (!fecha) return '—'
  const [y, m, d] = fecha.split('-').map(Number)
  return `${d} de ${MESES_ES[m-1]} de ${y}`
}

function ModalRegistro({ unidades, registro, onClose, onSave }: any) {
  const [form, setForm] = useState(registro || {
    unidad_id: '', fecha: new Date().toISOString().split('T')[0],
    kilometraje: '', categoria: '', detalles: '',
    costo: '', taller_mecanico: '', anexos: '', recomendaciones: ''
  })
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    if (!form.unidad_id || !form.fecha || !form.categoria || !form.detalles) {
      alert('Completa unidad, fecha, categoría y detalles')
      return
    }
    setGuardando(true)
    const data = {
      unidad_id: form.unidad_id,
      fecha: form.fecha,
      kilometraje: form.kilometraje ? parseInt(form.kilometraje) : null,
      categoria: form.categoria,
      detalles: form.detalles,
      costo: form.costo ? parseFloat(form.costo) : null,
      taller_mecanico: form.taller_mecanico || null,
      anexos: form.anexos || null,
      recomendaciones: form.recomendaciones || null,
    }
    if (form.id) {
      await supabase.from('bitacora_unidades').update(data).eq('id', form.id)
    } else {
      await supabase.from('bitacora_unidades').insert(data)
    }
    setGuardando(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative bg-gray-900 rounded-2xl p-6 w-full max-w-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">×</button>
        <h2 className="text-lg font-bold text-white mb-5">{form.id ? 'Editar registro' : 'Nuevo registro'}</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Unidad *</label>
            <select value={form.unidad_id} onChange={e => setForm({...form, unidad_id: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">— Seleccionar —</option>
              {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Fecha *</label>
            <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Categoría *</label>
            <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">— Seleccionar —</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Kilometraje</label>
            <input type="number" placeholder="ej. 150000" value={form.kilometraje} onChange={e => setForm({...form, kilometraje: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Detalles *</label>
            <textarea rows={3} value={form.detalles} onChange={e => setForm({...form, detalles: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Costo</label>
            <input type="number" placeholder="$0.00" value={form.costo} onChange={e => setForm({...form, costo: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Taller / Mecánico</label>
            <input type="text" value={form.taller_mecanico} onChange={e => setForm({...form, taller_mecanico: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Anexos (links o nombres de archivos)</label>
            <input type="text" value={form.anexos} onChange={e => setForm({...form, anexos: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Recomendaciones / Presupuestos</label>
            <textarea rows={2} value={form.recomendaciones} onChange={e => setForm({...form, recomendaciones: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={guardar} disabled={guardando}
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex-1">
            {guardando ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Agregar registro'}
          </button>
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg text-sm">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function Bitacora() {
  const [unidades, setUnidades] = useState<any[]>([])
  const [registros, setRegistros] = useState<any[]>([])
  const [unidadFiltro, setUnidadFiltro] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<any>(null) // null = cerrado, {} = nuevo, registro = editar
  const [vista, setVista] = useState<'bitacora' | 'kilometros'>('bitacora')

  // Kilometraje
  const [kmRegistros, setKmRegistros] = useState<any[]>([])
  const [kmForm, setKmForm] = useState({ unidad_id: '', kilometraje: '', fecha: new Date().toISOString().split('T')[0], notas: '' })
  const [guardandoKm, setGuardandoKm] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data: unis } = await supabase.from('unidades').select('*').eq('activo', true).order('nombre')
    const { data: regs } = await supabase.from('bitacora_unidades').select('*').order('fecha', { ascending: false })
    const { data: kms } = await supabase.from('kilometraje_unidades').select('*').order('fecha', { ascending: false })
    if (unis) setUnidades(unis)
    if (regs) setRegistros(regs)
    if (kms) setKmRegistros(kms)
    setLoading(false)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este registro?')) return
    await supabase.from('bitacora_unidades').delete().eq('id', id)
    cargar()
  }

  async function guardarKm() {
    if (!kmForm.unidad_id || !kmForm.kilometraje || !kmForm.fecha) {
      alert('Completa unidad, kilometraje y fecha')
      return
    }
    setGuardandoKm(true)
    await supabase.from('kilometraje_unidades').insert({
      unidad_id: kmForm.unidad_id,
      kilometraje: parseInt(kmForm.kilometraje),
      fecha: kmForm.fecha,
      notas: kmForm.notas || null
    })
    setKmForm({ unidad_id: '', kilometraje: '', fecha: new Date().toISOString().split('T')[0], notas: '' })
    setGuardandoKm(false)
    cargar()
  }

  // Intervalo de servicio por unidad (km)
  const INTERVALOS: any = {
    'Avanza': 10000,
    'Urvan 1': 10000,
    'Urvan 2': 10000,
    'Hiace 1': 10000,
    'Sprinter 1': 25000,
    'Sprinter 2': 25000,
    'Sprinter 3': 25000,
  }

  function getDashboardKm() {
    return unidades.map(u => {
      // Último kilometraje registrado
      const kmsU = kmRegistros.filter(k => k.unidad_id === u.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      const ultimoKm = kmsU[0]

      // Último servicio de la bitácora
      const serviciosU = registros
        .filter(r => r.unidad_id === u.id && r.categoria === 'Servicio' && r.kilometraje)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      const ultimoServicio = serviciosU[0]

      const intervalo = INTERVALOS[u.nombre] || 10000
      const kmActual = ultimoKm?.kilometraje || null
      const kmServicio = ultimoServicio?.kilometraje || null
      const kmSiguiente = kmServicio ? kmServicio + intervalo : null
      const kmRestantes = kmActual && kmSiguiente ? kmSiguiente - kmActual : null

      let alerta = ''
      if (kmRestantes !== null) {
        if (kmRestantes <= 300) alerta = 'rojo'
        else if (kmRestantes <= 1000) alerta = 'naranja'
        else if (kmRestantes <= 1500) alerta = 'amarillo'
      }

      return { ...u, ultimoKm, ultimoServicio, kmActual, kmSiguiente, kmRestantes, alerta, intervalo }
    })
  }

  const registrosFiltrados = registros.filter(r => {
    if (unidadFiltro && r.unidad_id !== unidadFiltro) return false
    if (categoriaFiltro && r.categoria !== categoriaFiltro) return false
    return true
  })

  const dashboard = getDashboardKm()

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Bitácora de Unidades</h1>
            <p className="text-gray-400 text-sm">Historial de mantenimiento y eventos</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setVista('bitacora')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${vista === 'bitacora' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              📋 Bitácora
            </button>
            <button onClick={() => setVista('kilometros')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${vista === 'kilometros' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              🚗 Kilómetros
            </button>
          </div>
        </div>

        {/* VISTA BITÁCORA */}
        {vista === 'bitacora' && (
          <>
            {/* Filtros + botón nuevo */}
            <div className="bg-gray-900 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
              <select value={unidadFiltro} onChange={e => setUnidadFiltro(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">Todas las unidades</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
              <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">Todas las categorías</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="ml-auto">
                <button onClick={() => setModal({})}
                  className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
                  + Nuevo registro
                </button>
              </div>
            </div>

            {/* Tabla de registros */}
            {loading ? <p className="text-gray-400">Cargando...</p> : (
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 text-xs">
                        <th className="px-4 py-3 text-left">Fecha</th>
                        <th className="px-4 py-3 text-left">Unidad</th>
                        <th className="px-4 py-3 text-left">Categoría</th>
                        <th className="px-4 py-3 text-left">Detalles</th>
                        <th className="px-4 py-3 text-right">Km</th>
                        <th className="px-4 py-3 text-right">Costo</th>
                        <th className="px-4 py-3 text-left">Taller</th>
                        <th className="px-4 py-3 text-left">Recomendaciones</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrosFiltrados.length === 0 ? (
                        <tr><td colSpan={9} className="text-center text-gray-500 py-12">No hay registros</td></tr>
                      ) : registrosFiltrados.map((r, i) => {
                        const catColor = CAT_COLOR[r.categoria] || 'bg-gray-700 text-gray-300'
                        return (
                          <tr key={r.id} className={`border-b border-gray-800 hover:bg-gray-800/50 ${i % 2 === 0 ? '' : 'bg-gray-950'}`}>
                            <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">{formatFecha(r.fecha)}</td>
                            <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{unidades.find((u:any) => u.id === r.unidad_id)?.nombre || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>{r.categoria}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-300 text-xs max-w-xs">
                              <div className="line-clamp-2">{r.detalles}</div>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-400 text-xs whitespace-nowrap">
                              {r.kilometraje ? r.kilometraje.toLocaleString() : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-green-400 text-xs whitespace-nowrap">
                              {r.costo ? `$${parseFloat(r.costo).toLocaleString()}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs max-w-[120px]">
                              <div className="truncate">{r.taller_mecanico || '—'}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs max-w-[150px]">
                              <div className="line-clamp-2">{r.recomendaciones || '—'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={() => setModal(r)} className="text-gray-500 hover:text-indigo-400 text-xs">✏️</button>
                                <button onClick={() => eliminar(r.id)} className="text-gray-500 hover:text-red-400 text-xs">🗑</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* VISTA KILÓMETROS */}
        {vista === 'kilometros' && (
          <>
            {/* Dashboard de unidades */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {dashboard.map(u => (
                <div key={u.id} className={`bg-gray-900 rounded-xl p-4 border ${
                  u.alerta === 'rojo' ? 'border-red-600' :
                  u.alerta === 'naranja' ? 'border-orange-500' :
                  u.alerta === 'amarillo' ? 'border-yellow-500' :
                  'border-gray-800'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-white">{u.nombre}</span>
                    {u.alerta === 'rojo' && <span className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded-full">🔴 Urgente</span>}
                    {u.alerta === 'naranja' && <span className="text-xs bg-orange-900 text-orange-200 px-2 py-0.5 rounded-full">🟠 Próximo</span>}
                    {u.alerta === 'amarillo' && <span className="text-xs bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded-full">🟡 Atención</span>}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Km actual</span>
                      <span className="font-medium text-white">{u.kmActual ? u.kmActual.toLocaleString() : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Último servicio</span>
                      <span className="text-gray-300 text-xs">{u.ultimoServicio ? `${u.ultimoServicio.kilometraje?.toLocaleString()} km` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Próximo servicio</span>
                      <span className="text-gray-300 text-xs">{u.kmSiguiente ? `${u.kmSiguiente.toLocaleString()} km` : '—'}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-800 pt-2">
                      <span className="text-gray-400">Km restantes</span>
                      <span className={`font-bold ${
                        u.alerta === 'rojo' ? 'text-red-400' :
                        u.alerta === 'naranja' ? 'text-orange-400' :
                        u.alerta === 'amarillo' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {u.kmRestantes !== null ? u.kmRestantes.toLocaleString() : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Intervalo</span>
                      <span className="text-gray-500 text-xs">c/ {u.intervalo.toLocaleString()} km</span>
                    </div>
                    {u.ultimoKm && (
                      <div className="text-xs text-gray-600 text-right">
                        Actualizado: {formatFecha(u.ultimoKm.fecha)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Formulario para registrar nuevo kilometraje */}
            <div className="bg-gray-900 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">📍 Registrar kilometraje</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Unidad</label>
                  <select value={kmForm.unidad_id} onChange={e => setKmForm({...kmForm, unidad_id: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                    <option value="">— Seleccionar —</option>
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Kilometraje</label>
                  <input type="number" placeholder="ej. 150000" value={kmForm.kilometraje}
                    onChange={e => setKmForm({...kmForm, kilometraje: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Fecha</label>
                  <input type="date" value={kmForm.fecha}
                    onChange={e => setKmForm({...kmForm, fecha: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Notas</label>
                  <input type="text" placeholder="Opcional" value={kmForm.notas}
                    onChange={e => setKmForm({...kmForm, notas: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <button onClick={guardarKm} disabled={guardandoKm}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {guardandoKm ? 'Guardando...' : '💾 Guardar kilometraje'}
              </button>
            </div>

            {/* Historial de kilometrajes */}
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300">Historial de kilometrajes</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs">
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Unidad</th>
                    <th className="px-4 py-3 text-right">Kilometraje</th>
                    <th className="px-4 py-3 text-left">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {kmRegistros.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-gray-500 py-8">No hay registros</td></tr>
                  ) : kmRegistros.slice(0, 30).map((k, i) => (
                    <tr key={k.id} className={`border-b border-gray-800 ${i % 2 === 0 ? '' : 'bg-gray-950'}`}>
                      <td className="px-4 py-2 text-gray-300 text-xs">{formatFecha(k.fecha)}</td>
                      <td className="px-4 py-2 font-medium">{unidades.find((u:any) => u.id === k.unidad_id)?.nombre || '—'}</td>
                      <td className="px-4 py-2 text-right font-bold text-green-400">{k.kilometraje?.toLocaleString()}</td>
                      <td className="px-4 py-2 text-gray-400 text-xs">{k.notas || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modal !== null && (
        <ModalRegistro
          unidades={unidades}
          registro={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); cargar() }}
        />
      )}
    </div>
  )
}