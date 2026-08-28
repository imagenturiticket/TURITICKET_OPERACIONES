// ============================================================
// CONTROL DE ACCESO — ÚNICO LUGAR DONDE SE EDITA
// ============================================================
// Lo usan DOS cosas al mismo tiempo:
//   1. El menú lateral (Sidebar) — muestra u oculta botones
//   2. El middleware — bloquea el acceso por URL escrita a mano
//
// CÓMO FUNCIONA (importante):
//   La lógica está INVERTIDA a propósito. En vez de listar lo
//   prohibido, se lista lo que puede ver CUALQUIERA con sesión.
//   Todo lo que NO esté en RUTAS_TODOS queda automáticamente
//   restringido a los correos de ACCESO_ADMIN.
//   Así, si algún día se agrega una pantalla nueva, nace
//   protegida por default en vez de quedar abierta por olvido.
// ============================================================

// ------------------------------------------------------------
// CORREOS CON ACCESO TOTAL (administración)
// Para dar de alta a alguien: agrega su correo en minúsculas,
// entre comillas y con una coma al final.
// OJO: si una persona entra con dos correos distintos, hay que
// poner LOS DOS aquí.
// ------------------------------------------------------------
export const ACCESO_ADMIN = [
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

// ------------------------------------------------------------
// RUTAS QUE VE CUALQUIERA CON SESIÓN INICIADA
// (Michell, Mari, Gaby, Osmar y cualquier cuenta nueva)
// ------------------------------------------------------------
export const RUTAS_TODOS = [
  '/',            // Asignaciones
  '/historial',   // Historial
  '/bitacora',    // Bitácora de unidades
  '/pendientes',  // Pendientes
]

// ------------------------------------------------------------
// RUTAS PÚBLICAS (sin necesidad de cuenta)
// Aquí entran los operadores desde su celular.
// ------------------------------------------------------------
export const RUTAS_PUBLICAS = [
  '/login',
  '/firmar',
  '/solicitud-permiso',
]

/** true si el correo tiene acceso total (administración). */
export function esAdmin(email?: string | null): boolean {
  if (!email) return false
  return ACCESO_ADMIN.includes(email.trim().toLowerCase())
}

/** true si la ruta no necesita cuenta para abrirse. */
export function esRutaPublica(pathname: string): boolean {
  return RUTAS_PUBLICAS.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )
}

/** true si la ruta la puede ver cualquiera con sesión iniciada. */
export function esRutaDeTodos(pathname: string): boolean {
  return RUTAS_TODOS.some(
    (r) => pathname === r || (r !== '/' && pathname.startsWith(r + '/'))
  )
}

/**
 * true si esta persona puede abrir esta ruta.
 * Los admin pueden todo. Los demás, solo las rutas públicas
 * y las de RUTAS_TODOS.
 */
export function puedeVerRuta(pathname: string, email?: string | null): boolean {
  if (esRutaPublica(pathname)) return true
  if (esAdmin(email)) return true
  return esRutaDeTodos(pathname)
}
