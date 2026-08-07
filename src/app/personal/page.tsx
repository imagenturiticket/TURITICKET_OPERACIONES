'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { OFICINA_PERSONAS, OPCIONES_REPORTA, CATEGORIAS_PERSONAL, CATEGORIA_LABEL, CATEGORIA_COLOR, formatFecha, formatFechaHora } from '@/lib/categoriasPersonal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function ModalRegistro({ operadores, correosOficina, onClose, onSave }: any) {
  const [tipoPersona, setTipoPersona] = useState<'operador' | 'oficina'>('operador')
  const [operadorId, setOperadorId] = useState('')
  const [personaOficina, setPersonaOficina] = useState('')
  const [oficinaOtro, setOficinaOtro] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [categoria, setCategoria] = useState('')
  const [detalles, setDetalles] = useState('')
  const [monto, setMonto] = useState('')
  const [reportaTipo, setReportaTipo] = useState('')
  const [reportaOperador, setReportaOperador] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  // Correo del operador seleccionado (para poder editarlo si falta)
  const operadorSel = operadores.find((o: any) => o.id === operadorId)
  const [correoEdit, setCorreoEdit] = useState('')

  useEffect(() => {
    setCorreoEdit(operadorSel?.correo || '')
  }, [operadorId])

  // Correo de la persona de oficina seleccionada
  const personaOficinaKey = personaOficina === 'OTRO' ? oficinaOtro.trim().toUpperCase() : personaOficina
  const [correoOficinaEdit, setCorreoOficinaEdit] = useState('')

  useEffect(() => {
    setCorreoOficinaEdit(correosOficina[personaOficinaKey] || '')
  }, [personaOficinaKey])

  async function guardarCorreo() {
    if (!operadorId || !correoEdit.trim()) return
    await supabase.from('operadores').update({ correo: correoEdit.trim() }).eq('id', operadorId)
    operadorSel.correo = correoEdit.trim()
    setMensaje('✓ Correo guardado')
    setTimeout(() => setMensaje(''), 2500)
  }

  async function guardarCorreoOficina() {
    if (!personaOficinaKey || !correoOficinaEdit.trim()) return
    await supabase.from('personal_oficina_correos').upsert({ persona: personaOficinaKey, correo: correoOficinaEdit.trim() })
    correosOficina[personaOficinaKey] = correoOficinaEdit.trim()
    setMensaje('✓ Correo guardado')
    setTimeout(() => setMensaje(''), 2500)
  }

  async function guardar() {
    const personaOk = tipoPersona === 'operador'
      ? !!operadorId
      : !!(personaOficina && (personaOficina !== 'OTRO' || oficinaOtro.trim()))
    if (!personaOk || !fecha || !categoria || !detalles.trim()) {
      setMensaje('⚠️ Completa persona, fecha, categoría y detalles')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    if (!reportaTipo || (reportaTipo === 'OPERADOR' && !reportaOperador)) {
      setMensaje('⚠️ Indica quién reporta')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    setGuardando(true)

    const reporta = reportaTipo === 'OPERADOR' ? reportaOperador : reportaTipo
    const personaOficinaFinal = tipoPersona === 'oficina'
      ? (personaOficina === 'OTRO' ? oficinaOtro.trim().toUpperCase() : personaOficina)
      : null
    const token = crypto.randomUUID()

    const { data: inserted, error } = await supabase.from('bitacora_personal').insert({
      fecha,
      tipo_persona: tipoPersona,
      operador_id: tipoPersona === 'operador' ? operadorId : null,
      persona_oficina: personaOficinaFinal,
      categoria,
      detalles: detalles.trim(),
      monto: categoria === 'prestamo' && monto ? parseFloat(monto) : null,
      reporta,
      token,
      firmado: false,
      email_enviado: false,
    }).select().single()

    if (error || !inserted) {
      setMensaje('⚠️ Error al guardar')
      setGuardando(false)
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    // Notificación por correo si hay un correo guardado (operador u oficina)
    const correoDestino = tipoPersona === 'operador' ? operadorSel?.correo : correoOficinaEdit
    const nombreDestino = tipoPersona === 'operador' ? operadorSel?.nombre : personaOficinaFinal
    if (correoDestino) {
      try {
        const link = `${window.location.origin}/firmar/${token}`
        await fetch('/api/enviar-firma', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: correoDestino,
            nombre: nombreDestino,
            categoria: CATEGORIA_LABEL[categoria] || categoria,
            link,
          }),
        })
        await supabase.from('bitacora_personal').update({ email_enviado: true }).eq('id', inserted.id)
      } catch {
        // Si falla el correo, el registro ya quedó guardado; se puede reenviar/copiar el link después
      }
    }

    setGuardando(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative bg-gray-900 rounded-2xl p-6 w-full max-w-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">×</button>
        <h2 className="text-lg font-bold text-white mb-5">Nuevo registro</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Tipo de persona *</label>
            <div className="flex gap-2">
              <button onClick={() => setTipoPersona('operador')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${tipoPersona === 'operador' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                Operador
              </button>
              <button onClick={() => setTipoPersona('oficina')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${tipoPersona === 'oficina' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                Oficina
              </button>
            </div>
          </div>

          {tipoPersona === 'operador' ? (
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Operador *</label>
              <select value={operadorId} onChange={e => setOperadorId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">— Seleccionar —</option>
                {operadores.map((o: any) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </select>
              {operadorId && (
                <div className="mt-2 flex gap-2 items-center">
                  <input type="email" placeholder="correo@ejemplo.com" value={correoEdit} onChange={e => setCorreoEdit(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                  <button onClick={guardarCorreo} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-xs shrink-0">
                    Guardar correo
                  </button>
                </div>
              )}
              {operadorId && !operadorSel?.correo && !correoEdit && (
                <p className="text-[11px] text-yellow-500 mt-1">⚠️ Sin correo guardado — no se le podrá notificar automáticamente.</p>
              )}
            </div>
          ) : (
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Persona de oficina *</label>
              <select value={personaOficina} onChange={e => setPersonaOficina(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">— Seleccionar —</option>
                {OFICINA_PERSONAS.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="OTRO">Otro</option>
              </select>
              {personaOficina === 'OTRO' && (
                <input type="text" placeholder="Nombre" value={oficinaOtro} onChange={e => setOficinaOtro(e.target.value)}
                  className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
              )}
              {personaOficinaKey && (
                <div className="mt-2 flex gap-2 items-center">
                  <input type="email" placeholder="correo@ejemplo.com" value={correoOficinaEdit} onChange={e => setCorreoOficinaEdit(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                  <button onClick={guardarCorreoOficina} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-xs shrink-0">
                    Guardar correo
                  </button>
                </div>
              )}
              {personaOficinaKey && !correosOficina[personaOficinaKey] && !correoOficinaEdit && (
                <p className="text-[11px] text-yellow-500 mt-1">⚠️ Sin correo guardado — no se le podrá notificar automáticamente por correo (sí verá el aviso al iniciar sesión).</p>
              )}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 block mb-1">Fecha *</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Categoría *</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">— Seleccionar —</option>
              {CATEGORIAS_PERSONAL.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {categoria === 'prestamo' && (
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Monto del préstamo</label>
              <input type="number" placeholder="$0.00" value={monto} onChange={e => setMonto(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
          )}

          <div className="col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Detalles *</label>
            <textarea rows={3} value={detalles} onChange={e => setDetalles(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none" />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Reporta *</label>
            <select value={reportaTipo} onChange={e => { setReportaTipo(e.target.value); if (e.target.value !== 'OPERADOR') setReportaOperador('') }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">— Seleccionar —</option>
              {OPCIONES_REPORTA.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {reportaTipo === 'OPERADOR' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">¿Cuál operador? *</label>
              <select value={reportaOperador} onChange={e => setReportaOperador(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">— Seleccionar —</option>
                {operadores.map((o: any) => <option key={o.id} value={o.nombre}>{o.nombre}</option>)}
              </select>
            </div>
          )}
        </div>

        {mensaje && <p className="text-xs text-yellow-400 mt-3">{mensaje}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={guardar} disabled={guardando}
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex-1">
            {guardando ? 'Guardando...' : 'Guardar registro'}
          </button>
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg text-sm">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function BitacoraPersonal() {
  const [operadores, setOperadores] = useState<any[]>([])
  const [correosOficina, setCorreosOficina] = useState<any>({})
  const [registros, setRegistros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [copiadoId, setCopiadoId] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data: ops } = await supabase.from('operadores').select('*').eq('activo', true).order('nombre')
    const { data: correos } = await supabase.from('personal_oficina_correos').select('*')
    const { data: regs } = await supabase.from('bitacora_personal').select('*, operadores(nombre, correo)').order('fecha', { ascending: false })
    if (ops) setOperadores(ops)
    if (correos) setCorreosOficina(Object.fromEntries(correos.map((c: any) => [c.persona, c.correo])))
    if (regs) setRegistros(regs)
    setLoading(false)
  }

  async function eliminar(r: any) {
    const advertencia = r.firmado
      ? '⚠️ Este registro YA FUE FIRMADO. ¿Seguro que quieres eliminarlo?'
      : '¿Eliminar este registro?'
    if (!confirm(advertencia)) return
    await supabase.from('bitacora_personal').delete().eq('id', r.id)
    cargar()
  }

  async function copiarLink(token: string, id: string) {
    const link = `${window.location.origin}/firmar/${token}`
    await navigator.clipboard.writeText(link)
    setCopiadoId(id)
    setTimeout(() => setCopiadoId(''), 2000)
  }

  async function reenviarCorreo(r: any) {
    const correo = r.tipo_persona === 'operador' ? r.operadores?.correo : correosOficina[r.persona_oficina]
    const nombre = r.tipo_persona === 'operador' ? r.operadores?.nombre : r.persona_oficina
    if (!correo) {
      setMensaje('⚠️ Esta persona no tiene correo guardado')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    const link = `${window.location.origin}/firmar/${r.token}`
    await fetch('/api/enviar-firma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: correo,
        nombre,
        categoria: CATEGORIA_LABEL[r.categoria] || r.categoria,
        link,
      }),
    })
    await supabase.from('bitacora_personal').update({ email_enviado: true }).eq('id', r.id)
    setMensaje('✓ Correo reenviado')
    setTimeout(() => setMensaje(''), 3000)
    cargar()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">🗂️ Bitácora de Personal</h1>
            <p className="text-gray-400 text-sm">Registro y seguimiento de personal — oficina y operadores</p>
          </div>
          <button onClick={() => setModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
            + Nuevo registro
          </button>
        </div>

        {mensaje && <p className="text-sm text-yellow-400 mb-3">{mensaje}</p>}

        {loading ? <p className="text-gray-400">Cargando...</p> : (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs">
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Persona</th>
                    <th className="px-4 py-3 text-left">Categoría</th>
                    <th className="px-4 py-3 text-left">Detalles</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-left">Reporta</th>
                    <th className="px-4 py-3 text-left">Firma</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {registros.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-gray-500 py-12">No hay registros</td></tr>
                  ) : registros.map((r, i) => {
                    const persona = r.tipo_persona === 'operador' ? (r.operadores?.nombre || '—') : r.persona_oficina
                    const catColor = CATEGORIA_COLOR[r.categoria] || 'bg-gray-700 text-gray-300'
                    return (
                      <tr key={r.id} className={`border-b border-gray-800 hover:bg-gray-800/50 ${i % 2 === 0 ? '' : 'bg-gray-950'}`}>
                        <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">{formatFecha(r.fecha)}</td>
                        <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                          {persona}
                          <span className="block text-[10px] text-gray-500 font-normal">{r.tipo_persona === 'operador' ? 'Operador' : 'Oficina'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>{CATEGORIA_LABEL[r.categoria] || r.categoria}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-xs max-w-xs">
                          <div className="line-clamp-2">{r.detalles}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-green-400 text-xs whitespace-nowrap">
                          {r.monto ? `$${parseFloat(r.monto).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{r.reporta || '—'}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {r.firmado ? (
                            <span className="text-green-400">✅ {formatFechaHora(r.firmado_en)}</span>
                          ) : (
                            <span className="text-yellow-500">⏳ Pendiente</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 items-center whitespace-nowrap">
                            {!r.firmado && (
                              <>
                                <button onClick={() => copiarLink(r.token, r.id)} className="text-gray-500 hover:text-indigo-400 text-xs" title="Copiar link de firma">
                                  {copiadoId === r.id ? '✓ Copiado' : '🔗'}
                                </button>
                                <button onClick={() => reenviarCorreo(r)} className="text-gray-500 hover:text-indigo-400 text-xs" title="Reenviar correo">
                                  ✉️
                                </button>
                              </>
                            )}
                            <button onClick={() => eliminar(r)} className="text-gray-500 hover:text-red-400 text-xs">🗑</button>
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
      </div>

      {modal && (
        <ModalRegistro
          operadores={operadores}
          correosOficina={correosOficina}
          onClose={() => setModal(false)}
          onSave={() => { setModal(false); cargar() }}
        />
      )}
    </div>
  )
}