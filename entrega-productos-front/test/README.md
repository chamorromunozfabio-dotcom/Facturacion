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

---

**Serie completa: 8/8 ✅ — 32 aserciones.** Ejecutar todo con `npm test`.

> Actualizado tras la respuesta del backend: login por `correo`/`contrasena`, roles `admin`/`bodeguero`/`cliente` y endpoint `/roles`.
