'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ESTADOS = [
  { value: 'pendiente',              label: 'Pendiente',              color: 'bg-red-900 text-red-200' },
  { value: 'pendiente_autorizacion', label: 'Pend. Autorización',     color: 'bg-yellow-900 text-yellow-200' },
  { value: 'en_proceso',             label: 'En proceso',             color: 'bg-blue-900 text-blue-200' },
  { value: 'resuelto',               label: 'Resuelto',               color: 'bg-green-900 text-green-200' },
]

const CATEGORIAS = [
  'Servicio', 'Verificación', 'Batería', 'Incidente', 'Frenos', 'Llantas',
  'Revisión', 'Reporte', 'Refacciones', 'Reparaciones', 'Alineación y Balanceo',
  'Aceite', 'Chasis', 'Fumigación', 'Golpe', 'Ponche', 'Diagnóstico', 'Otro'
]

function getEstado(value: string) {
  return ESTADOS.find(e => e.value === value) || ESTADOS[0]
}

function ModalPendiente({ unidades, pendiente, onClose, onSave }: any) {
  const [form, setForm] = useState(pendiente || {
    unidad_id: '', titulo: '', descripcion: '', estado: 'pendiente',
    resolucion_nota: '', resolucion_costo: '', resolucion_fecha: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [agregarBitacora, setAgregarBitacora] = useState(false)
  const [catBitacora, setCatBitacora] = useState('Reparaciones')

  const resolviendo = form.estado === 'resuelto'

  async function guardar() {
    if (!form.unidad_id || !form.titulo) {
      alert('Completa unidad y título')
      return
    }
    setGuardando(true)
    const data = {
      unidad_id: form.unidad_id,
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      estado: form.estado,
      resolucion_nota: resolviendo ? (form.resolucion_nota || null) : null,
      resolucion_costo: resolviendo && form.resolucion_costo ? parseFloat(form.resolucion_costo) : null,
      resolucion_fecha: resolviendo && form.resolucion_fecha ? form.resolucion_fecha : null,
    }

    if (form.id) {
      await supabase.from('pendientes_unidades').update(data).eq('id', form.id)
    } else {
      await supabase.from('pendientes_unidades').insert(data)
    }

    // Si se resuelve y quieren agregar a bitácora
    if (resolviendo && agregarBitacora && form.resolucion_nota) {
      await supabase.from('bitacora_unidades').insert({
        unidad_id: form.unidad_id,
        fecha: form.resolucion_fecha || new Date().toISOString().split('T')[0],
        categoria: catBitacora,
        detalles: `${form.titulo}${form.resolucion_nota ? '. ' + form.resolucion_nota : ''}`,
        costo: form.resolucion_costo ? parseFloat(form.resolucion_costo) : null,
      })
    }

    setGuardando(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative bg-gray-900 rounded-2xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">×</button>
        <h2 className="text-lg font-bold text-white mb-5">{form.id ? 'Editar pendiente' : 'Nuevo pendiente'}</h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Unidad *</label>
            <select value={form.unidad_id} onChange={e => setForm({...form, unidad_id: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">— Seleccionar —</option>
              {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Título *</label>
            <input type="text" placeholder="ej. Cotizar compostura de golpe" value={form.titulo}
              onChange={e => setForm({...form, titulo: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Descripción</label>
            <textarea rows={2} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Estado</label>
            <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>

          {resolviendo && (
            <div className="bg-gray-800 rounded-xl p-4 space-y-3 border border-green-800">
              <p className="text-xs text-green-400 font-medium">✅ Resolución</p>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nota de resolución</label>
                <textarea rows={2} value={form.resolucion_nota} onChange={e => setForm({...form, resolucion_nota: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Costo</label>
                  <input type="number" placeholder="$0.00" value={form.resolucion_costo}
                    onChange={e => setForm({...form, resolucion_costo: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Fecha de resolución</label>
                  <input type="date" value={form.resolucion_fecha}
                    onChange={e => setForm({...form, resolucion_fecha: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="addBitacora" checked={agregarBitacora} onChange={e => setAgregarBitacora(e.target.checked)}
                  className="rounded" />
                <label htmlFor="addBitacora" className="text-xs text-gray-300">Agregar automáticamente a la bitácora</label>
              </div>
              {agregarBitacora && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Categoría en bitácora</label>
                  <select value={catBitacora} onChange={e => setCatBitacora(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white">
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={guardar} disabled={guardando}
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex-1">
            {guardando ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear pendiente'}
          </button>
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg text-sm">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function Pendientes() {
  const [unidades, setUnidades] = useState<any[]>([])
  const [pendientes, setPendientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<any>(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroUnidad, setFiltroUnidad] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data: unis } = await supabase.from('unidades').select('*').eq('activo', true).order('nombre')
    const { data: pends } = await supabase.from('pendientes_unidades')
      .select('*, unidades(nombre)')
      .order('created_at', { ascending: false })
    if (unis) setUnidades(unis)
    if (pends) setPendientes(pends)
    setLoading(false)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este pendiente?')) return
    await supabase.from('pendientes_unidades').delete().eq('id', id)
    cargar()
  }

  const filtrados = pendientes.filter(p => {
    if (filtroEstado && p.estado !== filtroEstado) return false
    if (filtroUnidad && p.unidad_id !== filtroUnidad) return false
    return true
  })

  const conteos = ESTADOS.map(e => ({
    ...e,
    count: pendientes.filter(p => p.estado === e.value).length
  }))

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Pendientes de Unidades</h1>
            <p className="text-gray-400 text-sm">Seguimiento de tareas y reparaciones</p>
          </div>
          <button onClick={() => setModal({})}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
            + Nuevo pendiente
          </button>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {conteos.map(e => (
            <div key={e.value} className="bg-gray-900 rounded-xl p-4 cursor-pointer hover:bg-gray-800"
              onClick={() => setFiltroEstado(filtroEstado === e.value ? '' : e.value)}>
              <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-2 ${e.color}`}>{e.label}</div>
              <div className="text-2xl font-bold text-white">{e.count}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <select value={filtroUnidad} onChange={e => setFiltroUnidad(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="">Todas las unidades</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
          {(filtroEstado || filtroUnidad) && (
            <button onClick={() => { setFiltroEstado(''); setFiltroUnidad('') }}
              className="text-xs text-gray-400 hover:text-white px-3 py-2 bg-gray-800 rounded-lg">
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Lista de pendientes */}
        {loading ? <p className="text-gray-400">Cargando...</p> : (
          <div className="space-y-3">
            {filtrados.length === 0 ? (
              <div className="bg-gray-900 rounded-xl p-12 text-center text-gray-500">No hay pendientes</div>
            ) : filtrados.map(p => {
              const est = getEstado(p.estado)
              return (
                <div key={p.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${est.color}`}>{est.label}</span>
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{p.unidades?.nombre || '—'}</span>
                      </div>
                      <p className="font-medium text-white">{p.titulo}</p>
                      {p.descripcion && <p className="text-sm text-gray-400 mt-1">{p.descripcion}</p>}
                      {p.estado === 'resuelto' && p.resolucion_nota && (
                        <div className="mt-2 bg-green-950 rounded-lg p-2 text-xs text-green-300">
                          ✅ {p.resolucion_nota}
                          {p.resolucion_costo && <span className="ml-2 text-green-400 font-medium">${parseFloat(p.resolucion_costo).toLocaleString()}</span>}
                          {p.resolucion_fecha && <span className="ml-2 text-gray-500">{p.resolucion_fecha}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setModal(p)} className="text-gray-500 hover:text-indigo-400 text-sm">✏️</button>
                      <button onClick={() => eliminar(p.id)} className="text-gray-500 hover:text-red-400 text-sm">🗑</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal !== null && (
        <ModalPendiente
          unidades={unidades}
          pendiente={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); cargar() }}
        />
      )}
    </div>
  )
}