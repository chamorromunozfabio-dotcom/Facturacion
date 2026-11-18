# Registro del chat — Proyecto "Entrega de Productos" (Frontend, Día 1)

**Fecha:** 17-11-2026
**Ubicación del proyecto:** `C:\Users\SOPORTE03\Pictures\Proyecto`
**Stack acordado:** Vue 3 + Vue Router + Pinia + Axios (frontend) / FastAPI + SQLAlchemy + MySQL (backend)
**Entrega:** lunes 23-11-2026

---

## Mensaje 1 — Usuario

> Somos 2 novatos y nos dieron ese proyecto para probar nuestras habilidades, yo soy frontend y mi compañero backend, vamos a usar vue para frontend y fastapi para backend, ayudanos desde 0 que debemos preguntarle a nuestro lider de proyecto y que informacion nos debe proporcionar para nosotros empezar a desarrollarlo
>
> Las tablas y bd nos las proporciona el, pero no sabemos como preguntar nada somos nuevos y es nuestro primer proyecto real, tenemos 5 dias y empezamos ya, asi que ayudame para saber que tengo que hacer y dame un paso a paso de que debo preguntar
>
> Voy a empezar a desarrollar este proyecto, dentro de la carpeta indicaiones encuentras todo lo que debes saber de este mismo si tienes alguna duda me preguntas, yo soy el dev frontend, asi que vamos con esta parte, estamos en el dia 1 asi que guiame paso a paso para hacer todo lo del dia 1 RECUERDA QUE YO SOLO SOY FRONTEND te doy informacion de backend para que no haya confusiones y todo marche bien al conectar mi parte de front con el backend de mi compañero

---

## Acciones previas del asistente

1. Leyó `indicaciones/frontend-entrega-productos.md` e `indicaciones/backend-entrega-productos.md`.
2. Verificó el entorno: **Node v26.13.0** y **npm 12.2.2**.
3. Creó el proyecto `entrega-productos-front` con `create-vue@latest --router --pinia --bare`.
4. Instaló dependencias y Axios.
5. Creó la estructura del Día 1 (API, mocks, store, router, layout, vistas, README y documento de preguntas).
6. Verificó `npm run build` (correcto) y el servidor de desarrollo en `http://127.0.0.1:5173` (HTTP 200).

---

## Mensaje 2 — Asistente (respuesta completa del Día 1)

¡Listo! Ya dejé el **Día 1 completo y compilando** en:

```
C:\Users\SOPORTE03\Pictures\Proyecto\entrega-productos-front
```

El servidor de desarrollo está corriendo en **http://127.0.0.1:5173**. Si lo cierras, lo vuelves a levantar con `npm run dev`.

### PASO 0 — Lo que le preguntas al líder HOY (antes de seguir)

Creé el archivo **`PREGUNTAS_PARA_LIDER.md`** en la carpeta `ArchivosMD` con el listado completo y un mensaje listo para copiar y pegar. Las **7 preguntas bloqueantes** son:

1. Nombre exacto de la BD y dónde está el `.sql` para importar en Laragon.
2. Campos de las 4 tablas (`tipos`, `bodegas`, `usuarios`, `permisos`): nombre, tipo, obligatorio y relaciones.
3. ¿Endpoints son `/tipos` o `/api/v1/tipos`?
4. `POST /login`: ¿`usuario`/`contraseña` o `username`/`password`?
5. ¿El token viene como `access_token` o `token`, y dónde van los datos del usuario?
6. Valores literales de los roles y qué ve cada uno.
7. Confirmar `{ data, total, page, limit }`, `{ detail }` y el nombre del parámetro de búsqueda (`q`, `search`...).

> **No te frenes por esto:** hoy trabajamos con mocks. Las respuestas llegan para el Día 2/3.

### PASO 1 — Entorno y proyecto creado

- Node v26.13.0 y npm 12.2.2 disponibles.
- Proyecto generado con `create-vue`: **Vue 3 + Router + Pinia + Axios**, sin TypeScript (más fácil para empezar).
- Instalado con `npm install` y `npm install axios`.
- Verificado: `npm run build` termina correctamente.

