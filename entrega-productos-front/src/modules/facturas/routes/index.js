export default [
  // "Órdenes" se eliminó: la orden es la factura. Redirigimos las rutas viejas.
  { path: 'ordenes', redirect: { name: 'facturas' } },
  { path: 'factura', redirect: { name: 'facturas' } },
  {
    path: 'facturas',
    name: 'facturas',
    component: () => import('../views/FacturaView.vue'),
    meta: { permission: 'facturas:view' },
  },
]
