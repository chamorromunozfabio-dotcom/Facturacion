/**
 * Menú principal.
 * Roles provisionales acordados con backend: admin, bodeguero, cliente.
 * TODO: confirmar con el líder los valores y qué ve cada rol.
 */
export const menuItems = [
  { label: 'Inicio', to: '/', icon: '🏠' },
  { label: 'Tipos', to: '/tipos', icon: '🏷️', roles: ['admin', 'bodeguero'] },
  { label: 'Bodegas', to: '/bodegas', icon: '🏭', roles: ['admin', 'bodeguero'] },
  { label: 'Usuarios', to: '/usuarios', icon: '👤', roles: ['admin'] },
  { label: 'Permisos', to: '/permisos', icon: '🔑', roles: ['admin'] },
  { label: 'Roles', to: '/roles', icon: '🛡️', roles: ['admin'] },
  { label: 'Órdenes', to: '/ordenes', icon: '📋', roles: ['admin', 'bodeguero', 'cliente'] },
  { label: 'Factura', to: '/factura', icon: '🧾', roles: ['admin', 'bodeguero', 'cliente'] },
]
