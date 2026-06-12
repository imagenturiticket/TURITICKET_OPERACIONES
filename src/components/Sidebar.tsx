'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const nav = [
  { href: '/',            icon: '📋', label: 'Asignaciones'   },
  { href: '/historial',   icon: '📅', label: 'Historial'      },
  { href: '/graficas',    icon: '📊', label: 'Gráficas'       },
  { href: '/importar',    icon: '📥', label: 'Importar datos' },
  { href: '/calculadora', icon: '💰', label: 'Calculadora'    },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

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
      </nav>
      {!collapsed && <div className="px-4 py-3 border-t border-gray-800"><p className="text-xs text-gray-600">© 2026 Turiticket</p></div>}
    </aside>
  )
}
