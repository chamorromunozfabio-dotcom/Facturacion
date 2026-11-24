# info-proyecto — resumen para responder preguntas

**Estado actual:** último commit en `main` · **67 archivos de test / 352 pruebas en verde** · `npm run build` correcto. **Fase 2 móvil cerrada y validada en navegador + emulador.**
**Backend en vivo:** `http://192.168.20.49:8000` (/docs y /openapi.json). **Frontend dev:** `http://192.168.20.44:5173` (o `localhost:5173`).

---

## 1. Qué es y con qué está hecho

Sistema web de **entregas con facturas**: admin, bodeguero y cliente gestionan tipos de producto, bodegas, usuarios, roles, permisos, facturas y estadísticas. El backend manda los datos ya calculados; el front solo pinta y valida lo básico. La misma app se empaqueta para móvil con Capacitor, sin código duplicado (ver sección 8).

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3.5 (Composition API, `<script setup>`), Vue Router 5, Pinia 4, Axios 1.21 |
| Iconos y estilos | `@lucide/vue` (SVG), CSS puro + `<Transition>`; sin PrimeVue, Vuetify, Tailwind ni librerías de animación |
| Build y tests | Vite 8, Vitest 5, `@vue/test-utils`, jsdom 31, Node 22.18+ o 24.12+ |
| Backend | FastAPI (Python), JWT de 60 min + refresh token de 7 días; SQLAlchemy/MySQL según el instructivo inicial |
| Comunicación | REST JSON sobre HTTP, con proxy de Vite en `/api` (web) y `baseURL` directa en el APK |
| Móvil | Ionic Vue 9 + Capacitor 8, `@capacitor/filesystem`, `@capacitor/share` y `@capacitor/preferences` |

---

## 2. Organización de carpetas y cómo se conectan

```text
entrega-productos-front/
├─ src/
│  ├─ views/              pantallas conectadas al router (FacturaView, EstadisticasView…)
│  ├─ components/
│  │  ├─ ui/              reutilizables: CrudPage, DataTable, FormModal, AlertMessage,
│  │  │                  ModalBase, BotonBase, CampoNative…
│  │  ├─ facturas/        form, detalle, filtros y modales de firma/rechazo
│  │  ├─ permisos/        matriz, buscador, cabecera y confirmación
│  │  ├─ estadisticas/    StatCard, BarrasPorEstado, SerieTiempo (CSS puro)
│  │  ├─ auth/            LoginForm (solo presentación)
│  │  └─ layout/          SidebarMenu y TopBar
│  ├─ composables/        lógica y efectos: useCrud, useFacturas, useLogin, useEstadisticas…
│  ├─ utils/              reglas puras sin Vue: fechas, validaciones, formateo
│  ├─ api/                axios.js, un archivo por recurso y mocks.js
│  ├─ config/             permissions.js, navigation.js, apiModes.js, sessionNotice.js,
│  │                      sessionTokens.js (único punto de persistencia de sesión)
│  ├─ stores/auth.js      sesión global (token, usuario, permisos)
│  ├─ router/index.js     rutas + guardas por permiso
│  ├─ layouts/
│  │  ├─ MainLayout.vue   coordina menú, logout y navegación
│  │  └─ LayoutBase.vue   grid en web / IonMenu + IonHeader + IonContent en móvil
│  └─ assets/main.css
├─ test/                  67 archivos de prueba
└─ .env.example
```

### Flujo de una pantalla: de la URL al backend

1. **`main.js`** hidrata la sesión (`hydrateSession()`) y arma Vue + Pinia; si hay token, `auth.fetchMe()` valida con `GET /me`.
2. **`router/index.js`** elige la vista según la URL y pregunta a `auth.permisos` (con `tienePermiso()` de `shared/config/permissions.js`) si puede entrar.
3. La **vista** (`modules/<modulo>/views/`) pinta y delega: usa componentes de su módulo y llama a un **composable** (`modules/<modulo>/composables/`).
4. El **composable** guarda el estado en refs, maneja carga/errores y llama a `modules/<modulo>/utils/` (reglas puras) y `modules/<modulo>/api/` (datos).
5. **`modules/<modulo>/api/`** decide entre mocks o real según `shared/config/apiModes.js`; **`shared/api/axios.js`** agrega el `Bearer` leído de `sessionTokens.js` y envía la petición con `baseURL=/api`.
6. Vite reenvía `/api` al backend; el JSON vuelve al composable, la vista se repinta y `AlertMessage` muestra el resultado.