### PASO 2 — Variables de entorno y mocks

Archivos:
- `entrega-productos-front/.env`
- `entrega-productos-front/.env.example`

```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCKS=true
```

Con `VITE_USE_MOCKS=true` respondo yo con datos falsos; cuando tu compañero publique la API, cambias a `false` y reinicias. Está en `src/api/mocks.js`.

### PASO 3 — Axios listo para conectar con FastAPI

Archivo: `src/api/axios.js`

- `baseURL` = `VITE_API_URL`.
- Interceptor que agrega `Authorization: Bearer <token>` a **todas** las peticiones.
- Si el backend responde **401**, borra la sesión y manda al login.
- Helper `getErrorMessage()` para mostrar el `detail` que devuelva el backend.

Archivos de módulos: `src/api/tipos.js`, `bodegas.js`, `usuarios.js`, `permisos.js` (CRUD completo: `list`, `get`, `create`, `update`, `remove`).

### PASO 4 — Sesión (Pinia)

Archivo: `src/stores/auth.js`

- Guarda `token` y `user` en `localStorage`.
- `login()`, `logout()`, `isAuthenticated`, `role`, `userName`.
- En modo mock entra con cualquier usuario/contraseña.

### PASO 5 — Rutas y guardas

Archivo: `src/router/index.js`

- `/login` pública.
- `/`, `/tipos`, `/bodegas`, `/usuarios`, `/permisos`, `/ordenes`, `/factura` protegidas.
- Sin token → redirige a `/login?redirect=...`.
- `meta.roles` para validar por rol (valores **provisionales**, marcados con `TODO`).
- Ruta 404.

### PASO 6 — Layout responsive

Archivos:
- `src/layouts/MainLayout.vue` → menú lateral + barra superior con usuario y "Cerrar sesión".
- `src/config/navigation.js` → menú en un solo lugar; se filtra según el rol.
- En móvil el menú pasa a una fila horizontal con scroll.

### PASO 7 — Vistas base

- `src/views/LoginView.vue` → formulario funcionando ya (modo demo).
- `src/views/DashboardView.vue` → inicio con accesos a los módulos.
- `Tipos`, `Bodegas`, `Usuarios`, `Permisos`, `Órdenes`, `Factura` → placeholders con el día en que se construyen y lo que falta confirmar.
- `src/components/PagePlaceholder.vue` → componente reutilizable de esos placeholders.

### PASO 8 — Lo que DEBES HACER TÚ hoy (tu checklist)

1. **Envía el mensaje** de `PREGUNTAS_PARA_LIDER.md` a tu líder.
2. **Abre** `http://127.0.0.1:5173` → te debe mandar a `/login`.
3. **Entra** con cualquier usuario y contraseña (demo) → cae al inicio.
4. **Navega** por todos los módulos y prueba "Cerrar sesión".
5. **Prueba la guarda**: en DevTools → Application → Local Storage → borra `token` y recarga; debe volver al login.
6. **Prueba el responsive**: achica la ventana a menos de 768 px.
7. **Escríbele a tu compañero backend** confirmando: contrato `{ data, total, page, limit }`, error `{ detail }`, puerto `8000` y **CORS para `http://localhost:5173`**.
8. **Cuando tengas las respuestas del líder, pásamelas** y seguimos con el Día 2 (login real contra FastAPI).

### Reglas de oro para que front y back no choquen

- Tú **no** te conectas a MySQL ni calculas totales ni firmas: solo pintas lo que te da la API.
- El backend manda **401** (sin sesión) y **403** (sin permiso); tú solo muestras el mensaje.
- Si una respuesta no coincide con el contrato, mándale el **JSON exacto y el código HTTP** a tu compañero.
- Nada de "adivinar" campos: hasta que el líder confirme, todo está como `TODO` en el código.

### Lo que viene

**Día 2:** cambiar el login demo por `POST /login` real, guardar el JWT que devuelva tu compañero y afinar las guardas con los roles reales.

Cuando me traigas las respuestas del líder (o cuando el backend ya tenga `/docs` arriba), continuamos con ese paso. 🚀

