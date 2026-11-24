# Cómo funcionan los roles hoy (para agregar el rol "empresa" sin romper nada)

> Documento generado para pedirle ayuda a Gemini (o cualquier IA) a la hora de
> crear un **nuevo rol "empresa"** en el sistema de Facturación / Entrega de
> Productos. Describe la lógica actual del frontend y del backend tal como está
> implementada y validada (67 archivos de test / 364 pruebas en verde).

---

## 1. Regla de oro (leer antes de tocar nada)

1. **El backend es la fuente de verdad.** El frontend solo **oculta** menús,
   botones y rutas. El backend bloquea con **403** lo que el token no puede
   hacer. Nunca dependas solo del front para seguridad.
2. **Los permisos son POR USUARIO, no por rol.** El rol funciona como
   "plantilla" al crear un usuario; después, el admin le da o quita permisos
   individuales en la pantalla **Permisos**.
3. El front usa los **permisos reales** que llegan en `/login` y `/me`
   (nombres como `facturas_create`). La matriz por rol (`RULES`) es solo un
   **respaldo** para sesiones viejas o modo demo.
4. El **admin siempre tiene acceso total** (regla confirmada con el backend),
   con una única excepción: no puede `aceptar`/`rechazar` facturas ajenas.

---

## 2. Los 3 roles actuales y su matriz

Definida en `entrega-productos-front/src/shared/config/permissions.js`
(constante `RULES`):

| Módulo | admin | bodeguero | cliente |
|---|---|---|---|
| **tipos** (productos) | view, create, edit, delete | view, create, edit, delete | — |
| **bodegas** | view, create, edit, delete | view, create, edit, delete (solo las suyas, lo filtra el backend) | — |
| **usuarios** | view, create, edit, delete | — | — |
| **roles** | view, create, edit, delete | — | — |
| **permisos** | view, create, edit, delete | — | — |
| **facturas** | view, create, edit, delete, entregar, recibir, pdf | view, create, edit, delete, entregar, recibir, pdf | view, aceptar, rechazar, pdf |
| **estadisticas** | view | view | view |

Acciones que existen en todo el sistema (catálogo fijo):
`view, create, edit, delete, entregar, recibir, aceptar, rechazar, pdf`.

> En el backend, cada permiso se llama `modulo_accion` (ej. `facturas_view`,
> `usuarios_edit`). En el front la clave interna es `modulo:accion`
> (ej. `facturas:view`).

---

## 3. Cómo decide el front si algo se ve o no

Archivo: `src/shared/config/permissions.js`, función `tienePermiso(permisos, role, modulo, accion)`:

1. Si `role === 'admin'`:
   - `false` SOLO para `facturas:aceptar` y `facturas:rechazar` (el backend da 403 al admin en facturas ajenas).
   - `true` para todo lo demás (acceso total).
2. Si la sesión trae `permisos` (array de strings o de objetos con `.nombre`):
   - se busca `modulo_accion` en la lista → ese es el permiso real.
3. Si no hay `permisos` (mocks o sesión antigua): se usa la matriz del rol
   (`hasPermission(role, module, action)` sobre `RULES`).

Consumidores de `tienePermiso`:

| Dónde | Para qué |
|---|---|
| `src/router/index.js` | Guarda de cada ruta (`meta.permission` como `'facturas:view'`). Sin permiso → redirige a Inicio. |
| `src/shared/config/navigation.js` | `visibleMenuFor(role, permisos)` filtra el menú lateral. |
| `src/modules/catalogos/composables/useCrud.js` | Botones Crear/Editar/Eliminar de Tipos, Bodegas, Usuarios y Roles. |
| `src/modules/facturas/composables/useFacturas.js` | Botones de la factura: crear, editar, eliminar, entregar, recibir, aceptar, rechazar y PDF. |
| `src/modules/inicio/views/DashboardView.vue` | Tarjetas de módulos en el panel de inicio. |

---

## 4. La sesión (dónde vive el rol)

Archivo: `src/modules/auth/store/auth.js`.

- El backend puede devolver `"rol": "admin"` (string) o `"rol": { id, nombre }`
  (objeto). El store resuelve ambos:
  ```js
  const raw = user.value?.rol ?? user.value?.role
  // devuelve string ('admin') o objeto; auth.role termina siendo el nombre
  ```
- `auth.role` → nombre del rol (string, ej. `'cliente'`).
- `auth.permisos` → array real que llega del backend.
- El login real es `POST /login` con `{ "correo": "...", "contrasena": "..." }`
  (JSON, NO form-data, NO `username`/`password`).
- Sesión persistida en `localStorage` (web) o Capacitor Preferences (móvil),
  punto único en `src/modules/auth/config/sessionTokens.js`.

---

## 5. Roles dinámicos del backend

- La lista de roles **no es fija en el front**: el admin puede crear nuevos roles
  y el backend los devuelve en `GET /roles`.
- Los IDs actuales en el backend/mocks son: **1 = admin, 2 = bodeguero, 3 = cliente**.
  El front tiene un respaldo con esos 3 en `src/modules/catalogos/views/UsuariosView.vue`
  (`ROLES_POR_DEFECTO` / `IDS_POR_DEFECTO`), que se usa solo si `GET /roles` falla.
- `UsuariosView` envía `rol_id` como **número** al crear/editar usuarios.
- Mocks: `src/shared/api/mocks.js` define `PROVISIONAL_ROLES`, cuentas demo
  (`MOCK_ACCOUNTS`), `mockUsers`, `mockRoles` (ids 1/2/3) y las estadísticas
  demo por rol (`generado_para: admin|bodeguero|cliente`).

