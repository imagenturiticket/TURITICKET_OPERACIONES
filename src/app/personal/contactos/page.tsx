'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { OFICINA_PERSONAS } from '@/lib/categoriasPersonal'

const supabase = createClient()

type Operador = { id: string; nombre: string; correo: string | null }

function correoValido(c: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)
}

export default function Contactos() {
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [oficina, setOficina] = useState<Record<string, string>>({})
  const [borradorOp, setBorradorOp] = useState<Record<string, string>>({})
  const [borradorOf, setBorradorOf] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState<string>('')
  const [guardado, setGuardado] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const [{ data: ops }, { data: correos }] = await Promise.all([
      supabase.from('operadores').select('id, nombre, correo').eq('activo', true).order('nombre'),
      supabase.from('personal_oficina_correos').select('persona, correo'),
    ])

    const listaOps = (ops || []) as Operador[]
    setOperadores(listaOps)
    setBorradorOp(Object.fromEntries(listaOps.map((o) => [o.id, o.correo || ''])))

    const mapa: Record<string, string> = {}
    ;(correos || []).forEach((c: { persona: string; correo: string | null }) => {
      mapa[c.persona] = c.correo || ''
    })
    setOficina(mapa)

    // Se juntan las personas de la lista fija con cualquier otra
    // que ya exista guardada en la tabla, para no perder ninguna.
    const todas = Array.from(new Set([...OFICINA_PERSONAS, ...Object.keys(mapa)]))
    setBorradorOf(Object.fromEntries(todas.map((p) => [p, mapa[p] || ''])))

    setCargando(false)
  }

  function avisoGuardado(clave: string) {
    setGuardado(clave)
    setTimeout(() => setGuardado(''), 2500)
  }

  async function guardarOperador(op: Operador) {
    const correo = (borradorOp[op.id] || '').trim()
    if (correo && !correoValido(correo)) {
      setError(`El correo de ${op.nombre} no parece válido.`)
      setTimeout(() => setError(''), 4000)
      return
    }
    setError('')
    setGuardando(op.id)
    const { error: err } = await supabase
      .from('operadores')
      .update({ correo: correo || null })
      .eq('id', op.id)
    setGuardando('')
    if (err) {
      setError(`No se pudo guardar el correo de ${op.nombre}.`)
      setTimeout(() => setError(''), 4000)
      return
    }
    setOperadores((prev) =>
      prev.map((o) => (o.id === op.id ? { ...o, correo: correo || null } : o))
    )
    avisoGuardado(op.id)
  }

  async function guardarOficina(persona: string) {
    const correo = (borradorOf[persona] || '').trim()
    if (correo && !correoValido(correo)) {
      setError(`El correo de ${persona} no parece válido.`)
      setTimeout(() => setError(''), 4000)
      return
    }
    setError('')
    setGuardando(persona)
    const { error: err } = await supabase
      .from('personal_oficina_correos')
      .upsert({ persona, correo: correo || null })
    setGuardando('')
    if (err) {
      setError(`No se pudo guardar el correo de ${persona}.`)
      setTimeout(() => setError(''), 4000)
      return
    }
    setOficina((prev) => ({ ...prev, [persona]: correo }))
    avisoGuardado(persona)
  }

  const personasOficina = Object.keys(borradorOf).sort()

  const totalPersonas = operadores.length + personasOficina.length
  const conCorreo =
    operadores.filter((o) => o.correo).length +
    personasOficina.filter((p) => oficina[p]).length
  const sinCorreo = totalPersonas - conCorreo

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-6">
          <a href="/personal" className="text-xs text-gray-500 hover:text-indigo-400">
            ← Volver a Bitácora de Personal
          </a>
          <h1 className="text-2xl font-semibold mt-2">📇 Contactos</h1>
          <p className="text-gray-400 text-sm">
            Correos para las notificaciones de firmas y permisos
          </p>
        </div>

        {!cargando && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{totalPersonas}</p>
              <p className="text-[11px] text-gray-400">Personas</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{conCorreo}</p>
              <p className="text-[11px] text-gray-400">Con correo</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-500">{sinCorreo}</p>
              <p className="text-[11px] text-gray-400">Sin correo</p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {cargando ? (
          <p className="text-gray-400">Cargando...</p>
        ) : (
          <>
            {/* ---------- OFICINA ---------- */}
            <div className="bg-gray-900 rounded-xl p-4 mb-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">
                Oficina <span className="text-gray-600 font-normal">({personasOficina.length})</span>
              </h2>
              <div className="space-y-2">
                {personasOficina.map((persona) => (
                  <div key={persona} className="flex flex-wrap gap-2 items-center">
                    <span className="w-28 shrink-0 text-sm text-gray-200">{persona}</span>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={borradorOf[persona] || ''}
                      onChange={(e) =>
                        setBorradorOf({ ...borradorOf, [persona]: e.target.value })
                      }
                      onKeyDown={(e) => { if (e.key === 'Enter') guardarOficina(persona) }}
                      className="flex-1 min-w-[180px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
                    />
                    <button
                      onClick={() => guardarOficina(persona)}
                      disabled={guardando === persona}
                      className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs shrink-0 w-20"
                    >
                      {guardando === persona
                        ? '...'
                        : guardado === persona
                        ? '✓ Listo'
                        : 'Guardar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ---------- OPERADORES ---------- */}
            <div className="bg-gray-900 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">
                Operadores <span className="text-gray-600 font-normal">({operadores.length})</span>
              </h2>
              {operadores.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No hay operadores activos</p>
              ) : (
                <div className="space-y-2">
                  {operadores.map((op) => (
                    <div key={op.id} className="flex flex-wrap gap-2 items-center">
                      <span className="w-28 shrink-0 text-sm text-gray-200">{op.nombre}</span>
                      <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={borradorOp[op.id] || ''}
                        onChange={(e) =>
                          setBorradorOp({ ...borradorOp, [op.id]: e.target.value })
                        }
                        onKeyDown={(e) => { if (e.key === 'Enter') guardarOperador(op) }}
                        className="flex-1 min-w-[180px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
                      />
                      <button
                        onClick={() => guardarOperador(op)}
                        disabled={guardando === op.id}
                        className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs shrink-0 w-20"
                      >
                        {guardando === op.id
                          ? '...'
                          : guardado === op.id
                          ? '✓ Listo'
                          : 'Guardar'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[11px] text-gray-600 mt-4">
              Quien no tenga correo guardado no recibirá avisos de firma ni de permisos.
              Puedes dejar un campo vacío para borrar un correo.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