---

## Mensaje 3 — Usuario

> Guardame el contenido de este chat en un .m y guardalo en la carpeta ArchivosMD

---

## Archivos generados durante la sesión

```
Proyecto/
├── indicaciones/
│   ├── backend-entrega-productos.md
│   └── frontend-entrega-productos.md
├── ArchivosMD/
│   ├── PREGUNTAS_PARA_LIDER.md
│   ├── chat-dia1-frontend.md
│   ├── chat-dia1-frontend.m
│   └── respuesta-al-backend.md
└── entrega-productos-front/
    ├── .env
    ├── .env.example
    ├── README.md
    ├── package.json
    ├── test/
    │   ├── README.md
    │   ├── getErrorMessage.test.js
    │   ├── auth-store.test.js
    │   ├── axios-interceptors.test.js
    │   ├── router-guards.test.js
    │   ├── mocks-crud.test.js
    │   ├── page-placeholder.test.js
    │   ├── login-view.test.js
    │   └── main-layout.test.js
    └── src/
        ├── api/{axios.js, crud.js, mocks.js, tipos.js, bodegas.js, usuarios.js,
        │         permisos.js, roles.js}
        ├── assets/main.css
        ├── components/PagePlaceholder.vue
        ├── config/navigation.js
        ├── layouts/MainLayout.vue
        ├── router/index.js
        ├── stores/auth.js
        └── views/{LoginView, DashboardView, TiposView, BodegasView, UsuariosView,
                   PermisosView, RolesView, OrdenesView, FacturaView,
                   NotFoundView}.vue
```

---

## Mensajes posteriores (logo, tests y respuesta del backend)

### Logo

- El usuario pidió poner como logo el archivo `public/logo.png` (2048×2048).
- Se integró en `MainLayout.vue` (40×40), `LoginView.vue` (72×72) y como favicon en `index.html`.
- También se cambió el título de la pestaña a **"Entrega de Productos"** y `lang="es"`.

### Suite de tests unitarios (Vitest)

- El usuario aclaró que quería **tests unitarios con Vitest**, no pruebas manuales.
- Se eliminaron los archivos manuales y se instalaron `vitest`, `jsdom` y `@vue/test-utils`.
- Se configuró `vite.config.js` y los scripts `npm test` / `npm run test:watch`.
- Se crearon los 8 tests, uno por vez, ejecutándolos el usuario y reportando `Pasa`:

| # | Test | Archivo |
|---|------|---------|
| 1 | `getErrorMessage` | `getErrorMessage.test.js` |
| 2 | Store de autenticación | `auth-store.test.js` |
| 3 | Interceptores de Axios | `axios-interceptors.test.js` |
| 4 | Guardas del router | `router-guards.test.js` |
| 5 | CRUD con mocks | `mocks-crud.test.js` |
| 6 | `PagePlaceholder` | `page-placeholder.test.js` |
| 7 | `LoginView` | `login-view.test.js` |
| 8 | `MainLayout` | `main-layout.test.js` |

Resultado final: **8 archivos, 32 aserciones ✅**.

### Mensaje 4 — Usuario (respuesta del backend)

> Listo. Mi compañero del backend me respondió lo siguiente:
>
> 1) Base de datos: nombre `entrega_productos` (MySQL, Laragon). No hay script `.sql`: la BD se crea vacía y las tablas las genera el backend al arrancar.
> 2) Campos: `tipos` (id, nombre); `bodegas` (id, nombre, direccion opcional; pueden cambiar cuando el líder defina "quién recibe"); `permisos` (id, nombre, descripcion); tabla nueva `roles` (id, nombre, descripcion, relación muchos a muchos con permisos vía `rol_permiso`); `usuarios` (id, nombre, correo, contrasena solo envío, rol_id FK a roles). Sin fechas ni booleanos.
> 3) Rutas sin prefijo: `/tipos`, `/bodegas`, `/usuarios`, `/permisos` y además `/roles` para el selector de rol. Patrón CRUD completo. Login el Día 2, Tipos/Bodegas el Día 3, Usuarios/Permisos el Día 4.
>
> Me pidió decidir: login (correo + contrasena y forma de la respuesta), roles (admin, bodeguero, cliente como suposición), campos de "quién recibe" en Bodegas, y unificar errores 422 como `{ detail }`.