---

## 6. TODOS los puntos donde el código compara roles por nombre (para el rol nuevo)

Cuando agregues "empresa", cada comparación literal con `'admin'`,
`'bodeguero'` o `'cliente'` DEBE decidir qué hace con `'empresa'`:

| Archivo | Qué hace hoy |
|---|---|
| `src/shared/config/permissions.js` | `RULES` (matriz), `hasPermission`, `tienePermiso` (admin total + excepción aceptar/rechazar), `plantillaDelRol` (plantilla de checks en Permisos). |
| `src/modules/layout/layouts/LayoutBase.vue` | Color de acento por rol: `.layout[data-role='admin'|'bodeguero'|'cliente']` (variables CSS `--accent`). |
| `src/modules/inicio/views/DashboardView.vue` | `roleMessages` con mensaje de bienvenida por rol. |
| `src/modules/estadisticas/composables/useEstadisticas.js` | Descripción bajo el título según rol (admin / bodeguero / resto). |
| `src/modules/facturas/composables/useFacturas.js` | `esCliente`, `esAdmin`, `esBodeguero`; si es bodeguero, filtra sus facturas por `auth.user.bodega_id`. |
| `src/modules/catalogos/views/BodegasView.vue` | `esAdmin` decide si se muestra "Bodeguero dueño" (select con `usuariosApi.list({ rol: 'bodeguero' })`). |
| `src/modules/catalogos/views/TiposView.vue` | `esAdmin` decide si el tipo lleva bodega; el bodeguero queda atado a la suya. |
| `src/modules/catalogos/views/UsuariosView.vue` | `isBodeguero` (filtro forzado a clientes); si el rol elegido es `cliente`, muestra campos de cliente (tipo_documento, documento, teléfono…). |
| `src/shared/api/mocks.js` | Cuentas demo, usuarios, roles y estadísticas por rol. |
| `src/modules/permisos/composables/usePermisos.js` | `plantillaDelRol` para "Aplicar plantilla" del rol seleccionado. |

Además:

- **Router**: las rutas no preguntan el rol, preguntan el permiso
  (`meta.permission`). El rol nuevo funcionará si sus permisos reales existen.
- **Catálogo fijo**: el admin NO crea permisos nuevos desde la interfaz; solo
  asigna los 30 existentes. El backend debe tener creados los permisos
  `modulo_accion` que use "empresa".
- **Estadísticas**: el backend decide qué datos llega según el token
  (`generado_para` es informativo, no se pinta). El front solo agrega el texto
  descriptivo por rol.

---

## 7. Qué se necesita para agregar el rol "empresa" (checklist propuesto)

**Backend (fuera de este repo, coordinar con el backend):**
1. Crear el rol `empresa` (id 4, p.ej.) y decidir su matriz de permisos.
2. Asegurar que `GET /roles` lo devuelva y que el seed/demo lo incluya.
3. Definir comportamiento de datos: ¿ve todas las facturas de sus bodegas?
   ¿tiene usuarios propios? ¿estadísticas globales o de su empresa?

**Frontend (este repo):**
1. `RULES` + `hasPermission`: agregar la matriz de `empresa` (clave de respaldo).
2. Revisar cada comparación literal de la tabla de la sección 6 y darle un
   comportamiento explícito a `empresa` (mensajes, colores, filtros, campos).
3. `UsuariosView`: agregar el rol a `ROLES_POR_DEFECTO`/`IDS_POR_DEFECTO` como
   respaldo (id 4).
4. Mocks (`mocks.js`): cuenta demo, usuarios y estadísticas para `empresa`.
5. Tests: los 67 archivos (364 pruebas) cubren permisos por rol y vistas.
   Agregar/ajustar tests para `empresa` SIN debilitar los existentes.
   (Ej.: `test/permisos-bodeguero.test.js`, `test/role-views-icons.test.js`,
   `test/permisos-sesion-real.test.js`, `test/action-icons-role-colors.test.js`,
   `test/mock-accounts.test.js`, `test/estadisticas.test.js`.)

---

## 8. Convenciones y restricciones del proyecto (para no romper nada)

- **Estructura por módulos**: `src/modules/{auth,facturas,estadisticas,catalogos,
  permisos,inicio,layout}` + `src/shared/{ui,api,config,composables,assets}`.
  Nada de carpetas viejas ni re-exports.
- **Comandos**: `cd entrega-productos-front` → `npm test` (Vitest, 364 pruebas)
  y `npm run build`. Móvil: `cd Movil && npm run sync:prod`.
- **Flujo de trabajo**: los cambios de código se validan con `npm test` antes de
  commitear. El commit solo se hace cuando el usuario confirma "Pasa".
- **Login real**: `POST /login` con JSON `{ correo, contrasena }`; NUNCA
  `username`/`password` ni form-data.
- **Iconos**: `@lucide/vue`; no mezclar Lucide con `ionicons` en el mismo
  componente. Animaciones con `<Transition>` + CSS puro.
- **No perder scroll en web**: `IonApp` solo se monta en Capacitor
  (`Capacitor.isNativePlatform()`).
- **Validaciones**: campos numéricos bloquean teclas no numéricas al escribir;
  botones deshabilitados hasta que el formulario esté completo y válido; avisos
  debajo de cada campo.
- **Backend de pruebas**: `http://192.168.20.49:8000`. Cuentas:
  `admin@entrega.com/Admin123*`, `bodeguero@gmail.com/Bodega123*`,
  `cliente@gmail.com/Cliente123*`.
