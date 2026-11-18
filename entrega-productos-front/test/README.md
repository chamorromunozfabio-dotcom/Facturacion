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
| 4 | Guardas del router: sin token y por rol | ⏳ Por ejecutar | [router-guards.test.js](router-guards.test.js) |
| 5 | CRUD con mocks: paginación y búsqueda | ⏳ Por ejecutar | [mocks-crud.test.js](mocks-crud.test.js) |
| 6 | Componente `PagePlaceholder` | ⏳ Por ejecutar | [page-placeholder.test.js](page-placeholder.test.js) |
| 7 | `LoginView`: validación y login demo | ⏳ Por ejecutar | [login-view.test.js](login-view.test.js) |
| 8 | `MainLayout`: menú por rol y logout | ✅ PASÓ | [main-layout.test.js](main-layout.test.js) |
| 9 | `DataTable`: filas, búsqueda, paginación y acciones | ✅ PASÓ | [data-table.test.js](data-table.test.js) |
| 10 | `FormModal`: campos, validación y eventos | ✅ PASÓ | [form-modal.test.js](form-modal.test.js) |
| 11 | `ConfirmDelete`: confirmación antes de borrar | ✅ PASÓ | [confirm-delete.test.js](confirm-delete.test.js) |
| 12 | `AlertMessage`: tipos y cierre | ✅ PASÓ | [alert-message.test.js](alert-message.test.js) |
| 13 | `TiposView`: listado y CRUD con componentes | ✅ PASÓ | [tipos-view.test.js](tipos-view.test.js) |
| 14 | `BodegasView`: listado y CRUD con componentes | ✅ PASÓ | [bodegas-view.test.js](bodegas-view.test.js) |
| 15 | Validación de formularios: `trim`, máximo y duplicados | ⏳ Por ejecutar | [form-validation.test.js](form-validation.test.js) |

---

**Serie completa: 8/8 ✅ — 34 aserciones.** Ejecutar todo con `npm test`.

> Actualizado tras la respuesta del backend: login por `correo`/`contrasena`, roles `admin`/`bodeguero`/`cliente`, endpoint `/roles`, `GET /me` y normalización de errores 422.
>
> Los tests fuerzan `VITE_USE_MOCKS=true` en `vite.config.js`, así que funcionan aunque tu `.env` local esté en `false` para probar la API real.
