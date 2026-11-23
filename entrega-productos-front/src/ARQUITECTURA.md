# Mapa del frontend

Esta guía responde una pregunta simple: **¿dónde pongo esto y dónde lo busco?**

## Regla rápida

| Si es... | Va en... | Ejemplo |
|---|---|---|
| Una pantalla con ruta | `views/` | `FacturaView.vue`, `PermisosView.vue` |
| Una pieza de una sola pantalla | `components/<modulo>/` | `components/facturas/FacturaLineas.vue` |
| Una pieza usada en varias pantallas | `components/ui/` | `DataTable.vue`, `CrudPage.vue`, `AlertMessage.vue` |
| Estado, efectos o carga de datos | `composables/` | `useFacturas.js`, `useCrud.js`, `usePermisos.js` |
| Cálculos o validaciones sin Vue | `utils/` | `facturaCampos.js`, `facturas.js`, `crud.js` |
| Llamadas al backend | `api/` | `api/facturas.js`, `api/axios.js` |
| Catálogos fijos y menú | `config/` | `permissions.js`, `navigation.js` |
| Sesión global | `stores/` | `stores/auth.js` |

## Estructura actual

```text
src/
├─ ARQUITECTURA.md              ← este mapa
├─ views/                       ← pantallas conectadas al router
├─ components/
│  ├─ ui/                       ← genéricos: DataTable, CrudPage, AlertMessage, FormModal, ...
│  ├─ facturas/                 ← formulario, detalle, buscador de tipos y modales
│  ├─ permisos/                 ← buscador, cabecera, matriz y confirmación
│  ├─ estadisticas/             ← StatCard, BarrasPorEstado y SerieTiempo
│  ├─ auth/                     ← LoginForm (solo presentación del ingreso)
│  ├─ layout/                   ← SidebarMenu y TopBar
│  └─ (raíz)                    ← solo re-exports de compatibilidad
├─ composables/
│  ├─ useFacturas.js            ← lógica de FacturaView
│  ├─ useFacturaForm.js         ← lógica del formulario de factura
│  ├─ useCrud.js                ← esqueleto común de Bodegas/Roles/Tipos/Usuarios
│  ├─ useLogin.js               ← estado y envío del formulario de ingreso
│  ├─ useEstadisticas.js        ← rango, carga y presentación del panel
│  ├─ usePermisos.js            ← lógica de PermisosView
│  └─ useModalA11y.js           ← foco y Escape para diálogos
├─ utils/
│  ├─ facturas.js               ← estados, columnas y mapeos puros
│  ├─ facturaCampos.js          ← validación y mensajes del formulario
│  ├─ crud.js                   ← diferencias, parámetros y errores compartidos
│  ├─ login.js                  ← validación y mensajes del ingreso (sin Vue)
│  ├─ estadisticas.js           ← fechas, formato y normalización (sin Vue)
│  └─ permisos.js               ← texto e iniciales
├─ api/                         ← endpoints reales y mocks
├─ config/                      ← permisos y navegación por rol
└─ stores/                      ← auth
```

## Cómo leer una pantalla

1. Abrí `views/<Nombre>View.vue`: ahí están la configuración del CRUD, el encabezado y los slots. La plantilla repetida vive en `components/ui/CrudPage.vue`.
2. Si la lógica no está ahí, buscá `use<Modulo>` en `composables/`.
3. Si es una regla sin efectos (validar, formatear, traducir), buscá `<modulo>.js` en `utils/`.
4. Si es una llamada al backend, buscá `api/<modulo>.js`.
5. Si es un permiso o una opción del menú, buscá `config/`.

## Agregar un listado CRUD

`BodegasView`, `RolesView`, `TiposView` y `UsuariosView` no repiten el esqueleto: llaman a `useCrud({ ... })` con su configuración. Para crear uno nuevo:

1. Definí `modulo`, `api`, `columns`, `fields`, `createLabel`, `emptyForm` y `formFromRow`.
2. Si el formulario necesita otro guardado, pasá `cleanPayload`.
3. Si la comparación de cambios es especial, pasá `normalizarCambio` y/o `actualParaCambios`.
4. Poné los textos en `mensajes` y `confirmacion`; el composable se encarga de paginación, búsqueda con debounce, alertas, modales y baja.
5. Para cargas o efectos extra usá `alMontar`, `antesDeAbrir`, `paramsExtra`, `filtros`, `transformarFila` y `despuesDeGuardar`.
6. En el `<template>`, usá `<CrudPage>` con esos datos. Solo agregá slots `#notice`, `#filter` o `#cell-<columna>` si esa pantalla necesita algo distinto; no vuelvas a repetir la tabla ni los modales.

