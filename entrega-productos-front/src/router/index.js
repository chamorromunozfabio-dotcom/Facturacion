import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { tienePermiso } from '../config/permissions'
import MainLayout from '../layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'inicio', component: () => import('../views/DashboardView.vue') },
        // Roles y permisos definitivos en src/config/permissions.js
        {
          path: 'tipos',
          name: 'tipos',
          component: () => import('../views/TiposView.vue'),
          meta: { permission: 'tipos:view' },
        },
        {
          path: 'bodegas',
          name: 'bodegas',
          component: () => import('../views/BodegasView.vue'),
          meta: { permission: 'bodegas:view' },
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: () => import('../views/UsuariosView.vue'),
          meta: { permission: 'usuarios:view' },
        },
        {
          path: 'permisos',
          name: 'permisos',
          component: () => import('../views/PermisosView.vue'),
          meta: { permission: 'permisos:view' },
        },
        {
          path: 'roles',
          name: 'roles',
          component: () => import('../views/RolesView.vue'),
          meta: { permission: 'roles:view' },
        },
        // "Órdenes" se eliminó: la orden es la factura. Redirigimos las rutas viejas.
        { path: 'ordenes', redirect: { name: 'facturas' } },
        { path: 'factura', redirect: { name: 'facturas' } },
        {
          path: 'facturas',
          name: 'facturas',
          component: () => import('../views/FacturaView.vue'),
          meta: { permission: 'facturas:view' },
        },
        {
          path: 'estadisticas',
          name: 'estadisticas',
          component: () => import('../views/EstadisticasView.vue'),
          meta: { permission: 'estadisticas:view' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.public) {
    if (auth.isAuthenticated && to.name === 'login') return { name: 'inicio' }
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
