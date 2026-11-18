import { hasPermission } from './permissions'

/**
 * Menú principal según la matriz definitiva del líder.
 * "Órdenes" se quitó: la orden es la factura, un solo módulo.
 * `module` se usa para decidir si el rol ve la opción.
 */
export const menuItems = [
  { label: 'Inicio', to: '/', icon: '🏠' },
  { label: 'Tipos', to: '/tipos', icon: '🏷️', module: 'tipos' },
  { label: 'Bodegas', to: '/bodegas', icon: '🏭', module: 'bodegas' },
  { label: 'Usuarios', to: '/usuarios', icon: '👤', module: 'usuarios' },
  { label: 'Permisos', to: '/permisos', icon: '🔑', module: 'permisos' },
  { label: 'Roles', to: '/roles', icon: '🛡️', module: 'roles' },
  { label: 'Facturas', to: '/facturas', icon: '🧾', module: 'facturas' },
]

/** Opciones del menú que el rol puede ver. */
export function visibleMenuFor(role) {
  return menuItems.filter(
    (item) => !item.module || hasPermission(role, item.module, 'view'),
  )
}
