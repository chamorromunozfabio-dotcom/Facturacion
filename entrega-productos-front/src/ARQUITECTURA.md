# Mapa del frontend

Esta guía responde una pregunta simple: **¿dónde pongo esto y dónde lo busco?**

## Regla rápida

| Si es... | Va en... | Ejemplo |
|---|---|---|
| Una pantalla con ruta | `modules/<modulo>/views/` | `modules/facturas/views/FacturaView.vue` |
| Una pieza de una sola pantalla | `modules/<modulo>/components/` | `modules/facturas/components/FacturaLineas.vue` |
| Una pieza usada en varias pantallas | `shared/ui/` | `DataTable.vue`, `CrudPage.vue`, `AlertMessage.vue` |
| Estado, efectos o carga de datos | `modules/<modulo>/composables/` | `useFacturas.js`, `useCrud.js`, `usePermisos.js` |
| Cálculos o validaciones sin Vue | `modules/<modulo>/utils/` | `facturaCampos.js`, `facturas.js`, `crud.js` |
| Llamadas al backend | `modules/<modulo>/api/` | `modules/facturas/api/facturas.js` |
| Catálogos fijos y menú | `shared/config/` | `permissions.js`, `navigation.js` |
| Sesión global | `modules/auth/store/` | `modules/auth/store/auth.js` |
| Rutas de un módulo | `modules/<modulo>/routes/` | `modules/facturas/routes/index.js` |

## Estructura actual

```text
src/
├─ ARQUITECTURA.md              ← este mapa
├─ App.vue                      ← IonApp solo en Capacitor; navegador directo
├─ main.js                      ← arranque, hydrateSession(), Pinia, IonicVue
├─ router/
│  └─ index.js                  ← ensambla las rutas de modules/*/routes y las guardas
├─ modules/
│  ├─ auth/                     ← ingreso y sesión
│  │  ├─ views/LoginView.vue
│  │  ├─ components/LoginForm.vue
│  │  ├─ composables/useLogin.js
│  │  ├─ store/auth.js
│  │  ├─ config/sessionTokens.js, sessionNotice.js
│  │  ├─ utils/login.js
│  │  └─ routes/index.js
│  ├─ facturas/                 ← listado, formulario, detalle, firma, rechazo y PDF
│  │  ├─ views/FacturaView.vue
│  │  ├─ components/            ← FacturaForm, FacturaDetail, modales, filtros, TipoSearch, ...
│  │  ├─ composables/useFacturas.js, useFacturaForm.js
│  │  ├─ api/facturas.js
│  │  ├─ utils/facturas.js, facturaCampos.js, signature.js, pdfNativo.js
│  │  └─ routes/index.js
│  ├─ estadisticas/             ← panel con tarjetas, barras y serie temporal
│  │  ├─ views/EstadisticasView.vue
│  │  ├─ components/StatCard.vue, BarrasPorEstado.vue, SerieTiempo.vue
│  │  ├─ composables/useEstadisticas.js
│  │  ├─ api/estadisticas.js
│  │  ├─ utils/estadisticas.js
│  │  └─ routes/index.js
│  ├─ catalogos/                ← Bodegas, Roles, Tipos y Usuarios (CRUD compartido)
│  │  ├─ views/                 ← BodegasView, RolesView, TiposView, UsuariosView
│  │  ├─ composables/useCrud.js
│  │  ├─ api/                   ← bodegas, roles, tipos, usuarios, crud
│  │  ├─ utils/crud.js
│  │  └─ routes/index.js
│  ├─ permisos/                 ← matriz de permisos por rol
│  │  ├─ views/PermisosView.vue
│  │  ├─ components/            ← PermisosBuscador, PermisosMatriz, PermisosCabecera, PermisosConfirmacion
│  │  ├─ composables/usePermisos.js
│  │  ├─ api/permisos.js
│  │  ├─ utils/permisos.js
│  │  └─ routes/index.js
│  ├─ inicio/                   ← Dashboard y pantalla 404
│  │  ├─ views/DashboardView.vue, NotFoundView.vue
│  │  └─ routes/index.js
│  └─ layout/                   ← cascarón de la app
│     ├─ layouts/MainLayout.vue, LayoutBase.vue
│     └─ components/SidebarMenu.vue, TopBar.vue
└─ shared/                      ← piezas transversales (sin dueño de módulo)
   ├─ ui/                       ← DataTable, CrudPage, AlertMessage, FormModal, ModalBase, ConfirmDelete,
   │                            ← SignaturePad, StatusBadge, BotonBase, CampoNative, PagePlaceholder
   ├─ api/axios.js, mocks.js
   ├─ config/apiModes.js, permissions.js, navigation.js
   ├─ composables/useModalA11y.js
   └─ assets/main.css
```

