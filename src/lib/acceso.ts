// ============================================================
// LISTA ÚNICA DE ACCESO RESTRINGIDO
// ============================================================
// Este es el ÚNICO lugar donde se edita quién puede entrar a
// Bitácora de Personal y a Solicitudes de Permiso.
//
// Lo usan DOS cosas al mismo tiempo:
//   1. El menú lateral (Sidebar) — para mostrar u ocultar botones
//   2. El middleware — para bloquear el acceso por URL directa
//
// Para dar de alta a alguien: agrega su correo a la lista de abajo,
// en minúsculas, entre comillas y con una coma al final.
// ============================================================

export const ACCESO_PERSONAL = [
  // Zeus
  'zeus@turiticket.com',
  'imagen.turiticket@gmail.com',
  // Ama
  'ama@turiticket.com',
  'gerencia.turiticket@gmail.com',
  // Lic. Juan
  'juan@turiticket.com',
  'juan.hughes.mendoza@gmail.com',
]

// Rutas que SOLO pueden abrir los correos de la lista de arriba.
// Incluye automáticamente sus subpáginas (ej. /personal/contactos).
export const RUTAS_RESTRINGIDAS = ['/personal', '/solicitudes']

/** Devuelve true si el correo tiene acceso a la sección restringida. */
export function tieneAccesoPersonal(email?: string | null): boolean {
  if (!email) return false
  return ACCESO_PERSONAL.includes(email.trim().toLowerCase())
}

/** Devuelve true si la ruta pertenece a la sección restringida. */
export function esRutaRestringida(pathname: string): boolean {
  return RUTAS_RESTRINGIDAS.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )
}