### Mensaje 5 — Asistente (decisiones y cambios aplicados)

**Decisiones:**

1. **Login:** `POST /login` con `{ "correo": "...", "contrasena": "..." }`. Respuesta `{ "access_token": "<jwt>", "user": { "id", "nombre", "correo", "rol": "admin" } }`. Pedir `rol` como string; el store también acepta `{ id, nombre }`. Error 401 con `{ detail }`.
2. **Roles provisionales:** `admin`, `bodeguero`, `cliente`. Matriz: admin = todo; bodeguero = Inicio, Tipos, Bodegas, Órdenes, Factura; cliente = Inicio, Órdenes, Factura. Pendiente de confirmar por el líder.
3. **Bodegas:** mantener `nombre` + `direccion` opcional y preguntar al líder por "quién recibe".
4. **Errores 422:** unificar todos como `{ "detail": "texto legible" }`.

**Cambios en el código:**

- `src/views/LoginView.vue`: campos `correo` / `contrasena` (input `type="email"`).
- `src/stores/auth.js`: `userName` usa `correo`; `role` acepta string u objeto `{ id, nombre }`.
- `src/api/mocks.js`: campos reales + roles provisionales + filas de `roles`.
- `src/config/navigation.js` y `src/router/index.js`: nuevos roles y ruta `/roles`.
- `src/api/roles.js` y `src/views/RolesView.vue`: módulo nuevo.
- Tests actualizados y ampliados: **32 aserciones ✅**.
- `npm run build` también pasa ✅.

**Archivos de apoyo creados/actualizados:**

- `ArchivosMD/respuesta-al-backend.md` → mensaje para el compañero backend.
- `ArchivosMD/PREGUNTAS_PARA_LIDER.md` → estado de lo resuelto y lo pendiente con el líder.

**Mensaje para el backend (resumen):**

> Confirmado: login con `correo` + `contrasena`, respuesta `{ access_token, user: {... rol: "admin" } }`, roles provisionales `admin/bodeguero/cliente`, y todos los errores (incluido 422) como `{ detail }`. Ya lo apliqué en el front. Agregué también `/roles`. Avisame cuando publiques `/login` para probar con `VITE_USE_MOCKS=false`.

**Próximo paso:** cuando el backend publique `POST /login`, cambiar `VITE_USE_MOCKS=false` en `.env`, reiniciar `npm run dev` y probar con un correo real de la BD.

---

## Mensaje 6 — Usuario (nuevas respuestas del backend)

> El backend confirmó:
>
> 4. `POST /login` espera JSON con `correo` y `contrasena` (sin ñ), no form-data. Ejemplo `{ "correo": "admin@entrega.com", "contrasena": "Admin123*" }`. Si el correo no es válido responde 422.
> 5. Respuesta: `{ "access_token": "eyJ...", "token_type": "bearer", "user": { "id": 1, "nombre": "Administrador", "correo": "admin@entrega.com", "rol": "admin" } }`. `rol` es texto. El token vence en 60 min. Las rutas usan `Authorization: Bearer <token>`. Para recuperar la sesión al recargar existe `GET /me`, que devuelve el mismo `user`.
> 6. Roles exactos: `admin`, `bodeguero`, `cliente` (minúsculas, sin tildes, provisionales). Descripciones del seed: admin administra todo; bodeguero gestiona bodegas, productos y entregas; cliente consulta y recibe sus entregas. Aún no hay permisos reales: solo `GET /solo-admin` temporal; tabla `permisos` vacía.
> 7. Errores 401/403 con `{ "detail": "texto" }` y mensajes concretos. Excepción: los 422 siguen con `detail` como lista de FastAPI, falta normalizar. Listados `{ data, total, page, limit }` aún no definidos. Parámetro de búsqueda recomendado `q` con `page` y `limit`, pendiente de confirmación del frontend.

## Mensaje 7 — Asistente (ajustes aplicados)

