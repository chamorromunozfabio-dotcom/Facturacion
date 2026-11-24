export default [
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
    path: 'roles',
    name: 'roles',
    component: () => import('../views/RolesView.vue'),
    meta: { permission: 'roles:view' },
  },
]
