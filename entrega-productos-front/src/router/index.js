import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
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
          meta: { roles: ['admin', 'bodeguero'] },
        },
        {
          path: 'bodegas',
          name: 'bodegas',
          component: () => import('../views/BodegasView.vue'),
          meta: { roles: ['admin', 'bodeguero'] },
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: () => import('../views/UsuariosView.vue'),
          meta: { roles: ['admin', 'bodeguero'] },
        },
        {
          path: 'permisos',
          name: 'permisos',
          component: () => import('../views/PermisosView.vue'),
          meta: { roles: ['admin'] },
        },
        {
          path: 'roles',
          name: 'roles',
          component: () => import('../views/RolesView.vue'),
          meta: { roles: ['admin'] },
        },
        // "Órdenes" se eliminó: la orden es la factura. Redirigimos las rutas viejas.
        { path: 'ordenes', redirect: { name: 'facturas' } },
        { path: 'factura', redirect: { name: 'facturas' } },
        {
          path: 'facturas',
          name: 'facturas',
          component: () => import('../views/FacturaView.vue'),
          meta: { roles: ['admin', 'bodeguero', 'cliente'] },
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

  if (to.meta.roles?.length && !to.meta.roles.includes(auth.role)) {
    return { name: 'inicio' }
  }

  return true
})

export default router
