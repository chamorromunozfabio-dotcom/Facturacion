# Funcionamiento técnico (resumen claro)

Términos reales del código, con la explicación al lado.

---

## 1. Token JWT (autenticación)

- `POST /login` → el backend emite un **JWT** (*JSON Web Token*, un string firmado) con vencimiento de **60 min**. El front lo guarda en `localStorage` bajo `token`, junto con `user`.
- Un **interceptor de Axios** agrega automáticamente `Authorization: Bearer <token>` a cada request. No se escribe a mano en cada llamada.
- Al arrancar la app, `main.js` ejecuta `GET /me` e hidrata `auth.permisos` (usuario + permisos vigentes).
- **401** = token ausente, inválido o vencido → se limpia `localStorage` y redirige a `/login`. **403** = token válido pero sin permiso → muestra el mensaje y **no** cierra la sesión.
- Clave: el JWT solo dice *quién sos*. Los **guards del backend consultan la base de datos en cada request**, así que dar/quitar un permiso aplica **sin re-login**. Admin tiene acceso total, excepto aceptar/rechazar facturas ajenas.

---

## 2. Firma (aceptación de factura)

- Máquina de estados: `emitida` → `entregada` → `firmada` → `recibida`. Si se rechaza con `motivo` → `rechazada`.
- `SignaturePad.vue` usa un **`<canvas>`** con eventos de mouse/touch y exporta `toDataURL('image/png')`, o sea: `data:image/png;base64,...` (la imagen va dentro del JSON, no como archivo).
- `validateFirma()` checking: prefijo exacto, **base64** válido (regex) y tamaño máximo **500 KB**. Es el mismo contrato que valida el backend.
- Pedido único: `POST /facturas/{id}/aceptar` con body `{ "firma": "<data URL>" }`. No existe un endpoint de firma separado; el backend valida que el usuario sea el dueño (si no, `403`, incluso siendo admin), persiste la firma y cambia el estado.
- Visualización: `<img :src="trazabilidad.firma">` en el detalle. El PDF se obtiene con `GET /facturas/{id}/pdf` como **blob** y se descarga como `FE-0001.pdf` ya con la firma incluida.

---

## 3. Librerías (stack)

- **Runtime:** Vue 3 (Composition API), vue-router 5 (rutas + guardas), Pinia 4 (estado global de sesión), Axios 1 (HTTP + interceptor), `@lucide/vue` (iconos SVG).
- **Tooling:** Vite 8, `@vitejs/plugin-vue`, Vitest 5, `@vue/test-utils`, jsdom, `vite-plugin-vue-devtools`.
- **Node:** `^22.18.0` o `>=24.12.0`.
- Descartadas: PrimeVue, Vuetify, Tailwind y librerías de animación. Se usa `<Transition>` + CSS puro con `prefers-reduced-motion`.

---

## 4. Paginación (listados)

- Contrato del backend: `{ data, total, page, limit }`. El front pide `?q=&page=1&limit=10`.
- `DataTable` calcula `totalPages` y el rango (*"Mostrando 1-10 de 29"*), y emite `update:page` / `update:q` al padre.
- Cada vista hace `watch(page)` → vuelve a llamar a `api.list(...)`. La búsqueda usa **debounce de 300 ms** y resetea a `page = 1` (en Facturas también aplica al filtro `estado`).
- Excepción: la pantalla Permisos y los selectores cargan `limit: 100` de una vez (30 permisos: 29 originales + `estadisticas_view`, 5 usuarios): son catálogos chicos, no necesitan paginación.
- Verificado en vivo con `limit=2` en tipos, bodegas, usuarios, roles, permisos y facturas.

---

---

## 5. Organización del código (entregas 6 a 8)

- **Entrega 6:** el esqueleto repetido de los 4 CRUD (carga, paginación, búsqueda con debounce, alta, edición, baja, alertas y mensajes) se movió a `src/composables/useCrud.js`; las reglas puras (`changedFields`, `quitarVacios`, `paramsLista`, `errorMessage`) a `src/utils/crud.js`.
- **Entrega 7:** la plantilla y el CSS repetidos de esos 4 listados se movieron a `src/components/ui/CrudPage.vue`. Cada vista solo pasa configuración y slots (`notice`, `filter`, `cell-<columna>`).
- **Entrega 8:** `LoginView.vue` quedó como contenedor de ruta. La lógica está en `src/composables/useLogin.js`, las reglas puras en `src/utils/login.js` y el markup con su CSS en `src/components/auth/LoginForm.vue`.
- Ninguno de estos refactors cambió rutas, llamadas al backend, textos, `data-test`, permisos ni CSS: se comparó contra el commit anterior y los tests siguen pasando sin modificaciones de comportamiento.
- Regla adoptada: **regla de 3** — si algo se repite en 3 pantallas, se extrae; si aparece en una sola, se queda en su módulo.

**Decidido no hacer:** `api/createResource.js` (los módulos `api/` tienen particularidades y los tests mockean por ruta; riesgo mayor que beneficio) y mover vistas/tests a subcarpetas (`views/catalogos/`, `test/views/`, solo estético y rompe imports).

## 6. Módulo de estadísticas por usuario autenticado

Decisión del líder: **módulo nuevo**, no meterlo en Facturas ni en el Inicio. El backend ya lo publicó (ver `ArchivosMD/RESPUESTA_ESTADISTICAS.md`).

- Ruta `/estadisticas`, menú **Estadísticas** y permiso `estadisticas_view` en el catálogo fijo. Ya existe en la BD, está en la plantilla de los 3 roles y se asignó a los usuarios actuales, así que ya no figura como “pendiente de backend” en la matriz de Permisos.
- Un solo endpoint: `GET /estadisticas/resumen?desde=&hasta=`. El **backend filtra por token**: el admin ve las **estadísticas globales de todos los usuarios** (todas las facturas, bodegas, usuarios activos y top de productos), el bodeguero solo las que creó (`creado_por_id`) y el cliente las suyas por `cliente_id` (sin contar `emitida`). El front no envía ids ni decide qué métricas mostrar; pinta lo que llega y no muestra carteles de alcance. La descripción bajo el título sí se personaliza por rol (admin global, bodeguero y cliente).
- El backend mandó una serie nueva, `por_fecha` con `tipo: 'linea'`, que antes el front descartaba. Ahora se pinta con `SerieTiempo.vue` (columnas por día/mes con CSS puro), además de las series `barras`.
- Código: `api/estadisticas.js`, `composables/useEstadisticas.js`, `utils/estadisticas.js`, `components/estadisticas/{StatCard,BarrasPorEstado,SerieTiempo}.vue` y `views/EstadisticasView.vue`. Sin librerías nuevas.
- Modo demo: `mockResumenEstadisticas` replica las claves, etiquetas y tipos de la respuesta real con un panel distinto para admin, bodeguero y cliente leyendo el rol guardado en `localStorage`.
- El contrato para backend quedó en `ArchivosMD/MENSAJE_PARA_BACKEND.md`; la verificación manual, en `ArchivosMD/CHECKLIST_PRUEBA_MANUAL.md` (sección 10). Verificado en vivo con las 3 cuentas reales: admin 8 facturas/$14.796.540, bodeguero 7/$2.167.740, cliente 8/$14.796.540 (todas las facturas del sistema son de ese cliente).

Estado: **57 archivos de test / 312 pruebas en verde** y `npm run build` correcto. El mapa detallado está en `entrega-productos-front/src/ARQUITECTURA.md`.