### Mapa rápido: qué hay, quién lo llama y qué podés tocar

| Archivo / carpeta | Qué contiene | Quién lo llama | Cómo se comunica | Qué podés hacer ahí |
|---|---|---|---|---|
| `src/main.js` | Arranque, hidratación de sesión y refresco con `/me` | El navegador / WebView al cargar | `hydrateSession()` → `auth.fetchMe()` | Configuración global de arranque |
| `src/router/index.js` | Rutas y guardas por permiso | Vue Router | Lee `auth.permisos` + `tienePermiso()` | Agregar ruta, cambiar guarda o redirect |
| `src/stores/auth.js` → `src/modules/auth/store/auth.js` | Token, usuario, rol y permisos | Router, vistas, Axios, `main.js` | Pinia + `modules/auth/config/sessionTokens.js` | Login/logout y sesión (nunca localStorage directo) |
| `src/modules/auth/config/sessionTokens.js` | `token`, `refresh_token` y `user` | Store y `shared/api/axios.js` | `localStorage` en web, Preferences + cache en móvil | Único punto para cambiar persistencia |
| `src/modules/*/views/*.vue` | Pantallas con ruta (Inicio, Facturas, Estadísticas…) | Router (ensambla `modules/*/routes`) | Props/events con componentes; llaman a composables | Textos, columnas, maquetación y slots |
| `src/shared/ui/` | Genéricos: `CrudPage`, `DataTable`, `FormModal`, `ModalBase`, `BotonBase`, `CampoNative`, `AlertMessage` | Cualquier vista | Props hacia abajo, eventos (`update:page`, `update:q`) arriba | Mejorar reutilizables (afecta varias pantallas) |
| `src/modules/facturas/components/` | Formulario, detalle, filtros, firma y rechazo | `FacturaView.vue` | Recibe datos del composable; emite acciones | Ajustar firma, estados o detalle |
| `src/modules/permisos/components/` | Matriz, buscador y confirmación | `PermisosView.vue` | Usa `usePermisos` | Cambiar la matriz visual (catálogo es fijo) |
| `src/modules/estadisticas/components/` | `StatCard`, `BarrasPorEstado`, `SerieTiempo` | `EstadisticasView.vue` | Recibe series del backend y pinta con CSS | Modificar gráficos sin librerías |
| `src/modules/auth/components/LoginForm.vue` | Campos y validación visual del login | `LoginView.vue` | Emite `submit`; `useLogin` hace `POST /login` | Mensajes, botones demo y validación |
| `src/modules/layout/` | Sidebar, topbar, `MainLayout`, `LayoutBase` | Router (ruta padre) | `menuItems` de `shared/config/navigation.js` | Menú, drawer hamburguesa, shell Ionic y responsive |
| `src/modules/*/composables/` | Estado, carga y efectos (`useCrud`, `useFacturas`, `useEstadisticas`…) | Vistas | Llaman a `api/` y `utils/` del módulo | Lógica de pantalla sin ensuciar la vista |
| `src/modules/*/utils/` | Funciones puras (fechas, validación, formateo, errores) | Composables y tests | Entrada → salida, sin Vue ni HTTP | Reglas reutilizables y sus tests |
| `src/shared/api/axios.js` | Cliente HTTP único e interceptores | Todos los `modules/*/api/` | Agrega `Bearer`; 401/403 centralizados | Token, errores y aviso de sesión vencida |
| `src/modules/catalogos/api/crud.js` + `modules/*/api/<recurso>.js` | Llamadas REST por módulo | Composables | `list/get/create/update/remove` → `{ data, total, page, limit }` | Cambiar endpoints o parámetros |
| `src/shared/api/mocks.js` | Datos falsos para demo y tests | `modules/*/api/` con `VITE_USE_MOCKS=true` | Misma forma que la API real | Probar sin backend |
| `src/shared/config/permissions.js` | Catálogo fijo de 30 permisos y matriz por rol | Router, menú y vistas | `tienePermiso()` sobre `auth.permisos` | Solo ajustar reglas de respaldo |
| `src/shared/config/navigation.js` | Items del menú e iconos Lucide | `MainLayout.vue` | Filtra con `tienePermiso()` | Agregar/quitar opción del menú |
| `src/shared/config/apiModes.js` | Interruptor mocks / API real | `modules/*/api/` | Lee `.env` (`VITE_USE_MOCKS`, `VITE_FACTURAS_MOCKS`) | Activar demo o integración |
| `src/modules/auth/config/sessionNotice.js` | Aviso de sesión vencida | Interceptor 401 y `LoginView` | `localStorage` + `ref` de Vue | Cambiar el mensaje al vencer |
| `src/shared/assets/main.css` | Estilos globales, animaciones y media queries | Todas las vistas | Se importa en `main.js` | Colores, responsive y transiciones |
| `test/*.test.js` | 67 archivos / 352 pruebas | `npm test` (Vitest) | Importan módulos reales y simulan axios/plugins | Agregar tests antes de pedir “Pasa” |

