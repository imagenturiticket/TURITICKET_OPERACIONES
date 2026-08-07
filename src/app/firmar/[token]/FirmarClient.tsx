'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { CATEGORIA_LABEL, formatFecha, formatFechaHora, calcularHash } from '@/lib/categoriasPersonal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function FirmarClient({ token }: { token: string }) {
  const [registro, setRegistro] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [acepto, setAcepto] = useState(false)
  const [haDibujado, setHaDibujado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [firmadoAhora, setFirmadoAhora] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dibujandoRef = useRef(false)

  useEffect(() => { cargar() }, [token])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('bitacora_personal')
      .select('*, operadores(nombre)')
      .eq('token', token)
      .single()
    if (!data) {
      setNotFound(true)
    } else {
      setRegistro(data)
    }
    setLoading(false)
  }

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

  function limpiar() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHaDibujado(false)
  }

  async function firmar() {
    if (!acepto || !haDibujado || !registro) return
    setGuardando(true)

    const canvas = canvasRef.current!
    const firmaImagen = canvas.toDataURL('image/png')
    const firmadoEn = new Date().toISOString()
    const persona = registro.tipo_persona === 'operador' ? registro.operador_id : registro.persona_oficina

    const payload = JSON.stringify({
      id: registro.id,
      fecha: registro.fecha,
      categoria: registro.categoria,
      detalles: registro.detalles,
      monto: registro.monto,
      persona,
      acepto: true,
      firma_imagen: firmaImagen,
      firmado_en: firmadoEn,
    })
    const hash = await calcularHash(payload)

    await supabase.from('bitacora_personal').update({
      firmado: true,
      firma_imagen: firmaImagen,
      firma_hash: hash,
      firmado_en: firmadoEn,
    }).eq('token', token)

    setGuardando(false)
    setFirmadoAhora(true)
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Cargando...</div>
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-sm text-center border border-gray-800">
          <p className="text-4xl mb-3">🔗</p>
          <h1 className="text-white font-semibold mb-2">Enlace no válido</h1>
          <p className="text-gray-400 text-sm">Este link no corresponde a ningún registro. Verifica que lo copiaste completo.</p>
        </div>
      </div>
    )
  }

  const persona = registro.tipo_persona === 'operador' ? (registro.operadores?.nombre || '—') : registro.persona_oficina
  const yaFirmado = registro.firmado || firmadoAhora

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800 shadow-2xl">
        <div className="text-center mb-5">
          <p className="text-xs text-gray-500">Turiticket Operaciones</p>
          <h1 className="text-white font-semibold text-lg">Aviso para {persona}</h1>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm mb-5">
          <div className="flex justify-between">
            <span className="text-gray-400">Fecha</span>
            <span className="text-white">{formatFecha(registro.fecha)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Categoría</span>
            <span className="text-white">{CATEGORIA_LABEL[registro.categoria] || registro.categoria}</span>
          </div>
          {registro.monto && (
            <div className="flex justify-between">
              <span className="text-gray-400">Monto</span>
              <span className="text-green-400 font-medium">${parseFloat(registro.monto).toLocaleString()}</span>
            </div>
          )}
          <div className="pt-2 border-t border-gray-700">
            <span className="text-gray-400 block mb-1">Detalles</span>
            <p className="text-white whitespace-pre-wrap">{registro.detalles}</p>
          </div>
        </div>

        {yaFirmado ? (
          <div className="text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-green-400 font-medium mb-1">Ya firmado</p>
            <p className="text-gray-500 text-xs mb-4">{formatFechaHora(registro.firmado_en || new Date().toISOString())}</p>
            {registro.firma_imagen && (
              <img src={registro.firma_imagen} alt="Firma" className="bg-white rounded-lg mx-auto max-w-full" />
            )}
          </div>
        ) : (
          <>
            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={acepto} onChange={e => setAcepto(e.target.checked)} className="mt-0.5" />
              <span className="text-sm text-gray-300">He leído y estoy de acuerdo con el contenido de este comunicado.</span>
            </label>

            <p className="text-xs text-gray-400 mb-1">Firma aquí:</p>
            <canvas
              ref={canvasRef}
              width={400}
              height={160}
              className="bg-white rounded-lg w-full touch-none border border-gray-700"
              style={{ touchAction: 'none' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
            <button onClick={limpiar} className="text-xs text-gray-500 hover:text-gray-300 mt-1">Limpiar firma</button>

            <button
              onClick={firmar}
              disabled={!acepto || !haDibujado || guardando}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 rounded-lg text-sm font-semibold"
            >
              {guardando ? 'Guardando...' : 'Firmar y confirmar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

