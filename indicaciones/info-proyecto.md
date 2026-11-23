# info-proyecto — resumen para responder preguntas

**Estado actual:** commit `1981030` en `main` · **57 archivos de test / 312 pruebas en verde** · `npm run build` correcto.
**Backend en vivo:** `http://192.168.20.49:8000` (/docs y /openapi.json). **Frontend dev:** `http://192.168.20.44:5173` (o `localhost:5173`).

---

## 1. Qué es y con qué está hecho

Sistema web de **entregas con facturas**: admin, bodeguero y cliente gestionan tipos de producto, bodegas, usuarios, roles, permisos, facturas y estadísticas. El backend manda los datos ya calculados; el front solo pinta y valida lo básico.

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3.5 (Composition API, `<script setup>`), Vue Router 5, Pinia 4, Axios 1.21 |
| Iconos y estilos | `@lucide/vue` (SVG), CSS puro + `<Transition>`; sin PrimeVue, Vuetify, Tailwind ni librerías de animación |
| Build y tests | Vite 8, Vitest 5, `@vue/test-utils`, jsdom 31, Node 22.18+ o 24.12+ |
| Backend | FastAPI (Python), JWT de 60 min; SQLAlchemy/MySQL según el instructivo inicial |
| Comunicación | REST JSON sobre HTTP, con proxy de Vite en `/api` |

---

## 2. Organización de carpetas y cómo se conectan

```text
entrega-productos-front/
├─ src/
│  ├─ views/              pantallas conectadas al router (FacturaView, EstadisticasView…)
│  ├─ components/
│  │  ├─ ui/              reutilizables: CrudPage, DataTable, FormModal, AlertMessage…
│  │  ├─ facturas/        form, detalle, filtros y modales de firma/rechazo
│  │  ├─ permisos/        matriz, buscador, cabecera y confirmación
│  │  ├─ estadisticas/    StatCard, BarrasPorEstado, SerieTiempo (CSS puro)
│  │  ├─ auth/            LoginForm (solo presentación)
│  │  └─ layout/          SidebarMenu y TopBar
│  ├─ composables/        lógica y efectos: useCrud, useFacturas, useLogin, useEstadisticas…
│  ├─ utils/              reglas puras sin Vue: fechas, validaciones, formateo
│  ├─ api/                axios.js, un archivo por recurso y mocks.js
│  ├─ config/             permissions.js, navigation.js, apiModes.js, sessionNotice.js
│  ├─ stores/auth.js      sesión global (token, usuario, permisos)
│  ├─ router/index.js     rutas + guardas por permiso
│  ├─ layouts/MainLayout.vue
│  └─ assets/main.css
├─ test/                  57 archivos de prueba
└─ .env.example
```

### Flujo de una pantalla: de la URL al backend

1. **`main.js`** arma Vue + Pinia; si hay token guardado, `auth.fetchMe()` valida con `GET /me`.
2. **`router/index.js`** elige la vista según la URL y pregunta a `auth.permisos` (con `tienePermiso()` de `config/permissions.js`) si puede entrar.
3. La **vista** (`views/`) pinta y delega: usa componentes de `components/` y llama a un **composable** (`composables/`).
4. El **composable** guarda el estado en refs, maneja carga/errores y llama a `utils/` (reglas puras) y `api/` (datos).
5. **`api/`** decide entre mocks o real según `config/apiModes.js`; **`api/axios.js`** agrega el `Bearer` del store y envía la petición con `baseURL=/api`.
6. Vite reenvía `/api` al backend; el JSON vuelve al composable, la vista se repinta y `AlertMessage` muestra el resultado.

### Mapa rápido: qué hay, quién lo llama y qué podés tocar