Fuera del front:
- `Movil/` → capa nativa con Capacitor (**Fase 2 cerrada**: login, sesión, facturas, firma, PDF, avisos, menú nativo, estadísticas, catálogos y permisos, validado en emulador). `capacitor.config.json` es de **producción** (sin `server.url`); `capacitor.config.dev.json` conserva el modo Vite. `webDir` apunta al `dist` del front. Ver sección 8 y `ArchivosMD/PLAN_MOVIL.md`.
- `ArchivosMD/` → contratos, mensajes al backend, respuestas del backend, checklist de prueba manual y el plan móvil.
- `indicaciones/` → instructivos iniciales de frontend/backend y este resumen.
- El **código del backend no está en este repo**; solo sus contratos y la API en vivo.

**Regla de oro del código:** la vista no tiene lógica de negocio → llama a un *composable*; las reglas puras van a `modules/<modulo>/utils/`; las llamadas HTTP van a `modules/<modulo>/api/`. Si algo se repite en 3 pantallas, se extrae a `shared/` ("regla de 3").

**Validaciones de solo números (`ArchivosMD/RESPUESTA_SOLO_NUMEROS.md`):** el backend rechaza con 422 los textos en campos numéricos. El front convierte antes de enviar (`Number(...)`: `rol_id`, `cliente_id`, `bodega_id`, `tipo_id`, `cantidad`, `precio_unitario`, `descuento_porcentaje`, `iva_porcentaje`) y valida: cantidad > 0 con hasta 2 decimales, precio ≥ 0 con hasta 2 decimales, descuento 0–100 con hasta 2 decimales, IVA en {0, 5, 19}. En Usuarios, `numero_documento` solo acepta dígitos (PA acepta también letras, sin símbolos) y `telefono` solo dígitos de 7 a 15. Vacíos: los opcionales se omiten (`quitarVacios`), los obligatorios muestran aviso en el campo. `FormModal` valida `required`, `maxLength`, `minLength`, `pattern`, email y números con `min`/`max`.

---

## 3. Login, token y sesión

