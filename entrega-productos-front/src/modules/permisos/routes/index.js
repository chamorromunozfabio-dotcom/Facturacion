export default [
  {
    path: 'permisos',
    name: 'permisos',
    component: () => import('../views/PermisosView.vue'),
    meta: { permission: 'permisos:view' },
  },
]
