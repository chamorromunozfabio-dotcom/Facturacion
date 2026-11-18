/**
 * Permisos definitivos confirmados por el líder.
 *
 * El frontend solo oculta botones: el backend es quien bloquea con 403.
 * Acciones posibles: view, create, edit, delete, entregar, recibir,
 * aceptar, rechazar, pdf.
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
    tipos: ['view'],
    bodegas: ['view'],
    usuarios: ['view'], // el backend fuerza ?rol=cliente
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