1. `POST /login` con JSON `{"correo":"...","contrasena":"..."}` (nunca `username`/`password` ni form-data).
2. Respuesta: `access_token` (JWT, **60 min**), `refresh_token` (**7 días**, rotativo), `token_type` y `user` con `id`, `nombre`, `rol` y **`permisos`**.
3. Se guarda en **`localStorage` en la web** y en **`@capacitor/preferences` en el móvil**: `token`, `refresh_token` y `user`. Único punto de acceso: `src/config/sessionTokens.js`. Como Preferences es async, `main.js` llama a `hydrateSession()` antes de crear el store y una cache en memoria mantiene la API síncrona que consumen axios y Pinia. Pinia expone `auth.role`, `auth.userName`, `auth.permisos` e `isAuthenticated`.
4. Un **interceptor de Axios** agrega `Authorization: Bearer <access_token>` a cada petición; no se escribe a mano.
5. Al arrancar, `main.js` llama a `GET /me` para refrescar usuario y permisos.
6. **401 con sesión activa** → se llama una sola vez a `POST /refresh` con `{ "refresh_token": "..." }`; se guardan los dos tokens nuevos (rotación) y se reintenta la petición original. Si el refresh falla, se limpia la sesión, queda el aviso “Tu sesión venció…” y redirige a `/login`. Un **401 de `/login`** o de `/refresh` no dispara otra renovación.
7. **403** → token válido pero sin permiso: muestra mensaje y **no** cierra la sesión.
8. Cerrar sesión limpia la sesión (web o Preferences) y vuelve al login.

El frontend **no decide permisos reales**: oculta menú y botones con `tienePermiso(...)` leyendo los permisos del backend; el backend revalida contra la BD en cada request. La matriz por rol es solo respaldo si la sesión no trae permisos. Admin tiene acceso total, excepto aceptar/rechazar facturas ajenas (backend devuelve 403).

---

## 4. Cómo se habla con el backend

- En desarrollo `VITE_API_URL=/api` es la `baseURL` de Axios y Vite reenvía `/api` a `VITE_BACKEND_URL` quitando el header `Origin`. En el build móvil de producción, `.env.production` cambia la `baseURL` a `http://192.168.20.49:8000` porque dentro del WebView no hay proxy. Capacitor 8 se configura con `server.androidScheme: "http"` para que el origen sea `http://localhost` (si fuera `https://localhost`, el WebView bloquearía el backend HTTP por Mixed Content). El CORS del front web no se tocó; el backend sumó `http://localhost` y `capacitor://localhost` para los WebView nativos.
- Listados: `?q=&page=1&limit=10`; respuesta `{ data, total, page, limit }`. Búsqueda con **debounce de 300 ms** y reset a página 1. `DataTable` emite `update:page` y `update:q`.
- Errores: `getErrorMessage()` convierte `detail` (string, lista de 422 o `message`) a texto; `getFieldErrors()` devuelve errores por campo; `isDuplicateError()` detecta nombres repetidos (400/409).
- Acciones de factura: `/facturas/{id}/entregar`, `/aceptar` (con firma), `/rechazar` (con motivo), `/recibir` y `/pdf` (blob con nombre del header `Content-Disposition`).
- Firma: `<canvas>` con mouse/touch → `data:image/png;base64,...`, base64 válido y **máx. 500 KB**; el front valida igual que el backend.
- Avisos flotantes: cierre automático a los **5 s**; `duration: 0` los deja fijos; el cierre manual cancela el temporizador.

### Endpoints principales

| Módulo | Rutas |
|---|---|
| Sesión | `POST /login`, `GET /me`, `POST /refresh` |
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

**Sí, en general:** capas bien separadas, código modular, lógica repetida extraída, cliente HTTP único, manejo centralizado de errores, permisos reales del backend con respaldo por rol, catálogo fijo de permisos (30, sin crear desde la UI), rutas con *lazy loading* y guardas, mocks aislados por entorno, 352 pruebas con `data-test` estables, animaciones CSS puras y documentación de arquitectura al día.

**Puntos a tener en cuenta / mejorar (no bloquean):**

