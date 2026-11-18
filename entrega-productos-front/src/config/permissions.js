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
