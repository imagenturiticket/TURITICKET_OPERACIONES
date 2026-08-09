'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

// Correos con acceso a la sección restringida (Bitácora de Personal y
// Solicitudes de Permiso). Se aceptan tanto las cuentas @turiticket.com
// como los correos personales de Gmail.
const ACCESO_PERSONAL = [
  'zeus@turiticket.com',
  'juan@turiticket.com',
  'ama@turiticket.com',
  'imagen.turiticket@gmail.com',
  'gerencia.turiticket@gmail.com',
  'juan.hughes.mendoza@gmail.com',
]

// Minutos de inactividad antes de cerrar la sesión
const MINUTOS_INACTIVIDAD = 30
// Segundos de aviso previo antes del cierre
const SEGUNDOS_AVISO = 60

const nav = [
  { href: '/',            icon: '📋', label: 'Asignaciones'   },
  { href: '/historial',   icon: '📅', label: 'Historial'      },
  { href: '/graficas',    icon: '📊', label: 'Gráficas'       },
  { href: '/reportes',    icon: '🚨', label: 'Reportes'       },
  { href: '/importar',    icon: '📥', label: 'Importar datos' },
  { href: '/calculadora', icon: '💰', label: 'Calculadora'    },
  { href: '/vacaciones',  icon: '🏖️', label: 'Vacaciones'    },
  { href: '/bitacora',    icon: '🔧', label: 'Bitácora'       },
  { href: '/pendientes',  icon: '📌', label: 'Pendientes'     },
]

