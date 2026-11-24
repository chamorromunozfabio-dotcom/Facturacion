import {
  ChartColumn,
  Home,
  KeyRound,
  ReceiptText,
  ShieldCheck,
  Tags,
  Users,
  Warehouse,
} from '@lucide/vue'
import { tienePermiso } from './permissions'

/**
 * Menú principal según la matriz definitiva del líder.
 * "Órdenes" se quitó: la orden es la factura, un solo módulo.
 * `module` se usa para decidir si el rol ve la opción.
 * `icon` es un componente SVG de Lucide, no un emoji: se ve igual en todos los sistemas.
 */
export const menuItems = [
  { label: 'Inicio', to: '/', icon: Home },
  { label: 'Tipos', to: '/tipos', icon: Tags, module: 'tipos' },
  { label: 'Bodegas', to: '/bodegas', icon: Warehouse, module: 'bodegas' },
  { label: 'Usuarios', to: '/usuarios', icon: Users, module: 'usuarios' },
  { label: 'Permisos', to: '/permisos', icon: KeyRound, module: 'permisos' },
  { label: 'Roles', to: '/roles', icon: ShieldCheck, module: 'roles' },
  { label: 'Facturas', to: '/facturas', icon: ReceiptText, module: 'facturas' },
  { label: 'Estadísticas', to: '/estadisticas', icon: ChartColumn, module: 'estadisticas' },
]

/**
 * Opciones del menú según los permisos reales de la sesión.
 * `permisos` viene de `/login` o `/me`; si no viene, se usa la matriz del rol.
 */
export function visibleMenuFor(role, permisos) {
  return menuItems.filter(
    (item) => !item.module || tienePermiso(permisos, role, item.module, 'view'),
  )
}