## Cómo leer una pantalla

1. Abrí `modules/<modulo>/views/<Nombre>View.vue`: ahí están la configuración del CRUD, el encabezado y los slots. La plantilla repetida vive en `shared/ui/CrudPage.vue`.
2. Si la lógica no está ahí, buscá `use<Modulo>` en `modules/<modulo>/composables/`.
3. Si es una regla sin efectos (validar, formatear, traducir), buscá `<modulo>.js` en `modules/<modulo>/utils/`.
4. Si es una llamada al backend, buscá `modules/<modulo>/api/<modulo>.js`.
5. Si es un permiso o una opción del menú, buscá `shared/config/`.
6. Las rutas de cada módulo viven en `modules/<modulo>/routes/index.js`; el router global solo las ensambla.

## Agregar un listado CRUD

`BodegasView`, `RolesView`, `TiposView` y `UsuariosView` no repiten el esqueleto: llaman a `useCrud({ ... })` con su configuración. Para crear uno nuevo:

1. Definí `modulo`, `api`, `columns`, `fields`, `createLabel`, `emptyForm` y `formFromRow`.
2. Si el formulario necesita otro guardado, pasá `cleanPayload`.
3. Si la comparación de cambios es especial, pasá `normalizarCambio` y/o `actualParaCambios`.
4. Poné los textos en `mensajes` y `confirmacion`; el composable se encarga de paginación, búsqueda con debounce, alertas, modales y baja.
5. Para cargas o efectos extra usá `alMontar`, `antesDeAbrir`, `paramsExtra`, `filtros`, `transformarFila` y `despuesDeGuardar`.
6. En el `<template>`, usá `<CrudPage>` con esos datos. Solo agregá slots `#notice`, `#filter` o `#cell-<columna>` si esa pantalla necesita algo distinto; no vuelvas a repetir la tabla ni los modales.

## El ingreso

`modules/auth/views/LoginView.vue` es solo el contenedor de la ruta `/login`. La lógica (credenciales, envío, errores, aviso de sesión vencida) está en `modules/auth/composables/useLogin.js`, las reglas puras en `modules/auth/utils/login.js` y el markup con su CSS en `modules/auth/components/LoginForm.vue`. El formulario usa `IonPage`/`IonContent`/`IonInput`/`IonButton` (Fase 2); `useLogin` y el `POST /login` con `{ correo, contrasena }` no cambiaron. En tests, `test/setup-ionic.js` sustituye esos componentes por inputs/botones nativos.

## El panel de estadísticas

Módulo propio (no va dentro de Facturas ni del Inicio): ruta `/estadisticas`, menú **Estadísticas** y permiso `estadisticas_view` en el catálogo fijo.

- `modules/estadisticas/api/estadisticas.js`: un solo `GET /estadisticas/resumen?desde=&hasta=`; en modo demo usa `mockResumenEstadisticas`.
- `modules/estadisticas/composables/useEstadisticas.js`: rango del mes corriente, carga, error, derivados (`tarjetas`, `barras`, `sinDatos`) y la descripción bajo el título, personalizada por rol con `auth.role` (la vista solo la pinta).
- `modules/estadisticas/utils/estadisticas.js`: fechas ISO, formato de montos y normalización de la respuesta.
- `modules/estadisticas/components/`: `StatCard.vue`, `BarrasPorEstado.vue` (series `tipo: barras`) y `SerieTiempo.vue` (serie `por_fecha`, `tipo: linea`). Gráficos con CSS puro, sin librería de gráficos.

**Regla de oro:** el backend filtra los datos por token. El **admin ve las cifras globales de todos los usuarios** (todas las facturas, bodegas, usuarios activos y top de productos); bodeguero y cliente ven solo lo suyo. El front nunca elige qué métricas corresponde a cada uno: pinta lo que llega. `generado_para` es solo un dato informativo del backend; no se muestra en pantalla. El backend ya publicó el endpoint; los mocks solo sirven para el modo demo y replican la forma de la respuesta real.