- La sesión ya no depende solo de `localStorage`: en el móvil vive en `@capacitor/preferences` detrás de `src/config/sessionTokens.js`. En la web sigue en `localStorage` (vulnerable a XSS, como cualquier web). Hay **refresh token con rotación**, así que no hay que reingresar cada 60 min.
- Quedan **re-exports de compatibilidad** en la raíz de `components/`; se pueden borrar cuando no haya imports antiguos (código nuevo importa desde `ui/` o `components/<modulo>/`).
- Los instructivos iniciales y las bitácoras de `ArchivosMD/` se conservan como registro histórico, pero llevan una nota con el estado vigente. La fuente confiable es este archivo, `entrega-productos-front/README.md` y `src/ARQUITECTURA.md`.
- jsdom **no valida CSS real**: sigue pendiente la revisión visual en DevTools a **320 / 375 / 768 / 1024 px**.
- No hay configuración de CI en el repo; las pruebas se ejecutan con `npm test` manual.
- Se decidió **Ionic Vue + Capacitor** (23-11-2026): reutiliza el código y los tests actuales. Flutter quedó descartado. Fase 1 y Fase 2 cerradas; plan en `ArchivosMD/PLAN_MOVIL.md`.
- Fase 2: `IonApp` solo en Capacitor; seis diálogos en `ModalBase.vue`; `BotonBase`/`CampoNative` y `LayoutBase` eligen HTML en web e Ionic en móvil. `test/setup-ionic.js`, `test/modal-base.test.js`, `test/componentes-base.test.js`, `test/layout-base.test.js` y `test/session-preferences.test.js` cubren ambas ramas.

---

## 7. Comandos y datos rápidos (web)

```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
npm run dev              # Vite con --host, expuesto en la red
npm test                 # 67 archivos / 352 pruebas
npm run build
```

`.env` para integración real (desarrollo): `VITE_API_URL=/api`, `VITE_BACKEND_URL=http://192.168.20.49:8000`, `VITE_USE_MOCKS=false`, `VITE_FACTURAS_MOCKS=false`. Hay que reiniciar Vite al cambiarlo. Para el APK se usa `.env.production` con `VITE_API_URL=http://192.168.20.49:8000` y `npm run sync:prod` desde `Movil/`.

**Cuentas reales:** admin `admin@entrega.com` / `Admin123*` · bodeguero `bodeguero@gmail.com` / `Bodega123*` · cliente `cliente@gmail.com` / `Cliente123*`.
**Demo (`VITE_USE_MOCKS=true`):** `luis@entrega.com` y `juan@cliente.com`, con botones de acceso rápido en el login.

**Números clave:** 30 permisos en el catálogo · 60 min de JWT · 7 días de refresh · 500 KB máx. de firma · 5 s de avisos · 300 ms de debounce · 62 días para graficar por día · 352 pruebas.

---

## 8. Móvil (Ionic + Capacitor)

### 8.1 Qué es y con qué está hecho

La **misma app web** empaquetada para Android y iOS. No hay código duplicado: `Movil/` es un proyecto Capacitor cuyo `webDir` apunta al `dist/` generado por `npm run build` en `entrega-productos-front/`. En navegador el DOM sigue siendo HTML puro; dentro del WebView se sustituyen los controles por equivalentes Ionic mediante adaptadores.

| Capa | Tecnología |
|---|---|
| Shell nativo | Capacitor 8 (`@capacitor/core`), Android (API 37) e iOS (se prepara en Windows, se compila en Mac/CI) |
| UI en el WebView | Ionic Vue 9: `IonApp`, `IonPage`, `IonMenu`, `IonHeader`/`IonToolbar`/`IonContent`, `IonModal`, `IonList`/`IonItem`/`IonButton`/`IonInput` |
| Adaptadores por plataforma | `ModalBase.vue`, `BotonBase.vue`, `CampoNative.vue`, `LayoutBase.vue` → HTML en web, Ionic en móvil |
| Plugins | `@capacitor/filesystem` (PDF), `@capacitor/share` (compartir/Imprimir), `@capacitor/preferences` (sesión) |
| Estilos e iconos | Mismo CSS puro y `@lucide/vue` de la web; **no mezclar Lucide con ionicons** en un componente |
| Pruebas | Los mismos 67 archivos / 352 pruebas; `test/setup-ionic.js` da stubs para jsdom |

### 8.2 Organización de carpetas y cómo se conectan

