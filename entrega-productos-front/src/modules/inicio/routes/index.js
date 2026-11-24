export default [
  { path: '', name: 'inicio', component: () => import('../views/DashboardView.vue') },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
]
