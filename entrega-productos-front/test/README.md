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
| 8 | `MainLayout`: menú por rol y logout | ✅ PASÓ | [main-layout.test.js](main-layout.test.js) |
| 9 | `DataTable`: filas, búsqueda, paginación y acciones | ✅ PASÓ | [data-table.test.js](data-table.test.js) |
| 10 | `FormModal`: campos, validación y eventos | ✅ PASÓ | [form-modal.test.js](form-modal.test.js) |
| 11 | `ConfirmDelete`: confirmación antes de borrar | ✅ PASÓ | [confirm-delete.test.js](confirm-delete.test.js) |
| 12 | `AlertMessage`: tipos y cierre | ✅ PASÓ | [alert-message.test.js](alert-message.test.js) |
| 13 | `TiposView`: listado y CRUD con componentes | ✅ PASÓ (actualizado) | [tipos-view.test.js](tipos-view.test.js) |
| 14 | `BodegasView`: listado y CRUD con componentes | ✅ PASÓ (actualizado) | [bodegas-view.test.js](bodegas-view.test.js) |
| 15 | Validación de formularios: `trim`, máximo y duplicados | ✅ PASÓ | [form-validation.test.js](form-validation.test.js) |
| 16 | Permisos y menú definitivos del líder | ✅ PASÓ | [roles-permissions.test.js](roles-permissions.test.js) |
| 17 | Botones Crear/Editar/Eliminar según permiso | ✅ PASÓ | [action-permissions.test.js](action-permissions.test.js) |
| 18 | Campos nuevos de Bodega y validaciones | ✅ PASÓ | [bodegas-fields.test.js](bodegas-fields.test.js) |
| 19 | `UsuariosView`: roles, filtro y campos condicionales de cliente | ✅ PASÓ | [usuarios-view.test.js](usuarios-view.test.js) |
| 20 | `SignaturePad`: dibujar, limpiar y límite de 500 KB | ✅ PASÓ | [signature-pad.test.js](signature-pad.test.js) |
| 21 | API de Facturas: acciones, firma y descarga PDF | ✅ PASÓ | [facturas-api.test.js](facturas-api.test.js) |
| 22 | `FacturaDetail`: detalle, totales, firma y rechazo | ✅ PASÓ | [factura-detail.test.js](factura-detail.test.js) |
| 23 | `FacturaForm`: líneas dinámicas y validaciones | ✅ PASÓ | [factura-form.test.js](factura-form.test.js) |
| 24 | `FacturaView`: listado, detalle y acciones por estado/rol | ✅ PASÓ | [factura-view.test.js](factura-view.test.js) |
| 25 | Vistas por rol: iconos Lucide y transiciones | ✅ PASÓ | [role-views-icons.test.js](role-views-icons.test.js) |
| 26 | Iconos en acciones y color de acento por rol | ✅ PASÓ | [action-icons-role-colors.test.js](action-icons-role-colors.test.js) |
| 27 | Badge de estado con color en listado y detalle | ✅ PASÓ | [status-badge.test.js](status-badge.test.js) |
| 28 | Transiciones en modales y alertas | ✅ PASÓ | [transitions.test.js](transitions.test.js) |
| 29 | Accesibilidad: Escape, foco y aria-label | ✅ PASÓ | [accessibility.test.js](accessibility.test.js) |
| 30 | Cuentas demo por rol y atajos en el login | ✅ PASÓ | [mock-accounts.test.js](mock-accounts.test.js) |
| 31 | Mensajes claros: validación, botones y títulos | ✅ PASÓ | [ux-messages.test.js](ux-messages.test.js) |
| 32 | Modo híbrido y CRUD reales de Roles/Permisos | ✅ PASÓ | [real-api-modules.test.js](real-api-modules.test.js) |
| 33 | Contrato definitivo: estados, FE-0001 y campos renombrados | ✅ PASÓ | [contrato-definitivo.test.js](contrato-definitivo.test.js) |
| 34 | Permisos reales del bodeguero: CRUD de Tipos y facturas de su bodega | ✅ PASÓ | [permisos-bodeguero.test.js](permisos-bodeguero.test.js) |
| 35 | Contrato v2: bodegas propias, sin Usuarios y selector `/facturas/clientes` | ✅ PASÓ | [contrato-v2.test.js](contrato-v2.test.js) |
| 36 | Permisos: dar y quitar accesos al rol con `PUT /roles/{id}/permisos` | ⏳ Por ejecutar | [permisos-asignacion.test.js](permisos-asignacion.test.js) |

---

**36 archivos de test, 177 aserciones.** Ejecutar todo con `npm test`.

> Actualizado tras la respuesta del backend: login por `correo`/`contrasena`, roles `admin`/`bodeguero`/`cliente`, endpoint `/roles`, `GET /me` y normalización de errores 422.
>
> Los tests fuerzan `VITE_USE_MOCKS=true` en `vite.config.js`, así que funcionan aunque tu `.env` local esté en `false` para probar la API real.