const navRestringido = [
  { href: '/personal',    icon: '🗂️', label: 'Bitácora de Personal' },
  { href: '/solicitudes', icon: '📝', label: 'Solicitudes de Permiso' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [tieneAcceso, setTieneAcceso] = useState(false)
  const [usuario, setUsuario] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [avisoVisible, setAvisoVisible] = useState(false)
  const [segundosRestantes, setSegundosRestantes] = useState(SEGUNDOS_AVISO)

  // Se crea una sola vez, no en cada render
  const [supabase] = useState(() => createClient())

  // Permite reiniciar el contador desde el botón "Seguir conectado"
  const reiniciarRef = useRef<() => void>(() => {})

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data?.user?.email?.toLowerCase() || ''
      setUsuario(email || null)
      setTieneAcceso(ACCESO_PERSONAL.includes(email))
      setCargando(false)
    })
  }, [supabase])

  const cerrarSesion = useCallback(async () => {
    setAvisoVisible(false)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }, [supabase, router])

  // --- Cierre automático por inactividad ---
  // Solo corre si hay sesión iniciada. Los operadores que entran sin
  // cuenta (a firmar o a pedir permiso) nunca son afectados.
  useEffect(() => {
    if (!usuario) return

    let idAviso: ReturnType<typeof setTimeout>
    let idCierre: ReturnType<typeof setTimeout>

    const reiniciar = () => {
      clearTimeout(idAviso)
      clearTimeout(idCierre)
      setAvisoVisible(false)
      idAviso = setTimeout(() => {
        setSegundosRestantes(SEGUNDOS_AVISO)
        setAvisoVisible(true)
      }, (MINUTOS_INACTIVIDAD * 60 - SEGUNDOS_AVISO) * 1000)
      idCierre = setTimeout(() => {
        void cerrarSesion()
      }, MINUTOS_INACTIVIDAD * 60 * 1000)
    }

    reiniciarRef.current = reiniciar

    // Se limita a una vez por segundo para no recalcular en cada pixel
    let ultimoMovimiento = 0
    const alHaberActividad = () => {
      const ahora = Date.now()
      if (ahora - ultimoMovimiento < 1000) return
      ultimoMovimiento = ahora
      reiniciar()
    }

    const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    eventos.forEach((e) =>
      window.addEventListener(e, alHaberActividad, { passive: true })
    )

    reiniciar()

    return () => {
      clearTimeout(idAviso)
      clearTimeout(idCierre)
      eventos.forEach((e) => window.removeEventListener(e, alHaberActividad))
    }
  }, [usuario, cerrarSesion])

  // Cuenta regresiva visible durante el aviso
  useEffect(() => {
    if (!avisoVisible) return
    const id = setInterval(() => {
      setSegundosRestantes((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [avisoVisible])

  const seguirConectado = () => {
    setAvisoVisible(false)
    reiniciarRef.current()
  }

  const solicitudActiva = pathname === '/solicitud-permiso'

  return (
    <>
      <aside className={`flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-52'} min-h-screen sticky top-0`}>
        <div className="flex items-center justify-between px-3 py-4 border-b border-gray-800">
          {!collapsed && (
            <div>
              <p className="text-sm font-bold text-white leading-tight">Turiticket</p>
              <p className="text-xs text-gray-500">Operaciones</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white text-lg p-1 rounded hover:bg-gray-800 ml-auto">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-2 flex-1">
          {/* Menú de Operaciones: solo con sesión iniciada */}
          {!cargando && usuario && nav.map(({ href, icon, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`} title={collapsed ? label : undefined}>
                <span className="text-base shrink-0">{icon}</span>
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}

          {/* Solicitud de Permiso: visible para TODOS, con o sin sesión */}
          {!cargando && (
            <>
              {usuario && (
                <div className={`my-1 border-t border-gray-800 ${collapsed ? 'mx-1' : 'mx-2'}`} />
              )}
              <Link
                href="/solicitud-permiso"
                title={collapsed ? 'Solicitud de Permiso' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors border ${
                  solicitudActiva
                    ? 'bg-emerald-600 text-white font-medium border-emerald-500'
                    : 'bg-emerald-950/30 text-emerald-200 border-emerald-800/50 hover:bg-emerald-900/40 hover:text-emerald-100'
                }`}
              >
                <span className="text-base shrink-0">📝</span>
                {!collapsed && <span>Solicitud de Permiso</span>}
              </Link>
            </>
          )}

          {/* Sección restringida: solo los correos autorizados */}
          {!cargando && tieneAcceso && (
            <>
              <div className={`my-1 border-t border-amber-900/40 ${collapsed ? 'mx-1' : 'mx-2'}`} />
              {navRestringido.map(({ href, icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors border ${
                    pathname === href
                      ? 'bg-amber-600 text-white font-medium border-amber-500'
                      : 'bg-amber-950/30 text-amber-200 border-amber-800/50 hover:bg-amber-900/40 hover:text-amber-100'
                  }`}
                >
                  <span className="text-base shrink-0">{icon}</span>
                  {!collapsed && (
                    <span className="flex items-center gap-1">
                      {label}
                      <span className="text-[10px]" title="Acceso restringido">🔒</span>
                    </span>
                  )}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Cerrar sesión (con sesión) o Iniciar sesión (sin sesión) */}
        {!cargando && (
          <div className="p-2 border-t border-gray-800">
            {usuario ? (
              <>
                <button
                  onClick={() => void cerrarSesion()}
                  title={collapsed ? 'Cerrar sesión' : undefined}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-red-900/40 transition-colors"
                >
                  <span className="text-base shrink-0">🚪</span>
                  {!collapsed && <span>Cerrar sesión</span>}
                </button>
                {!collapsed && (
                  <p className="px-3 pt-1 text-[10px] text-gray-600 truncate" title={usuario}>
                    {usuario}
                  </p>
                )}
              </>
            ) : (
              <Link
                href="/login"
                title={collapsed ? 'Iniciar sesión' : undefined}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <span className="text-base shrink-0">🔑</span>
                {!collapsed && <span>Iniciar sesión</span>}
              </Link>
            )}
          </div>
        )}

        {!collapsed && <div className="px-4 py-3 border-t border-gray-800"><p className="text-xs text-gray-600">© 2026 Turiticket</p></div>}
      </aside>

      {avisoVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="text-4xl mb-3">⏰</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              Tu sesión está por cerrarse
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Por seguridad cerraremos tu sesión por inactividad en{' '}
              <span className="font-bold text-[#D9272D]">{segundosRestantes}</span>{' '}
              segundos.
            </p>
            <div className="flex gap-2">
              <button
                onClick={seguirConectado}
                className="flex-1 bg-[#284D71] text-white font-medium py-2 rounded-lg"
              >
                Seguir conectado
              </button>
              <button
                onClick={() => void cerrarSesion()}
                className="flex-1 bg-gray-100 text-gray-600 font-medium py-2 rounded-lg"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