## Convención de nombres

- Composable: `use<Modulo>.js` → `useFacturas.js`.
- Pieza de pantalla: `<Modulo><Parte>.vue` → `FacturaFirmaModal.vue`.
- Utilidad pura: `<modulo>.js` o `<modulo>Campos.js` → `facturas.js`, `facturaCampos.js`.
- `data-test`: se mantiene igual aunque el markup se mueva de archivo.
- En Fase 2, `FacturaView.vue` usa `IonList`/`IonButton` solo en las acciones; el cascarón sigue siendo HTML normal para no alterar color, fuente ni espaciado del resto de los menús. Los `data-test` y `useFacturas` no cambiaron.
- `shared/ui/ModalBase.vue` centraliza los seis diálogos (detalle, firma, rechazo, `FacturaForm`, `FormModal` y `ConfirmDelete`): `IonModal` en móvil, markup HTML en navegador. Todos conservan `useModalA11y`, el foco al abrir y sus `data-test`; `ConfirmDelete` mantiene `role="alertdialog"` y su evento `cancel`.
- `shared/ui/BotonBase.vue` y `shared/ui/CampoNative.vue` son adaptadores de plataforma: `<button>`/`<input>` en navegador e `IonButton`/`IonInput` en Capacitor. Los usan `EstadisticasView`, `DataTable`, `FormModal`, `ConfirmDelete` y los componentes de Permisos, así que la web mantiene su markup y el WebView gana controles nativos sin `ionicons`.
- `modules/layout/layouts/LayoutBase.vue` separa el cascarón: en navegador renderiza el grid original con los slots `sidebar`/`topbar`/contenido; en Capacitor arma `IonMenu` + `IonHeader`/`IonToolbar` + `IonContent` + `IonPage`. `MainLayout.vue` conserva la lógica de menú, logout y navegación y solo pasa esos slots.
- `modules/auth/config/sessionTokens.js` es el único punto de persistencia de `token`, `refresh_token` y `user`: en navegador usa `localStorage` y en Capacitor usa `@capacitor/preferences`. Como Preferences es async, `hydrateSession()` corre en `main.js` antes de crear el store y llena una cache que mantiene la API síncrona que consumen axios y `modules/auth/store/auth.js`. Las escrituras devuelven Promesa (el login, `/refresh` y `/me` la esperan); la web y los tests no cambian su contrato.

## Organización por módulos

Cada módulo es dueño de sus `views/`, `components/`, `composables/`, `api/`, `utils/` y `routes/`, y solo importa de `shared/` lo transversal (`ui/`, `axios`, mocks, configs, `useModalA11y`, estilos). No hay re-exports ni capas de compatibilidad: la ruta real de cada archivo es la única fuente.

Código nuevo: buscá el módulo que corresponde y seguí su patrón interno. Si la pieza la usan dos o más módulos, va a `shared/` (regla de 3).

## Estado y decisiones

- Cobertura actual: **67 archivos de test / 352 pruebas** en verde con `npm test` (incluye el panel de estadísticas, la serie temporal y los textos por rol).
- Regla adoptada para código nuevo: **regla de 3**. Si algo se repite en 3 pantallas, se extrae a `shared/` o `composables/`; si aparece en una sola, se queda en `modules/<modulo>/components/`. Un archivo = una razón de cambiar.

Se evaluaron y **se decidieron no hacer** estas mejoras:

| Mejora descartada | Motivo |
|---|---|
| `shared/api/createResource.js` para unificar `list/create/update/remove` | Cada módulo tiene particularidades (firma/PDF, roles, permisos) y los tests mockean por ruta. El riesgo supera el ahorro. Solo tendría sentido si apareciera un quinto CRUD simple e idéntico. |

La reorganización por módulos (`modules/*` + `shared/*`) se hizo sin capas de compatibilidad: los imports del código y de los tests apuntan directo a la ubicación real de cada archivo.

Pendiente fuera del alcance de los tests: revisión visual en DevTools a **320 / 375 / 768 / 1024 px** (jsdom no calcula CSS real).
