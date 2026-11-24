export default [
  {
    path: 'estadisticas',
    name: 'estadisticas',
    component: () => import('../views/EstadisticasView.vue'),
    meta: { permission: 'estadisticas:view' },
  },
]
