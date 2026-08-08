'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { OFICINA_PERSONAS, TIPOS_PERMISO, calcularHash } from '@/lib/categoriasPersonal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SolicitudPermiso() {
  const [operadores, setOperadores] = useState<any[]>([])
  const [cargandoOps, setCargandoOps] = useState(true)

  const [tipoPersona, setTipoPersona] = useState<'operador' | 'oficina'>('operador')
  const [operadorId, setOperadorId] = useState('')
  const [personaOficina, setPersonaOficina] = useState('')
  const [oficinaOtro, setOficinaOtro] = useState('')
  const [correo, setCorreo] = useState('')
  const [tipoPermiso, setTipoPermiso] = useState('')
  const [fechaPermiso, setFechaPermiso] = useState('')
  const [motivo, setMotivo] = useState('')
  const [acepto, setAcepto] = useState(false)
  const [haDibujado, setHaDibujado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dibujandoRef = useRef(false)

  useEffect(() => {
    supabase.from('operadores').select('*').eq('activo', true).order('nombre').then(({ data }) => {
      if (data) setOperadores(data)
      setCargandoOps(false)
    })
  }, [])

  function posicion(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    dibujandoRef.current = true
    const { x, y } = posicion(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    canvas.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujandoRef.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const { x, y } = posicion(e)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111827'
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!haDibujado) setHaDibujado(true)
  }

  function onPointerUp() {
    dibujandoRef.current = false
  }

  function limpiarFirma() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHaDibujado(false)
  }

  const personaOficinaKey = personaOficina === 'OTRO' ? oficinaOtro.trim().toUpperCase() : personaOficina

  function validar() {
    if (tipoPersona === 'operador' && !operadorId) return 'Selecciona tu nombre'
    if (tipoPersona === 'oficina' && !personaOficinaKey) return 'Selecciona tu nombre'
    if (!correo.trim()) return 'Escribe tu correo electrónico'
    if (!tipoPermiso) return 'Selecciona el tipo de permiso'
    if (!fechaPermiso) return 'Selecciona la fecha'
    if (!motivo.trim()) return 'Escribe el motivo'
    if (!acepto) return 'Debes aceptar la declaración antes de firmar'
    if (!haDibujado) return 'Falta tu firma'
    return ''
  }

  async function enviar() {
    const err = validar()
    if (err) {
      setError(err)
      setTimeout(() => setError(''), 3500)
      return
    }
    setEnviando(true)

    const canvas = canvasRef.current!
    const firmaImagen = canvas.toDataURL('image/png')
    const operadorNombre = operadores.find(o => o.id === operadorId)?.nombre

    const payload = JSON.stringify({
      tipoPersona, persona: tipoPersona === 'operador' ? operadorId : personaOficinaKey,
      correo, tipoPermiso, fechaPermiso, motivo, acepto: true, firmaImagen,
    })
    const hash = await calcularHash(payload)

    const { error: dbError } = await supabase.from('solicitudes_permiso').insert({
      tipo_persona: tipoPersona,
      operador_id: tipoPersona === 'operador' ? operadorId : null,
      persona_oficina: tipoPersona === 'oficina' ? personaOficinaKey : null,
      correo: correo.trim(),
      tipo_permiso: tipoPermiso,
      fecha_permiso: fechaPermiso,
      motivo: motivo.trim(),
      firma_imagen: firmaImagen,
      firma_hash: hash,
      estado: 'pendiente',
    })

    setEnviando(false)
    if (dbError) {
      setError('Ocurrió un error al enviar. Intenta de nuevo.')
      setTimeout(() => setError(''), 4000)
      return
    }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-sm text-center border border-gray-800">
          <p className="text-4xl mb-3">✅</p>
          <h1 className="text-white font-semibold mb-2">Solicitud enviada</h1>
          <p className="text-gray-400 text-sm">Tu solicitud fue recibida y firmada correctamente. Te avisaremos por correo en cuanto sea revisada.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800 shadow-2xl">
        <div className="text-center mb-5">
          <p className="text-xs text-gray-500">Turiticket Operaciones</p>
          <h1 className="text-white font-semibold text-lg">Solicitud de Permiso</h1>
          <p className="text-gray-500 text-xs mt-1">Llena tus datos y firma al final — no necesitas imprimir nada.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">¿Eres operador o de oficina? *</label>
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
            <div>
              <label className="text-xs text-gray-400 block mb-1">Tu nombre *</label>
              <select value={operadorId} onChange={e => setOperadorId(e.target.value)} disabled={cargandoOps}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">{cargandoOps ? 'Cargando...' : '— Seleccionar —'}</option>
                {operadores.map((o: any) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Tu nombre *</label>
              <select value={personaOficina} onChange={e => setPersonaOficina(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">— Seleccionar —</option>
                {OFICINA_PERSONAS.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="OTRO">Otro</option>
              </select>
              {personaOficina === 'OTRO' && (
                <input type="text" placeholder="Tu nombre" value={oficinaOtro} onChange={e => setOficinaOtro(e.target.value)}
                  className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
              )}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 block mb-1">Tu correo electrónico *</label>
            <input type="email" placeholder="correo@ejemplo.com" value={correo} onChange={e => setCorreo(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <p className="text-[11px] text-gray-500 mt-1">Aquí te avisaremos si tu solicitud fue aprobada o rechazada.</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Tipo de permiso *</label>
            <select value={tipoPermiso} onChange={e => setTipoPermiso(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">— Seleccionar —</option>
              {TIPOS_PERMISO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Fecha *</label>
            <input type="date" value={fechaPermiso} onChange={e => setFechaPermiso(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Motivo *</label>
            <textarea rows={3} value={motivo} onChange={e => setMotivo(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none" />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={acepto} onChange={e => setAcepto(e.target.checked)} className="mt-0.5" />
            <span className="text-sm text-gray-300">Declaro que la información anterior es verdadera y solicito el permiso descrito.</span>
          </label>

          <div>
            <p className="text-xs text-gray-400 mb-1">Firma aquí *</p>
            <canvas
              ref={canvasRef}
              width={400}
              height={140}
              className="bg-white rounded-lg w-full touch-none border border-gray-700"
              style={{ touchAction: 'none' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
            <button onClick={limpiarFirma} className="text-xs text-gray-500 hover:text-gray-300 mt-1">Limpiar firma</button>
          </div>

          {error && <p className="text-xs text-red-400">⚠️ {error}</p>}

          <button
            onClick={enviar}
            disabled={enviando}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 px-5 py-3 rounded-lg text-sm font-semibold"
          >
            {enviando ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      </div>
    </div>
  )
}