**Decisiones y cambios:**

1. **422 normalizados en el front:** `getErrorMessage()` ahora convierte `detail` lista en texto (`correo: value is not a valid email address · contrasena: field required`). Se agregó un test.
2. **`GET /me` al arrancar:** `auth.fetchMe()` se llama desde `main.js` si hay token guardado. Si el token de 60 min venció, el interceptor 401 limpia la sesión y manda al login.
3. **Roles:** confirmados como `admin`, `bodeguero`, `cliente` (provisionales). Se anotó que solo existe `/solo-admin` y que la tabla `permisos` está vacía.
4. **Búsqueda:** confirmamos `q` + `page` + `limit` por nuestra parte; el formato de listados queda pendiente hasta que publiquen el primer CRUD.
5. **Tests independientes del `.env` local:** el `.env` estaba en `VITE_USE_MOCKS=false` para probar el backend real, así que se fijó `VITE_USE_MOCKS: 'true'` dentro de `vite.config.js` → `test.env`.

**Verificación:** `npm test` → 8 archivos, **34 aserciones ✅**. `npm run build` ✅.

**Documentación actualizada:** `README.md`, `test/README.md`, `ArchivosMD/PREGUNTAS_PARA_LIDER.md` y `ArchivosMD/respuesta-al-backend.md`.

**Estado del repo:** cambios subidos a `https://github.com/chamorromunozfabio-dotcom/Facturacion.git` en el commit `93c8e6b` (_Ajustar frontend a respuestas del backend: /me, errores 422 y búsqueda q_).

---

## Mensaje 8 — Usuario

> http://192.168.20.49:8000/docs acá está lo del backend

## Mensaje 9 — Asistente (verificación del backend real)

- `/docs` respondió **200** y el título del OpenAPI es **"Entrega de Productos"**.
- Endpoints publicados por ahora: `/login`, `/me`, `/solo-admin` y `/` (health).
- Los schemas coinciden con el contrato del frontend:
  - `LoginRequest`: `correo` (email) y `contrasena`, ambos obligatorios.
  - `LoginResponse`: `access_token`, `token_type` y `user`.
  - `UserOut`: `id`, `nombre`, `correo`, `rol` (string).
  - `HTTPValidationError`: `detail` como lista (422).
- Prueba real exitosa:
  - `POST /login` con `admin@entrega.com` / `Admin123*` → token recibido.
  - `GET /me` con `Bearer <token>` → mismo usuario.
  - `GET /solo-admin` → `{"mensaje":"Acceso de administrador"}`.
- CORS verificado: `Access-Control-Allow-Origin: http://localhost:5173`.
- Se actualizó `.env` local con `VITE_API_URL=http://192.168.20.49:8000` (manteniendo `VITE_USE_MOCKS=false`). `.env` no se sube al repo; `.env.example` sí documenta la IP de ejemplo.
- Servidor de desarrollo reiniciado en `http://localhost:5173` (HTTP 200).

**Conclusión:** el frontend ya está apuntando al backend real; queda probar el login desde el navegador.

---

## Mensaje 10 — Usuario

> Listo ahora como lo arranco aca para que el pueda ver mi frontend funcionando tambien

## Mensaje 11 — Asistente (exponer el frontend en la red)

**Problema detectado:** la IP de esta PC es `192.168.20.44`. El backend solo permite CORS para `http://localhost:5173`, así que al abrir `http://192.168.20.44:5173` el login daba `400 Disallowed CORS origin`.

**Solución aplicada (sin tocar el backend):**

1. `npm run dev` ahora es `vite --host` y `vite.config.js` tiene `server.host: '0.0.0.0'`. Vite muestra la línea **Network** con la IP.
2. Se agregó un proxy en Vite: el navegador llama a `/api` (mismo origen) y Vite lo reenvía a `VITE_BACKEND_URL` (`http://192.168.20.49:8000`), quitando la cabecera `Origin`. No hay preflight CORS.
3. `.env`: `VITE_API_URL=/api` + `VITE_BACKEND_URL=http://192.168.20.49:8000`. `.env.example` actualizado con las dos variables.

