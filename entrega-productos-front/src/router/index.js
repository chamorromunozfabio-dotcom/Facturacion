import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../modules/auth/store/auth'
import { tienePermiso } from '../shared/config/permissions'
import MainLayout from '../modules/layout/layouts/MainLayout.vue'

import authRoutes from '../modules/auth/routes'
import catalogosRoutes from '../modules/catalogos/routes'
import empresasRoutes from '../modules/empresas/routes'
import estadisticasRoutes from '../modules/estadisticas/routes'
import facturasRoutes from '../modules/facturas/routes'
import inicioRoutes from '../modules/inicio/routes'
import permisosRoutes from '../modules/permisos/routes'

const porNombre = (rutas, nombre) => rutas.find((r) => r.name === nombre)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    {
      path: '/',
      component: MainLayout,
      children: [
        porNombre(inicioRoutes, 'inicio'),
        porNombre(catalogosRoutes, 'tipos'),
        porNombre(catalogosRoutes, 'bodegas'),
        porNombre(catalogosRoutes, 'usuarios'),
        ...empresasRoutes,
        porNombre(permisosRoutes, 'permisos'),
        porNombre(catalogosRoutes, 'roles'),
        // "Órdenes" se eliminó: la orden es la factura. Redirigimos las rutas viejas.
        ...facturasRoutes,
        ...estadisticasRoutes,
      ],
    },
    porNombre(inicioRoutes, 'not-found'),
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.public) {
    if (auth.isAuthenticated && (to.name === 'login' || to.name === 'register')) {
      return { name: 'inicio' }
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // El acceso depende SOLO del permiso real de la sesión, no del rol: el admin
  // puede dar, por ejemplo, "tipos_view" a un cliente y el backend ya responde 200.
  // El backend además bloquea con 403; acá solo evitamos mostrar una página que
  // la sesión no puede usar (por ejemplo, si le quitaron "ver facturas").
  if (to.meta.permission) {
    const [modulo, accion] = to.meta.permission.split(':')
    if (!tienePermiso(auth.permisos, auth.role, modulo, accion)) {
      return { name: 'inicio' }
    }
  }

  return true
})

export default router
