'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { TIPOS_PERMISO, TIPO_PERMISO_LABEL, formatFecha, formatFechaHora } from '@/lib/categoriasPersonal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ESTADO_COLOR: any = {
  pendiente: 'bg-yellow-900 text-yellow-300',
  aprobado: 'bg-green-900 text-green-300',
  rechazado: 'bg-red-900 text-red-300',
}

function ModalFirma({ imagen, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative bg-white rounded-2xl p-4 max-w-md" onClick={e => e.stopPropagation()}>
        <img src={imagen} alt="Firma" className="w-full" />
      </div>
    </div>
  )
}

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [comentarios, setComentarios] = useState<any>({})
  const [procesando, setProcesando] = useState<any>({})
  const [firmaVer, setFirmaVer] = useState('')
  const [revisorActual, setRevisorActual] = useState('ZEUS')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargar()
    supabase.auth.getUser().then(({ data }) => {
      const prefijo = (data?.user?.email?.split('@')[0] || '').toLowerCase()
      if (prefijo === 'juan') setRevisorActual('LIC.JUAN')
      else if (prefijo) setRevisorActual(prefijo.toUpperCase())
    })
  }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('solicitudes_permiso')
      .select('*, operadores(nombre)')
      .order('created_at', { ascending: false })
    if (data) setSolicitudes(data)
    setLoading(false)
  }

  async function decidir(s: any, aprobado: boolean) {
    setProcesando((p: any) => ({ ...p, [s.id]: true }))
    const comentario = comentarios[s.id] || ''
    const revisadoEn = new Date().toISOString()

    await supabase.from('solicitudes_permiso').update({
      estado: aprobado ? 'aprobado' : 'rechazado',
      comentario_revision: comentario || null,
      revisado_por: revisorActual,
      revisado_en: revisadoEn,
    }).eq('id', s.id)

    // Reflejar automáticamente en Asignaciones si es día de descanso o falta de un operador aprobado
    if (aprobado && s.tipo_persona === 'operador' && (s.tipo_permiso === 'dia_descanso' || s.tipo_permiso === 'falta') && !s.reflejado_asignacion) {
      await supabase.from('asignaciones').insert({
        fecha: s.fecha_permiso,
        operador_id: s.operador_id,
        unidad_id: null,
        tipo: 'local',
        destino: s.tipo_permiso === 'dia_descanso' ? 'DESCANSO' : 'FALTA',
        pax: null,
        hora_inicio: null,
        hora_fin: null,
        nota: s.motivo || null,
      })
      await supabase.from('solicitudes_permiso').update({ reflejado_asignacion: true }).eq('id', s.id)
    }

    try {
      const nombre = s.tipo_persona === 'operador' ? s.operadores?.nombre : s.persona_oficina
      await fetch('/api/enviar-permiso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: s.correo,
          nombre,
          aprobado,
          tipoPermisoLabel: TIPO_PERMISO_LABEL[s.tipo_permiso] || s.tipo_permiso,
          fecha: formatFecha(s.fecha_permiso),
          comentario,
        }),
      })
    } catch {
      // Si falla el correo, la decisión ya quedó guardada
    }

    setProcesando((p: any) => ({ ...p, [s.id]: false }))
    setMensaje(aprobado ? '✓ Solicitud aprobada y notificada' : '✓ Solicitud rechazada y notificada')
    setTimeout(() => setMensaje(''), 3000)
    cargar()
  }

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente')
  const resueltas = solicitudes.filter(s => s.estado !== 'pendiente')

  function Fila({ s }: any) {
    const persona = s.tipo_persona === 'operador' ? (s.operadores?.nombre || '—') : s.persona_oficina
    return (
      <div className="bg-gray-900 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{persona}</span>
            <span className="text-[10px] text-gray-500">{s.tipo_persona === 'operador' ? 'Operador' : 'Oficina'}</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[s.estado]}`}>{s.estado}</span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-2">
          <span>📅 {formatFecha(s.fecha_permiso)}</span>
          <span>🏷️ {TIPO_PERMISO_LABEL[s.tipo_permiso] || s.tipo_permiso}</span>
          <span>✉️ {s.correo}</span>
        </div>
        <p className="text-sm text-gray-200 mb-2">{s.motivo}</p>
        <button onClick={() => setFirmaVer(s.firma_imagen)} className="text-xs text-indigo-400 hover:text-indigo-300 mb-2">
          🖋️ Ver firma
        </button>

        {s.estado === 'pendiente' ? (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              placeholder="Comentario (opcional)"
              value={comentarios[s.id] || ''}
              onChange={e => setComentarios((c: any) => ({ ...c, [s.id]: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => decidir(s, true)}
                disabled={procesando[s.id]}
                className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-medium"
              >
                ✅ Aprobar
              </button>
              <button
                onClick={() => decidir(s, false)}
                disabled={procesando[s.id]}
                className="flex-1 bg-red-800 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-medium"
              >
                ❌ Rechazar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-gray-500 mt-1">
            {s.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'} por {s.revisado_por} — {formatFechaHora(s.revisado_en)}
            {s.comentario_revision && <span className="block mt-0.5">"{s.comentario_revision}"</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">📝 Solicitudes de Permiso</h1>
          <p className="text-gray-400 text-sm">Revisadas y aprobadas por Zeus, Lic. Juan o Ama</p>
        </div>

        {mensaje && <p className="text-sm text-yellow-400 mb-3">{mensaje}</p>}

        {loading ? <p className="text-gray-400">Cargando...</p> : (
          <>
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Pendientes ({pendientes.length})</h2>
            <div className="space-y-3 mb-8">
              {pendientes.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay solicitudes pendientes 🎉</p>
              ) : pendientes.map(s => <Fila key={s.id} s={s} />)}
            </div>

            <h2 className="text-sm font-semibold text-gray-300 mb-3">Historial</h2>
            <div className="space-y-3">
              {resueltas.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin historial todavía</p>
              ) : resueltas.map(s => <Fila key={s.id} s={s} />)}
            </div>
          </>
        )}
      </div>

      {firmaVer && <ModalFirma imagen={firmaVer} onClose={() => setFirmaVer('')} />}
    </div>
  )
}