| Archivo / carpeta | Qué contiene | Quién lo llama | Cómo se comunica | Qué podés hacer ahí |
|---|---|---|---|---|
| `src/main.js` | Arranque de Vue, Pinia y refresco de sesión | El navegador al cargar | `auth.fetchMe()` → `GET /me` | Configuración global de arranque |
| `src/router/index.js` | Rutas y guardas por permiso | Vue Router | Lee `auth.permisos` + `tienePermiso()` | Agregar ruta, cambiar guarda o redirect |
| `src/stores/auth.js` | Token, usuario, rol y permisos | Router, vistas, Axios, `main.js` | Pinia + `localStorage` (`token`, `user`) | Login/logout y persistencia de sesión |
| `src/views/*.vue` | Pantallas con ruta (Inicio, Facturas, Estadísticas…) | Router | Props/events con componentes; llaman a composables | Textos, columnas, maquetación y slots |
| `src/components/ui/` | Genéricos: `CrudPage`, `DataTable`, `FormModal`, `AlertMessage` | Cualquier vista | Props hacia abajo, eventos (`update:page`, `update:q`) arriba | Mejorar reutilizables (afecta varias pantallas) |
| `src/components/facturas/` | Formulario, detalle, filtros, firma y rechazo | `FacturaView.vue` | Recibe datos del composable; emite acciones | Ajustar firma, estados o detalle |
| `src/components/permisos/` | Matriz, buscador y confirmación | `PermisosView.vue` | Usa `usePermisos` | Cambiar la matriz visual (catálogo es fijo) |
| `src/components/estadisticas/` | `StatCard`, `BarrasPorEstado`, `SerieTiempo` | `EstadisticasView.vue` | Recibe series del backend y pinta con CSS | Modificar gráficos sin librerías |
| `src/components/auth/LoginForm.vue` | Campos y validación visual del login | `LoginView.vue` | Emite `submit`; `useLogin` hace `POST /login` | Mensajes, botones demo y validación |
| `src/components/layout/` + `layouts/MainLayout.vue` | Sidebar, topbar y contenedor | Router (ruta padre) | `menuItems` de `config/navigation.js` | Menú, drawer hamburguesa y responsive |
| `src/composables/*.js` | Estado, carga y efectos (`useCrud`, `useFacturas`, `useEstadisticas`…) | Vistas | Llaman a `api/` y `utils/` | Lógica de pantalla sin ensuciar la vista |
| `src/utils/*.js` | Funciones puras (fechas, validación, formateo, errores) | Composables y tests | Entrada → salida, sin Vue ni HTTP | Reglas reutilizables y sus tests |
| `src/api/axios.js` | Cliente HTTP único e interceptores | Todos los `api/*.js` | Agrega `Bearer`; 401/403 centralizados | Token, errores y aviso de sesión vencida |
| `src/api/crud.js` + `api/<recurso>.js` | Llamadas REST por módulo | Composables | `list/get/create/update/remove` → `{ data, total, page, limit }` | Cambiar endpoints o parámetros |
| `src/api/mocks.js` | Datos falsos para demo y tests | `api/` con `VITE_USE_MOCKS=true` | Misma forma que la API real | Probar sin backend |
| `src/config/permissions.js` | Catálogo fijo de 30 permisos y matriz por rol | Router, menú y vistas | `tienePermiso()` sobre `auth.permisos` | Solo ajustar reglas de respaldo |
| `src/config/navigation.js` | Items del menú e iconos Lucide | `MainLayout.vue` | Filtra con `tienePermiso()` | Agregar/quitar opción del menú |
| `src/config/apiModes.js` | Interruptor mocks / API real | `api/*.js` | Lee `.env` (`VITE_USE_MOCKS`, `VITE_FACTURAS_MOCKS`) | Activar demo o integración |
| `src/config/sessionNotice.js` | Aviso de sesión vencida | Interceptor 401 y `LoginView` | `localStorage` + `ref` de Vue | Cambiar el mensaje al vencer |
| `src/assets/main.css` | Estilos globales, animaciones y media queries | Todas las vistas | Se importa en `main.js` | Colores, responsive y transiciones |
| `test/*.test.js` | 57 archivos / 312 pruebas | `npm test` (Vitest) | Importan módulos reales y simulan axios | Agregar tests antes de pedir “Pasa” |

Fuera del front:
- `ArchivosMD/` → contratos, mensajes al backend, respuestas del backend, checklist de prueba manual y el plan móvil.
- `indicaciones/` → instructivos iniciales de frontend/backend y este resumen.
- `Movil/` → envoltorio Capacitor (`android/`, `ios/` y `capacitor.config.json`) que carga el front desde Vite en desarrollo.
- El **código del backend no está en este repo**; solo sus contratos y la API en vivo.

