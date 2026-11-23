# Tests unitarios (Vitest)

Un test por archivo. Yo creo el test, tú lo ejecutas con:

```bash
npm test
```

Versión con recarga automática (se queda corriendo):

```bash
npm run test:watch
```

## Índice

| # | Test | Estado | Archivo |
|---|------|--------|---------|
| 1 | `getErrorMessage`: mensajes de error de la API | ✅ PASÓ | [getErrorMessage.test.js](getErrorMessage.test.js) |
| 2 | Store de autenticación: token, usuario y `localStorage` | ✅ PASÓ | [auth-store.test.js](auth-store.test.js) |
| 3 | Interceptores de Axios: token y manejo del 401 | ✅ PASÓ | [axios-interceptors.test.js](axios-interceptors.test.js) |
| 4 | Guardas del router: sin token y por rol | ✅ PASÓ (actualizado) | [router-guards.test.js](router-guards.test.js) |
| 5 | CRUD con mocks: paginación y búsqueda | ✅ PASÓ | [mocks-crud.test.js](mocks-crud.test.js) |
| 6 | Componente `PagePlaceholder` | ✅ PASÓ | [page-placeholder.test.js](page-placeholder.test.js) |
| 7 | `LoginView`: validación y login demo | ✅ PASÓ (actualizado) | [login-view.test.js](login-view.test.js) |
| 8 | `MainLayout`: menú por rol, drawer hamburguesa y logout | ✅ PASÓ | [main-layout.test.js](main-layout.test.js) |
| 9 | `DataTable`: filas, búsqueda, paginación y acciones | ✅ PASÓ | [data-table.test.js](data-table.test.js) |
| 10 | `FormModal`: campos, validación y eventos | ✅ PASÓ | [form-modal.test.js](form-modal.test.js) |
| 11 | `ConfirmDelete`: confirmación antes de borrar | ✅ PASÓ | [confirm-delete.test.js](confirm-delete.test.js) |
| 12 | `AlertMessage`: tipos y cierre | ✅ PASÓ | [alert-message.test.js](alert-message.test.js) |
| 13 | `TiposView`: listado y CRUD de productos con componentes | ✅ PASÓ | [tipos-view.test.js](tipos-view.test.js) |
| 14 | `BodegasView`: listado y CRUD con componentes | ✅ PASÓ | [bodegas-view.test.js](bodegas-view.test.js) |
| 15 | Validación de formularios: `trim`, máximo y duplicados | ✅ PASÓ | [form-validation.test.js](form-validation.test.js) |
| 16 | Permisos y menú definitivos del líder | ✅ PASÓ | [roles-permissions.test.js](roles-permissions.test.js) |
| 17 | Botones Crear/Editar/Eliminar según permiso | ✅ PASÓ | [action-permissions.test.js](action-permissions.test.js) |
| 18 | Campos nuevos de Bodega y validaciones | ✅ PASÓ | [bodegas-fields.test.js](bodegas-fields.test.js) |
| 19 | `UsuariosView`: roles, filtro y campos condicionales de cliente | ✅ PASÓ | [usuarios-view.test.js](usuarios-view.test.js) |
| 20 | `SignaturePad`: dibujar, escalar al celular, limpiar y límite de 500 KB | ✅ PASÓ | [signature-pad.test.js](signature-pad.test.js) |
| 21 | API de Facturas: acciones, firma y descarga PDF | ✅ PASÓ | [facturas-api.test.js](facturas-api.test.js) |
| 22 | `FacturaDetail`: detalle, totales, firma y rechazo | ✅ PASÓ | [factura-detail.test.js](factura-detail.test.js) |
| 23 | `FacturaForm`: producto por línea y validaciones | ✅ PASÓ | [factura-form.test.js](factura-form.test.js) |
| 24 | `FacturaView`: listado, detalle y acciones por estado/rol | ✅ PASÓ | [factura-view.test.js](factura-view.test.js) |
| 25 | Vistas por rol: iconos Lucide y transiciones | ✅ PASÓ | [role-views-icons.test.js](role-views-icons.test.js) |
| 26 | Iconos en acciones y color de acento por rol | ✅ PASÓ | [action-icons-role-colors.test.js](action-icons-role-colors.test.js) |
| 27 | Badge de estado con color en listado y detalle | ✅ PASÓ | [status-badge.test.js](status-badge.test.js) |
| 28 | Transiciones en modales y alertas | ✅ PASÓ | [transitions.test.js](transitions.test.js) |
| 29 | Accesibilidad: Escape, foco y aria-label | ✅ PASÓ | [accessibility.test.js](accessibility.test.js) |
| 30 | Cuentas demo por rol y atajos en el login | ✅ PASÓ | [mock-accounts.test.js](mock-accounts.test.js) |
| 31 | Mensajes claros: validación, botones y títulos | ✅ PASÓ | [ux-messages.test.js](ux-messages.test.js) |
| 32 | Modo híbrido y CRUD real de Roles | ✅ PASÓ | [real-api-modules.test.js](real-api-modules.test.js) |
| 33 | Contrato definitivo: estados, FE-0001 y campos renombrados | ✅ PASÓ | [contrato-definitivo.test.js](contrato-definitivo.test.js) |
| 34 | Permisos reales del bodeguero: CRUD de Tipos y facturas de su bodega | ✅ PASÓ | [permisos-bodeguero.test.js](permisos-bodeguero.test.js) |
| 35 | Contrato v2: bodegas propias, sin Usuarios y selector `/facturas/clientes` | ✅ PASÓ | [contrato-v2.test.js](contrato-v2.test.js) |
| 36 | Permisos por usuario: dar/quitar con POST/DELETE y sesión | ✅ PASÓ | [permisos-asignacion.test.js](permisos-asignacion.test.js) |
| 37 | Facturas: mensajes descriptivos por dato y alerta sobre el modal | ✅ PASÓ | [facturas-mensajes-descriptivos.test.js](facturas-mensajes-descriptivos.test.js) |
| 38 | Errores 422 del backend traducidos a mensajes junto al campo | ✅ PASÓ | [facturas-errores-backend.test.js](facturas-errores-backend.test.js) |
| 39 | Bodegas con 11 datos obligatorios y avisos cortos por campo | ✅ PASÓ | [bodegas-obligatorias.test.js](bodegas-obligatorias.test.js) |
| 40 | Permisos por usuario: buscador, tarjetas y confirmación de cambios | ✅ PASÓ | [permisos-matriz.test.js](permisos-matriz.test.js) |
| 41 | Menú, botones y rutas con los permisos reales de la sesión | ✅ PASÓ | [permisos-sesion-real.test.js](permisos-sesion-real.test.js) |
| 42 | Roles nuevos del backend disponibles al crear/editar usuarios | ✅ PASÓ | [roles-nuevos-usuarios.test.js](roles-nuevos-usuarios.test.js) |
| 43 | Rutas que se abren según el permiso real, aunque el rol sea otro | ✅ PASÓ | [permisos-rutas-cruzadas.test.js](permisos-rutas-cruzadas.test.js) |
| 44 | Tipos por bodega y buscador de tipos en facturas | ✅ PASÓ | [tipos-por-bodega.test.js](tipos-por-bodega.test.js) |
| 45 | Eliminación de facturas emitidas tras confirmación | ✅ PASÓ | [factura-view.test.js](factura-view.test.js) |
| 46 | Facturas propias por usuario y bloqueo 404 de ajenas | ✅ PASÓ | [facturas-por-usuario.test.js](facturas-por-usuario.test.js) |
| 47 | Permisos: marcar todos, desmarcar todos y plantilla del rol | ✅ PASÓ | [permisos-matriz.test.js](permisos-matriz.test.js) |
| 51 | Permisos modular: vista pequeña, composable y piezas con contrato | ✅ PASÓ | [permisos-modular.test.js](permisos-modular.test.js) |
| 52 | FacturaForm modular: encabezado, líneas y validación pura | ✅ PASÓ | [factura-form-modular.test.js](factura-form-modular.test.js) |
| 53 | MainLayout modular: sidebar y barra superior | ✅ PASÓ | [main-layout-modular.test.js](main-layout-modular.test.js) |
| 54 | FacturaView modular: lógica, modales y mapa | ✅ PASÓ | [factura-view-modular.test.js](factura-view-modular.test.js) |
| 55 | Componentes `ui`/`facturas` y re-exports de compatibilidad | ✅ PASÓ | [componentes-ui.test.js](componentes-ui.test.js) |
| 56 | CRUD compartido: utilidades, composable y vistas delegadas | ✅ PASÓ | [crud-compartido.test.js](crud-compartido.test.js) |
| 57 | `CrudPage`: plantilla, slots y eventos compartidos | ✅ PASÓ | [crud-page.test.js](crud-page.test.js) |
| 58 | Login modular: reglas puras, composable y `LoginForm` | ✅ PASÓ | [login-modular.test.js](login-modular.test.js) |
| 48 | Avisos flotantes con cierre automático y cierre manual | ✅ PASÓ | [alerta-auto-cierre.test.js](alerta-auto-cierre.test.js) |
| 49 | Aviso de sesión vencida al volver al login | ✅ PASÓ | [aviso-sesion-vencida.test.js](aviso-sesion-vencida.test.js) |
| 50 | Reglas responsive para celular, tablet y escritorio | ✅ PASÓ | [responsive-layout.test.js](responsive-layout.test.js) |
| 59 | Estadísticas por usuario: reglas, permiso, API, series del backend y panel | ✅ PASÓ | [estadisticas.test.js](estadisticas.test.js) |
| 60 | PDF nativo: blob a base64, guardado en cache y visor del sistema | ✅ PASÓ | [pdf-nativo.test.js](pdf-nativo.test.js) |
| 61 | `descargarPdf` usa el visor nativo y no `<a download>` | ✅ PASÓ | [facturas-pdf-nativo.test.js](facturas-pdf-nativo.test.js) |
| 62 | Renovación de tokens: reintento, concurrencia y cierre de sesión | ✅ PASÓ | [refresh-token.test.js](refresh-token.test.js) |
| 63 | Store de autenticación: guardar y limpiar el `refresh_token` | ✅ PASÓ | [auth-refresh-token.test.js](auth-refresh-token.test.js) |

---

**61 archivos de test, 324 pruebas.** Ejecutar todo con `npm test`.

> Última corrida: **todos los archivos en ✅ PASÓ**. Incluye el panel de estadísticas (Test 59, 9 pruebas), los textos por rol, el PDF nativo de Capacitor (Tests 60 y 61) y el refresh token con rotación (Tests 62 y 63).
>
> Contratos vigentes: login por `correo`/`contrasena`, roles `admin`/`bodeguero`/`cliente`, `GET /me`, normalización de errores 422, paginación `{ data, total, page, limit }` y `/estadisticas/resumen`.
>
> Los tests fuerzan `VITE_USE_MOCKS=true` en `vite.config.js`, así que funcionan aunque tu `.env` local esté en `false` para probar la API real.
