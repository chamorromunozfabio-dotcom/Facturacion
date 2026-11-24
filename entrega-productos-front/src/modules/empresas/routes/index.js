export default [
  {
    path: 'empresas',
    name: 'empresas',
    component: () => import('../views/EmpresasView.vue'),
    meta: { permission: 'empresas:view' },
  },
]