## El ingreso

`LoginView.vue` es solo el contenedor de la ruta `/login`. La lógica (credenciales, envío, errores, aviso de sesión vencida) está en `composables/useLogin.js`, las reglas puras en `utils/login.js` y el markup con su CSS en `components/auth/LoginForm.vue`. El formulario usa `IonPage`/`IonContent`/`IonInput`/`IonButton` (Fase 2); `useLogin` y el `POST /login` con `{ correo, contrasena }` no cambiaron. En tests, `test/setup-ionic.js` sustituye esos componentes por inputs/botones nativos.

## El panel de estadísticas

Módulo propio (no va dentro de Facturas ni del Inicio): ruta `/estadisticas`, menú **Estadísticas** y permiso `estadisticas_view` en el catálogo fijo.

- `api/estadisticas.js`: un solo `GET /estadisticas/resumen?desde=&hasta=`; en modo demo usa `mockResumenEstadisticas`.
- `composables/useEstadisticas.js`: rango del mes corriente, carga, error, derivados (`tarjetas`, `barras`, `sinDatos`) y la descripción bajo el título, personalizada por rol con `auth.role` (la vista solo la pinta).
- `utils/estadisticas.js`: fechas ISO, formato de montos y normalización de la respuesta.
- `components/estadisticas/`: `StatCard.vue`, `BarrasPorEstado.vue` (series `tipo: barras`) y `SerieTiempo.vue` (serie `por_fecha`, `tipo: linea`). Gráficos con CSS puro, sin librería de gráficos.

**Regla de oro:** el backend filtra los datos por token. El **admin ve las cifras globales de todos los usuarios** (todas las facturas, bodegas, usuarios activos y top de productos); bodeguero y cliente ven solo lo suyo. El front nunca elige qué métricas corresponde a cada uno: pinta lo que llega. `generado_para` es solo un dato informativo del backend; no se muestra en pantalla. El backend ya publicó el endpoint; los mocks solo sirven para el modo demo y replican la forma de la respuesta real.

## Convención de nombres

- Composable: `use<Modulo>.js` → `useFacturas.js`.
- Pieza de pantalla: `<Modulo><Parte>.vue` → `FacturaFirmaModal.vue`.
- Utilidad pura: `<modulo>.js` o `<modulo>Campos.js` → `facturas.js`, `facturaCampos.js`.
- `data-test`: se mantiene igual aunque el markup se mueva de archivo.
- En Fase 2, `FacturaView.vue` usa `IonCard`/`IonList`/`IonButton` para el cascarón y las acciones; los `data-test` y `useFacturas` no cambiaron. Los modales siguen con su markup actual y se migrarán a `IonModal` en el siguiente paso.

## Compatibilidad

Los archivos en la raíz de `components/` ya no contienen implementación: solo re-exportan el componente real desde `ui/` o `facturas/`. Están ahí para no romper imports antiguos.

Código nuevo: importá siempre desde `components/ui/` o `components/<modulo>/`. Los re-exports de la raíz se pueden quitar cuando ya no queden imports que los usen.

## Estado y decisiones

- Cobertura actual: **61 archivos de test / 324 pruebas** en verde con `npm test` (incluye el panel de estadísticas, la serie temporal y los textos por rol).
- Regla adoptada para código nuevo: **regla de 3**. Si algo se repite en 3 pantallas, se extrae a `ui/` o `composables/`; si aparece en una sola, se queda en `components/<modulo>/`. Un archivo = una razón de cambiar.

Se evaluaron y **se decidieron no hacer** estas dos mejoras:

| Mejora descartada | Motivo |
|---|---|
| `api/createResource.js` para unificar `list/create/update/remove` | Cada módulo tiene particularidades (firma/PDF, roles, permisos) y los tests mockean por ruta. El riesgo supera el ahorro. Solo tendría sentido si apareciera un quinto CRUD simple e idéntico. |
| Mover vistas a `views/catalogos/` y tests a `test/views/` | Es puramente estético: rompe imports del router y de los tests sin reducir código. |

Pendiente fuera del alcance de los tests: revisión visual en DevTools a **320 / 375 / 768 / 1024 px** (jsdom no calcula CSS real).
