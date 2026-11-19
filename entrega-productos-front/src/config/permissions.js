/**
 * Permisos definitivos confirmados por el líder.
 *
 * El frontend solo oculta botones: el backend es quien bloquea con 403.
 * Acciones posibles: view, create, edit, delete, entregar, recibir,
 * aceptar, rechazar, pdf.
 *
 * También publicamos el CATÁLOGO FIJO que ofrece la pantalla de Permisos.
 * NO se pueden crear ni nombrar permisos nuevos desde la interfaz: el admin
 * solo elige una función de esta lista y se la da o se la quita a un usuario.
 */
const RULES = {
  admin: {
    tipos: ['view', 'create', 'edit', 'delete'],
    bodegas: ['view', 'create', 'edit', 'delete'],
    usuarios: ['view', 'create', 'edit', 'delete'],
    roles: ['view', 'create', 'edit', 'delete'],
    permisos: ['view', 'create', 'edit', 'delete'],
    facturas: ['view', 'create', 'edit', 'delete', 'entregar', 'recibir', 'pdf'],
  },
  bodeguero: {
    // Los Tipos son los productos de su bodega: los gestiona completos.
    tipos: ['view', 'create', 'edit', 'delete'],
    // El backend solo le permite ver, crear, editar y borrar SUS bodegas.
    bodegas: ['view', 'create', 'edit', 'delete'],
    // Sin clave 'usuarios': /usuarios es solo del admin (backend responde 403).
    facturas: ['view', 'create', 'edit', 'delete', 'entregar', 'recibir', 'pdf'],
  },
  cliente: {
    facturas: ['view', 'aceptar', 'rechazar', 'pdf'],
  },
}

/** Devuelve true si el rol puede hacer esa acción en ese módulo. */
export function hasPermission(role, module, action) {
  return Boolean(RULES[role]?.[module]?.includes(action))
}

/* --------------------------------------------------------------------------
 * Catálogo fijo de funcionalidades (módulo + acción)
 * ------------------------------------------------------------------------ */

export const MODULOS_PERMISO = [
  { clave: 'facturas', etiqueta: 'Facturación' },
  { clave: 'bodegas', etiqueta: 'Bodegas' },
  { clave: 'usuarios', etiqueta: 'Usuarios' },
  { clave: 'tipos', etiqueta: 'Tipos (productos)' },
  { clave: 'roles', etiqueta: 'Roles' },
  { clave: 'permisos', etiqueta: 'Permisos' },
]

const ETIQUETAS_ACCION = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
  entregar: 'Entregar',
  recibir: 'Recibir',
  aceptar: 'Aceptar',
  rechazar: 'Rechazar',
  pdf: 'Descargar PDF',
}

/** Acciones que existen en cada módulo. Unión de lo que usa cualquier rol. */
const ACCIONES_POR_MODULO = Object.fromEntries(
  MODULOS_PERMISO.map(({ clave }) => [
    clave,
    [...new Set(Object.values(RULES).flatMap((reglas) => reglas[clave] ?? []))],
  ]),
)

/**
 * Lista cerrada que ve el admin en el desplegable.
 * `nombre` es el valor que pedimos al backend en /permisos para resolver su id.
 */
export const CATALOGO_PERMISOS = MODULOS_PERMISO.flatMap((modulo) =>
  ACCIONES_POR_MODULO[modulo.clave].map((accion) => ({
    clave: `${modulo.clave}:${accion}`,
    modulo: modulo.clave,
    moduloEtiqueta: modulo.etiqueta,
    accion,
    accionEtiqueta: ETIQUETAS_ACCION[accion],
    nombre: `${modulo.clave}_${accion}`,
    etiqueta: `${modulo.etiqueta} — ${ETIQUETAS_ACCION[accion]}`,
  })),
)

/** Convierte el nombre que devuelve el backend a una clave del catálogo fijo. */
export function claveDelNombreBackend(nombre) {
  const texto = String(nombre ?? '').trim()
  return CATALOGO_PERMISOS.find((permiso) => permiso.nombre === texto)?.clave ?? null
}

/**
 * Dice si la sesión tiene una función concreta.
 *
 * El backend manda los permisos reales del usuario en `/login` y `/me`, con
 * nombres tipo `facturas_create`. El admin siempre tiene acceso total (regla
 * confirmada por el backend), aunque le falte algún permiso en la lista.
 *
 * Si la sesión viene de los mocks o es antigua y no trae `permisos`, usamos la
 * matriz del rol como respaldo para no dejar la pantalla vacía.
 */
export function tienePermiso(permisos, role, modulo, accion) {
  if (role === 'admin') {
    // El backend da 403 al admin que intente aceptar/rechazar facturas ajenas.
    if (modulo === 'facturas' && (accion === 'aceptar' || accion === 'rechazar')) return false
    return true
  }

  if (Array.isArray(permisos) && permisos.length > 0) {
    const nombre = `${modulo}_${accion}`
    return permisos.some((permiso) =>
      typeof permiso === 'string' ? permiso === nombre : permiso?.nombre === nombre,
    )
  }

  return hasPermission(role, modulo, accion)
}

/** Plantilla informativa del rol. NO se aplica automáticamente: los permisos son por usuario. */
export function plantillaDelRol(rol) {
  return Object.entries(RULES[rol] ?? {}).flatMap(([modulo, acciones]) =>
    acciones.map((accion) => `${modulo}:${accion}`),
  )
}