**Verificación desde la IP de red (con `Origin: http://192.168.20.44:5173`):**

- `GET http://192.168.20.44:5173/` → **200**
- `GET /api/me` sin token → **401** `{"detail":"No ha iniciado sesión"}` (el proxy llegó al backend)
- `POST /api/login` con `admin@entrega.com` / `Admin123*` → **OK**, usuario `Administrador`, rol `admin`
- `GET /api/me` con `Bearer <token>` → **OK**, mismo usuario
- `npm test` → 8 archivos, **34 aserciones ✅**
- `npm run build` → ✅

**Incidencia intermedia:** al importar `loadEnv` desde `vitest/config` falló el arranque (`does not provide an export named 'loadEnv'`). Se corrigió importándolo desde `vite`.

**URL para el compañero:** `http://192.168.20.44:5173/`. Si no conecta, permitir el puerto 5173 TCP en el firewall de Windows (red privada).

**Documentación actualizada:** `README.md` con la sección "Ver el frontend desde otra PC de la red".

---

## Mensaje 12 — Usuario (backend: CRUD de Tipos publicado)

> El backend publicó el CRUD de Tipos con este contrato:
>
> 1. Campos: `id` (generado), `nombre` (obligatorio al crear, opcional al editar, 1-100 caracteres, se recorta, único sin distinguir mayúsculas).
> 2. `POST /tipos` → 201 con el registro. `PUT /tipos/5` → 200 con el registro; solo cambia los campos enviados, `null` se ignora. `GET /tipos/5` → 200. `DELETE /tipos/5` → 204 sin cuerpo.
> 3. `GET /tipos?q=&page=1&limit=10` → `{ data, total, page, limit }`. `total` cuenta todos los filtrados, orden por `id`, `page` empieza en 1, `limit` por defecto 10 y máximo 100 (si se pasa, 422).
> 4. `q` confirmado: coincidencias parciales sin distinguir mayúsculas.
> 5. Errores, todos con `detail` texto (incluidos 422): 401 sin token / token vencido, 403 sin permiso, 404 `Tipo no encontrado`, 400 `Ya existe un tipo con ese nombre` (no 409), 422 validación. Los 422 de `page`/`limit` todavía están en inglés, el backend los traducirá.
> 6. Todos exigen Bearer; solo `admin` y `bodeguero` (cliente → 403).
> 7. DELETE responde 204 sin cuerpo: no leer JSON.
>
> Bodegas: mismo patrón con `nombre` y `direccion`; lo de "quién recibe" espera al líder.
> Día 4: el backend bloquea con 403, ya existe el mecanismo; falta que el líder confirme roles (propuesta: admin todo; bodeguero tipos, bodegas y órdenes; cliente solo ver y recibir sus órdenes).
> Día 5: firma propuesta como texto base64 PNG completo (`data:image/png;base64,...`) desde un canvas. Resto de órdenes/factura pendiente del líder.
> CORS: el proxy de Vite les parece bien, no cambian nada.

## Mensaje 13 — Asistente (ajustes aplicados con OK del usuario)

**Día 3 completado antes de este mensaje:**

- Componentes reutilizables: `DataTable` (Test 9), `FormModal` (Test 10), `ConfirmDelete` (Test 11), `AlertMessage` (Test 12).
- `TiposView` (Test 13) y `BodegasView` (Test 14): listado con `q`/`page`/`limit`, crear, editar, eliminar con confirmación y alertas. Los mocks se actualizan en local porque no persisten.

**Ajustes al contrato del backend (Test 15, aprobado por el usuario):**

1. `FormModal` hace `trim()` de los valores y valida `maxLength` antes de enviar. Error: `Nombre no puede superar los 100 caracteres.`
2. `TiposView` y `BodegasView` definen `nombre` con `maxLength: 100`.
3. El `PUT` envía solo los campos cambiados; si no hay cambios, muestra "No hay cambios para guardar." y no llama a la API. La fila local se fusiona con la respuesta.
4. Nuevo helper `isDuplicateError()` en `src/api/axios.js`: detecta duplicados en **400 y 409** y muestra "Ya existe un tipo/bodega con ese nombre. Probá con otro."