**Regla de oro del código:** la vista no tiene lógica de negocio → llama a un *composable*; las reglas puras van a `utils/`; las llamadas HTTP van a `api/`. Si algo se repite en 3 pantallas, se extrae ("regla de 3").

---

## 3. Login, token y sesión

1. `POST /login` con JSON `{"correo":"...","contrasena":"..."}` (nunca `username`/`password` ni form-data).
2. Respuesta: `access_token` (JWT, **60 min**), `token_type` y `user` con `id`, `nombre`, `rol` y **`permisos`**.
3. Se guarda en `localStorage`: `token` y `user`. Pinia expone `auth.role`, `auth.userName`, `auth.permisos` e `isAuthenticated`.
4. Un **interceptor de Axios** agrega `Authorization: Bearer <token>` a cada petición; no se escribe a mano.
5. Al arrancar, `main.js` llama a `GET /me` para refrescar usuario y permisos.
6. **401 con sesión activa** → se limpia `localStorage`, queda el aviso “Tu sesión venció…” y redirige a `/login`. Un **401 de `/login`** se trata como credenciales incorrectas (sin aviso de vencimiento).
7. **403** → token válido pero sin permiso: muestra mensaje y **no** cierra la sesión.
8. Cerrar sesión limpia `localStorage` y vuelve al login.

El frontend **no decide permisos reales**: oculta menú y botones con `tienePermiso(...)` leyendo los permisos del backend; el backend revalida contra la BD en cada request. La matriz por rol es solo respaldo si la sesión no trae permisos. Admin tiene acceso total, excepto aceptar/rechazar facturas ajenas (backend devuelve 403).

---

## 4. Cómo se habla con el backend

- `VITE_API_URL=/api` es la `baseURL` de Axios. Vite reenvía `/api` a `VITE_BACKEND_URL` y **quita el header `Origin`**, así no hay preflight CORS aunque se abra desde otra IP. No se tocó CORS del backend.
- Listados: `?q=&page=1&limit=10`; respuesta `{ data, total, page, limit }`. Búsqueda con **debounce de 300 ms** y reset a página 1. `DataTable` emite `update:page` y `update:q`.
- Errores: `getErrorMessage()` convierte `detail` (string, lista de 422 o `message`) a texto; `getFieldErrors()` devuelve errores por campo; `isDuplicateError()` detecta nombres repetidos (400/409).
- Acciones de factura: `/facturas/{id}/entregar`, `/aceptar` (con firma), `/rechazar` (con motivo), `/recibir` y `/pdf` (blob con nombre del header `Content-Disposition`).
- Firma: `<canvas>` con mouse/touch → `data:image/png;base64,...`, base64 válido y **máx. 500 KB**; el front valida igual que el backend.
- Avisos flotantes: cierre automático a los **5 s**; `duration: 0` los deja fijos; el cierre manual cancela el temporizador.

### Endpoints principales

| Módulo | Rutas |
|---|---|
| Sesión | `POST /login`, `GET /me` |
| Catálogos | `/tipos`, `/bodegas`, `/usuarios`, `/roles`, `/permisos` (CRUD) |
| Permisos de usuario | `POST/DELETE /usuarios/{id}/permisos/{permiso_id}` |
| Facturas | `/facturas` (CRUD), `/facturas/clientes` y las 5 acciones indicadas arriba |
| Estadísticas | `GET /estadisticas/resumen?desde=&hasta=` |

### Modos de ejecución

`VITE_USE_MOCKS=true` → demo, todo falso. `false` → login y catálogos reales. `VITE_FACTURAS_MOCKS=false` → facturas reales. Los tests **fuerzan `true`** en `vite.config.js`, así que funcionan aunque el `.env` local apunte a la API.

---

## 5. Módulos y reglas por rol