```text
Movil/
├─ capacitor.config.json        producción: sin server.url, androidScheme "http" + cleartext
├─ capacitor.config.dev.json    modo Vite (live-reload) para desarrollo
├─ package.json                 scripts dev:android / sync:prod / run:prod
├─ android/                     proyecto Gradle (abrir Android Studio en esta carpeta)
└─ ios/                         se genera en Mac; no se compila en Windows

front (reorganizado por módulos):
├─ src/App.vue                  IonApp solo cuando Capacitor.isNativePlatform()
├─ src/main.js                  hydrateSession() antes de crear el store
├─ src/modules/layout/layouts/LayoutBase.vue   grid en web / IonMenu + IonHeader + IonContent en móvil
└─ src/shared/ui/               ModalBase, BotonBase, CampoNative
```

**Flujo de una pantalla en el móvil:**

1. `npm run build` en el front genera `dist/`.
2. `npm run sync:prod` en `Movil/` copia `dist` y sincroniza los plugins nativos.
3. `npm run run:prod` instala y abre en el emulador (`emulator-5554`).
4. `main.js` hidrata `token`, `refresh_token` y `user` desde **Preferences** antes de crear Pinia.
5. `App.vue` monta `IonApp`; `MainLayout.vue` pasa los slots a `LayoutBase.vue`, que arma `IonMenu` + `IonHeader`/`IonToolbar` + `IonContent`.
6. Las vistas son exactamente las mismas; los adaptadores cambian botones, campos y modales por Ionic sin alterar la lógica ni los `data-test`.
7. `api/axios.js` apunta directo al backend (sin proxy), lee el `Bearer` de la cache y renueva con `/refresh` ante un 401 real.

### Mapa rápido móvil

| Archivo | Qué contiene | Quién lo llama | Cómo se comunica | Qué podés hacer ahí |
|---|---|---|---|---|
| `Movil/capacitor.config.json` | Origen `http://localhost`, cleartext y `webDir=dist` | `cap sync` / `cap run` | Config estática del WebView | Cambiar esquema o servidor (no agregar `server.url` en producción) |
| `Movil/capacitor.config.dev.json` | Live-reload contra Vite | `npm run dev:android` | Carga `http://IP:5173` | Desarrollo con recarga automática |
| `front/.env.production` | `VITE_API_URL` con la IP del backend | Build de producción | Lo lee Vite al compilar | Cambiar la IP del servidor |
| `src/App.vue` | `IonApp` condicional | Arranque | `Capacitor.isNativePlatform()` | No quitar el `v-if`: sin él se rompe el scroll web |
| `src/modules/layout/layouts/LayoutBase.vue` | Menú lateral y cabecera nativa | `MainLayout.vue` | Eventos `toggle`/`cerrar`/`navigate`/`logout` + `menuController` | Ajustar el drawer y la toolbar |
| `src/shared/ui/ModalBase.vue` | Seis diálogos | Detalle, firma, rechazo, `FacturaForm`, `FormModal`, `ConfirmDelete` | `IonModal` en móvil, HTML + `<Transition>` en web | Contrato de foco, `role` y `data-test` |
| `src/shared/ui/BotonBase.vue` / `CampoNative.vue` | Botón y campo por plataforma | Estadísticas, `DataTable`, Permisos, formularios | `IonButton`/`IonInput` en móvil | Mantener los atributos que llegan por `$attrs` |
| `src/modules/auth/config/sessionTokens.js` | Persistencia de sesión | Store y Axios | Preferences + cache en móvil, `localStorage` en web | Único punto para cambiar el guardado |
| `src/shared/api/axios.js` | Interceptores y renovación | Todos los `modules/*/api/` | `POST /refresh` con refresh rotativo | Ajustar reintento y aviso de sesión vencida |
| `test/setup-ionic.js` | Stubs de Ionic para jsdom | Todos los tests | Simula `IonInput`, `IonModal`, `IonMenu`, `menuController`… | Mantener `input[type=email]` y `aria-invalid` |

### 8.3 Login, token y sesión