**No se cambió:** la matriz de roles (espera al líder) ni la firma (Fase 2).

**Verificación:**

- `npm test` → 15 archivos, todos en verde (el usuario confirmó "Pasa" test por test).
- Prueba real solo de lectura contra `http://192.168.20.44:5173/api`:
  - Front 200, login OK (`admin`), `GET /tipos?q=ALI&page=1&limit=10` → `{ data: [], total: 0, page: 1, limit: 10 }`, sin token → `401 {"detail":"No ha iniciado sesión"}`.
  - La tabla `tipos` está vacía en la BD por ahora; no se insertaron datos de prueba.

**Pendiente:** que el líder confirme roles, campos de "quién recibe" y el contrato de órdenes/factura; que el backend traduzca los 422 de `page`/`limit`.

---

## Mensaje 14 — Usuario (entrega del contrato y respuestas del líder)

> Revisa `CONTRATO_FACTURAS.MD` en la carpeta ArchivosMD.
>
> Dame las preguntas para el backend que es el mismo líder y toma las decisiones.
>
>¡Hola! Te confirmo todo para que arranques sin volver a preguntar. (Respuestas 1 a 11: menú solo Facturas, bodeguero solo lectura en Tipos/Bodegas y solo clientes en Usuarios, filtros, transiciones, firma data URL PNG de 500 KB, PDF con blob, selector de tipos, campos nuevos de Bodega y Usuario.)

## Mensaje 15 — Asistente (Días 4 y 5 completados)

**Preguntas enviadas (11 puntos).** El líder respondió todas. Se aplicó sin volver a preguntar.

### Día 4 — Roles, permisos, Bodegas y Usuarios

| Test | Cambio |
|---|---|
| 16 | `src/config/permissions.js` con la matriz definitiva. Menú sin "Órdenes", Facturas en `/facturas`, rutas viejas redirigen. |
| 17 | `DataTable` acepta `canCreate`/`canEdit`/`canDelete`; el bodeguero ve listados sin botones de cambio. |
| 18 | Bodegas con 8 campos, columnas sugeridas y validaciones (teléfono 7-20, correo, documento ≤ 20). `FormModal` soporta `pattern`, `message` y `type: 'email'`. |
| 19 | Usuarios con `select`, campos condicionales de cliente, `rol_id` numérico, `?rol=cliente` forzado al bodeguero y contraseña opcional al editar. |

### Día 5 — Facturas

| Test | Cambio |
|---|---|
| 20 | `SignaturePad`: canvas con eventos `pointer`, data URL PNG, botón Limpiar y límite de 500 KB. |
| 21 | `src/api/facturas.js`: `entregar`, `aceptar`, `rechazar`, `recibir`, `descargarPdf`, `validateFirma()`, `filenameFromDisposition()` y `triggerDownload()`. Mocks con 5 estados. |
| 22 | `FacturaDetail`: emisor, adquiriente, bodega, líneas, totales, validación electrónica, software y trazabilidad con firma/motivo. |
| 23 | `FacturaForm`: líneas dinámicas, precarga de descripción desde `tipos`, fecha de vencimiento condicional y validaciones del backend. |
| 24 | `FacturaView`: listado con `q`/`estado`, acciones por estado y rol, modales de firma y rechazo, detalle y descarga de PDF. `DataTable` ganó un slot `#actions`. |

**Corrección durante el Test 24:** dos tests fallaron porque montaban la vista con rol `admin` y buscaban los botones Aceptar/Rechazar, que son exclusivos del `cliente`. Se cambió el rol en esos tests; el componente estaba bien.

**Verificación final:**

- `npm test` → **24 archivos, 128 aserciones**, todos en verde (el usuario confirmó "Pasa" test por test).
- `npm run build` → correcto (126 módulos, `dist/` generado).
- Rama `main` con commit pendiente de subir.

**Pendiente ahora solo del backend:** publicar Bodegas, Usuarios y Facturas; aplicar el `403` de bodeguero en Tipos/Bodegas; traducir los 422 de `page`/`limit`.
