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
| 5 | CRUD con mocks: paginación y búsqueda | ⏳ Por ejecutar | [mocks-crud.test.js](mocks-crud.test.js) |
| 6 | Componente `PagePlaceholder` | ⏳ Por ejecutar | [page-placeholder.test.js](page-placeholder.test.js) |
| 7 | `LoginView`: validación y login demo | ✅ PASÓ (actualizado) | [login-view.test.js](login-view.test.js) |
| 8 | `MainLayout`: menú por rol, drawer hamburguesa y logout | ⏳ Por ejecutar | [main-layout.test.js](main-layout.test.js) |
| 9 | `DataTable`: filas, búsqueda, paginación y acciones | ✅ PASÓ | [data-table.test.js](data-table.test.js) |
| 10 | `FormModal`: campos, validación y eventos | ✅ PASÓ | [form-modal.test.js](form-modal.test.js) |
| 11 | `ConfirmDelete`: confirmación antes de borrar | ✅ PASÓ | [confirm-delete.test.js](confirm-delete.test.js) |
| 12 | `AlertMessage`: tipos y cierre | ✅ PASÓ | [alert-message.test.js](alert-message.test.js) |
| 13 | `TiposView`: listado y CRUD de productos con componentes | ⏳ Por ejecutar | [tipos-view.test.js](tipos-view.test.js) |
| 14 | `BodegasView`: listado y CRUD con componentes | ⏳ Por ejecutar | [bodegas-view.test.js](bodegas-view.test.js) |
| 15 | Validación de formularios: `trim`, máximo y duplicados | ✅ PASÓ | [form-validation.test.js](form-validation.test.js) |
| 16 | Permisos y menú definitivos del líder | ✅ PASÓ | [roles-permissions.test.js](roles-permissions.test.js) |
| 17 | Botones Crear/Editar/Eliminar según permiso | ⏳ Por ejecutar | [action-permissions.test.js](action-permissions.test.js) |
| 18 | Campos nuevos de Bodega y validaciones | ⏳ Por ejecutar | [bodegas-fields.test.js](bodegas-fields.test.js) |
| 19 | `UsuariosView`: roles, filtro y campos condicionales de cliente | ⏳ Por ejecutar | [usuarios-view.test.js](usuarios-view.test.js) |
| 20 | `SignaturePad`: dibujar, escalar al celular, limpiar y límite de 500 KB | ⏳ Por ejecutar | [signature-pad.test.js](signature-pad.test.js) |
| 21 | API de Facturas: acciones, firma y descarga PDF | ✅ PASÓ | [facturas-api.test.js](facturas-api.test.js) |
| 22 | `FacturaDetail`: detalle, totales, firma y rechazo | ✅ PASÓ | [factura-detail.test.js](factura-detail.test.js) |
| 23 | `FacturaForm`: producto por línea y validaciones | ⏳ Por ejecutar | [factura-form.test.js](factura-form.test.js) |
| 24 | `FacturaView`: listado, detalle y acciones por estado/rol | ⏳ Por ejecutar | [factura-view.test.js](factura-view.test.js) |
| 25 | Vistas por rol: iconos Lucide y transiciones | ⏳ Por ejecutar | [role-views-icons.test.js](role-views-icons.test.js) |
| 26 | Iconos en acciones y color de acento por rol | ⏳ Por ejecutar | [action-icons-role-colors.test.js](action-icons-role-colors.test.js) |
| 27 | Badge de estado con color en listado y detalle | ✅ PASÓ | [status-badge.test.js](status-badge.test.js) |
| 28 | Transiciones en modales y alertas | ⏳ Por ejecutar | [transitions.test.js](transitions.test.js) |
| 29 | Accesibilidad: Escape, foco y aria-label | ⏳ Por ejecutar | [accessibility.test.js](accessibility.test.js) |
| 30 | Cuentas demo por rol y atajos en el login | ✅ PASÓ | [mock-accounts.test.js](mock-accounts.test.js) |
| 31 | Mensajes claros: validación, botones y títulos | ⏳ Por ejecutar | [ux-messages.test.js](ux-messages.test.js) |
| 32 | Modo híbrido y CRUD real de Roles | ⏳ Por ejecutar | [real-api-modules.test.js](real-api-modules.test.js) |
| 33 | Contrato definitivo: estados, FE-0001 y campos renombrados | ⏳ Por ejecutar | [contrato-definitivo.test.js](contrato-definitivo.test.js) |
| 34 | Permisos reales del bodeguero: CRUD de Tipos y facturas de su bodega | ⏳ Por ejecutar | [permisos-bodeguero.test.js](permisos-bodeguero.test.js) |
| 35 | Contrato v2: bodegas propias, sin Usuarios y selector `/facturas/clientes` | ⏳ Por ejecutar | [contrato-v2.test.js](contrato-v2.test.js) |
| 36 | Permisos por usuario: dar/quitar con POST/DELETE y sesión | ⏳ Por ejecutar | [permisos-asignacion.test.js](permisos-asignacion.test.js) |
| 37 | Facturas: mensajes descriptivos por dato y alerta sobre el modal | ⏳ Por ejecutar | [facturas-mensajes-descriptivos.test.js](facturas-mensajes-descriptivos.test.js) |
| 38 | Errores 422 del backend traducidos a mensajes junto al campo | ⏳ Por ejecutar | [facturas-errores-backend.test.js](facturas-errores-backend.test.js) |
| 39 | Bodegas con 11 datos obligatorios y avisos cortos por campo | ⏳ Por ejecutar | [bodegas-obligatorias.test.js](bodegas-obligatorias.test.js) |
| 40 | Permisos por usuario: buscador, tarjetas y confirmación de cambios | ⏳ Por ejecutar | [permisos-matriz.test.js](permisos-matriz.test.js) |
| 41 | Menú, botones y rutas con los permisos reales de la sesión | ⏳ Por ejecutar | [permisos-sesion-real.test.js](permisos-sesion-real.test.js) |
| 42 | Roles nuevos del backend disponibles al crear/editar usuarios | ⏳ Por ejecutar | [roles-nuevos-usuarios.test.js](roles-nuevos-usuarios.test.js) |
| 43 | Rutas que se abren según el permiso real, aunque el rol sea otro | ✅ PASÓ | [permisos-rutas-cruzadas.test.js](permisos-rutas-cruzadas.test.js) |
| 44 | Tipos por bodega y buscador de tipos en facturas | ⏳ Por ejecutar | [tipos-por-bodega.test.js](tipos-por-bodega.test.js) |
| 45 | Eliminación de facturas emitidas tras confirmación | ⏳ Por ejecutar | [factura-view.test.js](factura-view.test.js) |
| 46 | Facturas propias por usuario y bloqueo 404 de ajenas | ✅ PASÓ | [facturas-por-usuario.test.js](facturas-por-usuario.test.js) |
| 47 | Permisos: marcar todos, desmarcar todos y plantilla del rol | ⏳ Por ejecutar | [permisos-matriz.test.js](permisos-matriz.test.js) |
| 51 | Permisos modular: vista pequeña, composable y piezas con contrato | ⏳ Por ejecutar | [permisos-modular.test.js](permisos-modular.test.js) |
| 52 | FacturaForm modular: encabezado, líneas y validación pura | ⏳ Por ejecutar | [factura-form-modular.test.js](factura-form-modular.test.js) |
| 53 | MainLayout modular: sidebar y barra superior | ⏳ Por ejecutar | [main-layout-modular.test.js](main-layout-modular.test.js) |
| 54 | FacturaView modular: lógica, modales y mapa | ⏳ Por ejecutar | [factura-view-modular.test.js](factura-view-modular.test.js) |
| 55 | Componentes `ui`/`facturas` y re-exports de compatibilidad | ⏳ Por ejecutar | [componentes-ui.test.js](componentes-ui.test.js) |
| 56 | CRUD compartido: utilidades, composable y vistas delegadas | ✅ PASÓ | [crud-compartido.test.js](crud-compartido.test.js) |
| 57 | `CrudPage`: plantilla, slots y eventos compartidos | ⏳ Por ejecutar | [crud-page.test.js](crud-page.test.js) |
| 58 | Login modular: reglas puras, composable y `LoginForm` | ⏳ Por ejecutar | [login-modular.test.js](login-modular.test.js) |
| 48 | Avisos flotantes con cierre automático y cierre manual | ⏳ Por ejecutar | [alerta-auto-cierre.test.js](alerta-auto-cierre.test.js) |
| 49 | Aviso de sesión vencida al volver al login | ⏳ Por ejecutar | [aviso-sesion-vencida.test.js](aviso-sesion-vencida.test.js) |
| 50 | Reglas responsive para celular, tablet y escritorio | ⏳ Por ejecutar | [responsive-layout.test.js](responsive-layout.test.js) |
| 59 | Estadísticas por usuario: reglas, permiso, API, series del backend y panel | ⏳ Por ejecutar | [estadisticas.test.js](estadisticas.test.js) |

---

**57 archivos de test, 312 pruebas.** Ejecutar todo con `npm test`.

> Actualizado tras la respuesta del backend: login por `correo`/`contrasena`, roles `admin`/`bodeguero`/`cliente`, endpoint `/roles`, `GET /me` y normalización de errores 422.
>
> Los tests fuerzan `VITE_USE_MOCKS=true` en `vite.config.js`, así que funcionan aunque tu `.env` local esté en `false` para probar la API real.