| Rol | Menú | Datos que ve |
|---|---|---|
| admin | 8 módulos (Inicio, Tipos, Bodegas, Usuarios, Permisos, Roles, Facturas, Estadísticas) | **Todo global**: todas las facturas, bodegas, usuarios, top de productos |
| bodeguero | 5 (Inicio, Tipos, Bodegas, Facturas, Estadísticas) | Solo lo que él creó (`creado_por_id`) y sus bodegas |
| cliente | 3 (Inicio, Facturas, Estadísticas) | Solo sus facturas por `cliente_id` (más las que creó), sin contar `emitida` en las suyas |

“Órdenes” se eliminó: la orden es la factura; `/ordenes` y `/factura` redirigen a `/facturas`. No hay menú ni pantalla de Órdenes.

Los textos bajo el título son por rol en Inicio, Facturas y Estadísticas. Se quitaron los carteles informativos extra: queda solo esa descripción corta. **Admin = tono de supervisión global; bodeguero/cliente = “tus” cifras.**

**Estadísticas:** un solo endpoint; el backend filtra por token y manda tarjetas y series (`barras` y `por_fecha` tipo `linea`). `por_fecha` va día por día hasta 62 días y mes por mes después. El front pinta lo que llega con CSS puro (`SerieTiempo.vue`); `generado_para` es informativo y no se muestra. 

---

## 6. ¿Usamos buenas prácticas?

**Sí, en general:** capas bien separadas, código modular, lógica repetida extraída, cliente HTTP único, manejo centralizado de errores, permisos reales del backend con respaldo por rol, catálogo fijo de permisos (30, sin crear desde la UI), rutas con *lazy loading* y guardas, mocks aislados por entorno, 312 pruebas con `data-test` estables, animaciones CSS puras y documentación de arquitectura al día.

**Puntos a tener en cuenta / mejorar (no bloquean):**

- El JWT vive en `localStorage`: es lo habitual en una SPA simple, pero es vulnerable a XSS; lo ideal sería cookie `httpOnly` o almacenamiento seguro en la app móvil. Tampoco hay *refresh token*: a los 60 min hay que reingresar.
- Quedan **re-exports de compatibilidad** en la raíz de `components/`; se pueden borrar cuando no haya imports antiguos (código nuevo importa desde `ui/` o `components/<modulo>/`).
- Los instructivos iniciales y las bitácoras de `ArchivosMD/` se conservan como registro histórico, pero llevan una nota con el estado vigente. La fuente confiable es este archivo, `entrega-productos-front/README.md` y `src/ARQUITECTURA.md`.
- jsdom **no valida CSS real**: sigue pendiente la revisión visual en DevTools a **320 / 375 / 768 / 1024 px**.
- No hay configuración de CI en el repo; las pruebas se ejecutan con `npm test` manual.
- Para la versión móvil se decidió usar **Ionic Vue + Capacitor** (23-11-2026): reutiliza el código y los tests actuales. Flutter quedó descartado. Plan detallado en `ArchivosMD/PLAN_MOVIL.md`.

---

## 7. Comandos y datos rápidos

```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
npm run dev              # Vite con --host, expuesto en la red
npm test                 # 57 archivos / 312 pruebas
npm run build
```

`.env` para integración real: `VITE_API_URL=/api`, `VITE_BACKEND_URL=http://192.168.20.49:8000`, `VITE_USE_MOCKS=false`, `VITE_FACTURAS_MOCKS=false`. Hay que reiniciar Vite al cambiarlo.

**Cuentas reales:** admin `admin@entrega.com` / `Admin123*` · bodeguero `bodeguero@gmail.com` / `Bodega123*` · cliente `cliente@gmail.com` / `Cliente123*`.
**Demo (`VITE_USE_MOCKS=true`):** `luis@entrega.com` y `juan@cliente.com`, con botones de acceso rápido en el login.

**Números clave:** 30 permisos en el catálogo · 60 min de JWT · 500 KB máx. de firma · 5 s de avisos · 300 ms de debounce · 62 días para graficar por día · 312 pruebas.

**Flujo de trabajo acordado:** el asistente ajusta código y tests → el usuario ejecuta `npm test` → dice “Pasa” → recién entonces commit y push. Los 6 archivos `ArchivosMD` prohibidos nunca se commitean.
