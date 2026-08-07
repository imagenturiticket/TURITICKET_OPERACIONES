'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

// Correos con acceso a la sección restringida de Bitácora de Personal
const ACCESO_PERSONAL = ['zeus@turiticket.com', 'juan@turiticket.com', 'ama@turiticket.com']

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

const navRestringido = { href: '/personal', icon: '🗂️', label: 'Bitácora de Personal' }

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [tieneAcceso, setTieneAcceso] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data?.user?.email?.toLowerCase() || ''
      setTieneAcceso(ACCESO_PERSONAL.includes(email))
    })
  }, [])

  return (
    <aside className={`flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-52'} min-h-screen sticky top-0`}>
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-800">
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white leading-tight">Turiticket</p>
            <p className="text-xs text-gray-500">Operadores</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white text-lg p-1 rounded hover:bg-gray-800 ml-auto">
          {collapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {nav.map(({ href, icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`} title={collapsed ? label : undefined}>
              <span className="text-base shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}

        {tieneAcceso && (
          <>
            <div className={`my-1 border-t border-amber-900/40 ${collapsed ? 'mx-1' : 'mx-2'}`} />
            <Link
              href={navRestringido.href}
              title={collapsed ? navRestringido.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors border ${
                pathname === navRestringido.href
                  ? 'bg-amber-600 text-white font-medium border-amber-500'
                  : 'bg-amber-950/30 text-amber-200 border-amber-800/50 hover:bg-amber-900/40 hover:text-amber-100'
              }`}
            >
              <span className="text-base shrink-0">{navRestringido.icon}</span>
              {!collapsed && (
                <span className="flex items-center gap-1">
                  {navRestringido.label}
                  <span className="text-[10px]" title="Acceso restringido">🔒</span>
                </span>
              )}
            </Link>
          </>
        )}
      </nav>
      {!collapsed && <div className="px-4 py-3 border-t border-gray-800"><p className="text-xs text-gray-600">© 2026 Turiticket</p></div>}
    </aside>
  )
}