- Mismo `POST /login` y mismo par de tokens que la web (sección 3).
- En el WebView la sesión vive en **Preferences**; `hydrateSession()` corre antes que el store para no arrancar como invitado con sesión guardada.
- El access token viaja en el header; el refresh token **solo** en el body de `POST /refresh`.
- Ante un **401 real del backend**, se renueva una sola vez, se guardan ambos tokens rotados y se reintenta la petición. Si falla el refresh, aparece el aviso de sesión vencida y vuelve al login.
- Los 401 de `/login` o `/refresh` no disparan otra renovación; un 403 no cierra la sesión.
- El flujo 401/refresh está cubierto por `test/refresh-token.test.js`, `test/axios-interceptors.test.js` y `test/session-preferences.test.js`. Adelantar la hora del dispositivo no sirve: el `exp` lo valida el backend.

### 8.4 Cómo se habla con el backend

- Producción: `baseURL=http://192.168.20.49:8000`, sin proxy. Para evitar **Mixed Content**, Capacitor usa `server.androidScheme: "http"` y `cleartext: true`, con origen `http://localhost`.
- CORS nativo habilitado en el backend para `http://localhost` y `capacitor://localhost`. El CORS usado por el front web no se modificó.
- Desarrollo: `capacitor.config.dev.json` + `npm run dev:android` cargan Vite con live-reload; en ese modo sí hay proxy `/api`.
- Errores, listados, firma, PDF y avisos funcionan **igual** que en la web porque comparten `api/` y `utils/`.

### 8.5 Módulos y reglas por rol

Los mismos de la sección 5. El menú se filtra con `auth.permisos` y se pinta en un `IonMenu`; no hay opción “Órdenes”. Las rutas con guarda también son las mismas. Los seis diálogos (detalle, firma, rechazo, formulario de factura, formulario de catálogo y confirmación de borrado) conservan foco al abrir, `data-test` y evento `cancel` donde corresponde.

### 8.6 ¿Usamos buenas prácticas?

- Una sola base de código: si se corrige un bug en la web, el APK lo hereda al sincronizar.
- Adaptadores por plataforma en vez de componentes duplicados; Ionic se aísla en `ModalBase`, `BotonBase`, `CampoNative` y `LayoutBase`.
- La matriz de Permisos mantiene checks nativos porque Ionic no ofrece el mismo contrato `checked`/`change`.
- Tests con mocks de Capacitor: no hace falta emulador para correr `npm test`.
- Pendientes: compilar iOS en Mac/CI, iconos y splash, cuentas de desarrollador y revisión visual en 320/375 px dentro del WebView.

### 8.7 Comandos y datos rápidos (móvil)

```bash
# 1) generar el bundle
cd entrega-productos-front && npm run build

# 2) desarrollo con live-reload
cd Movil && npm run dev:android

# 3) producción en emulador
cd Movil && npm run sync:prod
cd Movil && npm run run:prod

# iOS: se prepara en Windows, se compila en Mac con Xcode 26+
cd Movil && npm run sync:ios
cd Movil && npm run run:ios      # o: npm run ios → abre Xcode
```

**Datos rápidos:** paquete `com.entrega.productos` · emulador `emulator-5554` (AVD `Medium_Phone_API_37.0`) · Android Studio abre `Movil/android` · JDK 21 en `C:\Program Files\Eclipse Adoptium\jdk-21.0.13.10002-hotspot` · Gradle 9.5.1 (si se regenera `toolchainVersion=25`, volver a 21) · backend `http://192.168.20.49:8000` · **no ejecutar `npx cap add android` ni `npx cap add ios`** · iOS requiere macOS/Xcode 26+, Swift Package Manager y cuenta Apple Developer; `Info.plist` mantiene `NSAllowsArbitraryLoads` mientras el backend sea HTTP.

**Flujo de trabajo acordado:** el asistente ajusta código y tests → el usuario ejecuta `npm test` → dice “Pasa” → recién entonces commit y push. Los 6 archivos `ArchivosMD` prohibidos nunca se commitean.
