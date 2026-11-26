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
    // Módulo exclusivo del admin. No entra al catálogo de permisos asignables.
    empresas: ['view'],
    facturas: ['view', 'create', 'edit', 'delete', 'entregar', 'recibir', 'pdf'],
    estadisticas: ['view'],
  },
  empresa: {
    // La empresa administra el catálogo y las bodegas de su propio equipo (sin vista Usuarios).
    tipos: ['view', 'create', 'edit', 'delete'],
    bodegas: ['view', 'create', 'edit', 'delete'],
    usuarios: [],
    roles: [],
    permisos: [],
    empresas: [],
    facturas: ['view', 'create', 'edit', 'delete', 'entregar', 'recibir', 'pdf'],
    estadisticas: ['view'],
  },
  bodeguero: {
    // Los Tipos son los productos de su bodega: los gestiona completos.
    tipos: ['view', 'create', 'edit', 'delete'],
    // El bodeguero no accede al módulo Bodegas ni Usuarios; la empresa gestiona las bodegas.
    bodegas: [],
    facturas: ['view', 'create', 'edit', 'delete', 'entregar', 'recibir', 'pdf'],
    estadisticas: ['view'],
  },
  cliente: {
    facturas: ['view', 'aceptar', 'rechazar', 'pdf'],
    estadisticas: ['view'],
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
  { clave: 'estadisticas', etiqueta: 'Estadísticas' },
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
 * Lista cerrada que ve el admin en la matriz de checks.
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

function capitalizar(texto) {
  const limpio = String(texto ?? '').replace(/[_-]+/g, ' ').trim()
  return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1) : 'Otros'
}

/**
 * Combina el catálogo base con cualquier módulo o permiso nuevo que devuelva
 * `GET /permisos`, para que aparezcan disponibles sin editar el frontend.
 */
export function construirModulosDesdeBackend(permisosBackend = []) {
  const idPorNombre = Object.fromEntries(
    (permisosBackend ?? []).map((permiso) => [String(permiso.nombre ?? '').trim(), permiso.id]),
  )

  const grupos = new Map(
    MODULOS_PERMISO.map((modulo) => [
      modulo.clave,
      {
        ...modulo,
        opciones: CATALOGO_PERMISOS.filter((item) => item.modulo === modulo.clave).map((item) => ({
          ...item,
          idBackend: idPorNombre[item.nombre] ?? null,
        })),
      },
    ]),
  )

  for (const permiso of permisosBackend ?? []) {
    const nombre = String(permiso?.nombre ?? '').trim()
    if (!nombre || CATALOGO_PERMISOS.some((item) => item.nombre === nombre)) continue

    const sep = nombre.indexOf('_')
    const modulo = sep > 0 ? nombre.slice(0, sep) : 'otros'
    const accion = sep > 0 ? nombre.slice(sep + 1) : nombre
    const moduloEtiqueta = MODULOS_PERMISO.find((m) => m.clave === modulo)?.etiqueta ?? capitalizar(modulo)
    const accionEtiqueta = ETIQUETAS_ACCION[accion] ?? capitalizar(accion)

    if (!grupos.has(modulo)) {
      grupos.set(modulo, { clave: modulo, etiqueta: moduloEtiqueta, opciones: [] })
    }
    grupos.get(modulo).opciones.push({
      clave: `${modulo}:${accion}`,
      modulo,
      moduloEtiqueta,
      accion,
      accionEtiqueta,
      nombre,
      etiqueta: `${moduloEtiqueta} — ${accionEtiqueta}`,
      idBackend: permiso.id ?? null,
    })
  }

  return [...grupos.values()]
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
  // "Empresas" es exclusivo del admin: ni los permisos reales del backend
  // pueden abrir esta ruta a otro rol.
  if (modulo === 'empresas') return role === 'admin'

  // El bodeguero no accede al módulo Bodegas (solo opera productos y facturas en la bodega asignada).
  if (role === 'bodeguero' && modulo === 'bodegas') {
    return false
  }
  // La empresa no accede a la vista Usuarios ni acepta/rechaza facturas, aunque
  // el backend incluya esos permisos en su plantilla.
  if (role === 'empresa' && modulo === 'usuarios' && accion === 'view') {
    return false
  }
  if (
    role === 'empresa' &&
    modulo === 'facturas' &&
    (accion === 'aceptar' || accion === 'rechazar')
  ) {
    return false
  }

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
