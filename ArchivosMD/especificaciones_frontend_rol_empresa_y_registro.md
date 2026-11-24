# Especificaciones Frontend: Rol `empresa`, Registro Público y Lógica Multi-Empresa

> **Contexto:** Guía de implementación para `entrega-productos-front` (Vue 3.5, Pinia 4, Vue Router 5, Vite 8, Vitest 5, Capacitor).
> **Reglas estrictas del proyecto:**
> - Arquitectura modular (`src/modules/*` y `src/shared/*`), sin re-exports ni carpetas antiguas.
> - Iconos únicamente con `@lucide/vue` (no mezclar con `ionicons`).
> - Animaciones con `<Transition>` y CSS puro. `IonApp` solo se monta bajo `Capacitor.isNativePlatform()`.
> - Validaciones en formularios: bloqueo de teclas no numéricas en campos numéricos, botones deshabilitados hasta completar formulario válido y mensajes de error debajo de cada campo.
> - **No tocar aún** la pestaña *Permisos* más allá de las reglas base de `permissions.js` (se abordará en una fase posterior).
> - Validar siempre con `npm test` (mantener las 364 pruebas actuales en verde + nuevas pruebas) antes de hacer commit.

---

## 1. Configuración Base del Rol `empresa`

### 1.1 `src/shared/config/permissions.js`
* Agregar `'empresa'` a `RULES` (respaldo offline/mocks) y a `plantillaDelRol`:
  * `tipos`: `['view', 'create', 'edit', 'delete']`
  * `bodegas`: `['view', 'create', 'edit', 'delete']`
  * `usuarios`: `['view', 'create', 'edit', 'delete']`
  * `roles`: `[]`
  * `permisos`: `[]`
  * `empresas`: `[]` (módulo exclusivo para `admin`)
  * `facturas`: `['view', 'create', 'edit', 'delete', 'entregar', 'recibir', 'pdf']` (sin `aceptar` ni `rechazar`)
  * `estadisticas`: `['view']`
* En `tienePermiso`: asegurar que para `'empresa'` nunca devuelva `true` en `facturas:aceptar` ni `facturas:rechazar`, ni en rutas exclusivas de `admin` como `empresas:view`.

### 1.2 Estilos, Navegación y Textos por Rol
* **`src/modules/layout/layouts/LayoutBase.vue`:**
  * Definir la variable CSS `--accent` para `[data-role='empresa']` (ej. tono índigo `#4f46e5` o esmeralda `#059669` diferenciado de `admin`, `bodeguero` y `cliente`).
  * Si `auth.user?.empresa?.razon_social` existe (para `empresa` y `bodeguero`), mostrar el nombre de la empresa como subtítulo o badge discreto en el header/drawer.
* **`src/shared/config/navigation.js`:**
  * Agregar la entrada de menú **Empresas** (ícono `Building2` de `@lucide/vue`) apuntando a `/empresas`, visible únicamente cuando `tienePermiso(..., 'empresas', 'view')` (solo `admin`).
* **`src/modules/inicio/views/DashboardView.vue` y `src/modules/estadisticas/composables/useEstadisticas.js`:**
  * Agregar mensajes de bienvenida y descripción de estadísticas específicos para el rol `'empresa'` (ej. *"Resumen consolidado de tus bodegas y entregas"*).

---

## 2. Registro Público (`RegisterView.vue`)

* **Ruta y Navegación:**
  * Registrar ruta pública `/register` en `src/router/index.js` (si ya existe sesión activa, redirigir a `/`).
  * Agregar enlace *"¿No tienes cuenta? Regístrate aquí"* en `LoginView.vue`.
* **Comportamiento de `src/modules/auth/views/RegisterView.vue`:**
  * Selector superior de 2 opciones: **Soy Cliente** vs. **Soy Empresa**.
  * **Formulario Cliente (`tipo: 'cliente'`):** Nombre completo, Tipo de documento (`CC`, `CE`, `NIT`, `Pasaporte`), Número de documento (solo números), Teléfono (solo números), Correo electrónico, Contraseña y Confirmar contraseña.
    * Al recibir `201 Created`: mostrar notificación de éxito y redirigir a `/login`.
  * **Formulario Empresa (`tipo: 'empresa'`):** Razón social, NIT (números y guion), Teléfono corporativo (solo números), Dirección, Nombre del representante, Correo electrónico, Contraseña y Confirmar contraseña.
    * Al recibir `201 Created`: **no redirigir automáticamente con error**; mostrar una vista/tarjeta de confirmación indicando que la empresa quedó registrada en estado **Pendiente de aprobación** y podrá ingresar una vez el administrador la active.
* **Manejo de error en `LoginView.vue`:**
  * Asegurar que si `POST /login` devuelve `403` (empresa pendiente, rechazada o suspendida), se muestre claramente en pantalla el `detail` devuelto por el backend.

---

## 3. Nuevo Módulo `Empresas` (Exclusivo `admin`)

Crear `src/modules/empresas/` siguiendo la estructura estándar (`api/`, `composables/`, `views/EmpresasView.vue`):

* Listado paginado (`GET /empresas`) con pestañas o filtro por estado (`Pendientes`, `Activas`, `Rechazadas`, `Suspendidas`) y búsqueda con debounce de 300 ms.
* Acciones por fila:
  * **Aprobar** (`PATCH /empresas/{id}/estado` con `{ estado: 'activa' }`).
  * **Rechazar** (abre modal exigiendo `motivo_rechazo` mínimo de 10 caracteres → `{ estado: 'rechazada', motivo_rechazo }`).
  * **Suspender / Reactivar** para empresas ya activas.

---

## 4. Adaptación de Catálogos y Facturas

### 4.1 `UsuariosView.vue`
* Agregar `'empresa'` (ID `4`) en `ROLES_POR_DEFECTO` / `IDS_POR_DEFECTO`.
* **Cuando el usuario logueado es `admin`:**
  * Puede elegir cualquier rol. Si selecciona `bodeguero` o `empresa`, mostrar un `<select>` obligatorio de **Empresa** (cargado desde `GET /empresas?estado=activa`).
* **Cuando el usuario logueado es `empresa`:**
  * Solo ve la lista de sus bodegueros.
  * Al abrir el modal de creación/edición, el rol queda fijado automáticamente como **Bodeguero** (`rol_id: 2`) y no se muestra selector de empresa (el backend lo asigna por token).
* **Cuando el usuario logueado es `bodeguero`:**
  * Ocultar botones de creación/gestión de usuarios (la búsqueda de clientes se hace directamente al facturar).

### 4.2 `BodegasView.vue` y `TiposView.vue`
* **Cuando es `admin`:** Mostrar `<select>` obligatorio de **Empresa**. En `BodegasView`, al cambiar la empresa seleccionada, recargar los bodegueros pertenecientes a esa empresa para el campo *"Bodeguero dueño"*.
* **Cuando es `empresa`:** No muestra selector de empresa; en `BodegasView`, el selector *"Bodeguero dueño"* carga directamente la lista de bodegueros de su propia empresa.

### 4.3 `FacturasView.vue` y `useFacturas.js`
* **Buscador puntual de cliente al crear factura:**
  * Reemplazar el listado abierto de clientes por un campo de búsqueda con debounce (300 ms, mín. 5 caracteres) conectado a `GET /clientes/buscar?q=...` para seleccionar al cliente por documento o correo.
* **Mostrar número consecutivo:** Mostrar `factura.numero_factura` (ej. `FAC-0001`) en la tabla y detalle de factura.
* **Inmutabilidad por estado:** Deshabilitar/ocultar los botones de **Editar** y **Eliminar** cuando `factura.estado !== 'emitida'`.
* **Rechazo con motivo obligatorio (`cliente`):**
  * Al hacer clic en **Rechazar**, abrir un modal con `<textarea>` obligatorio (mín. 10 caracteres) y enviar `{ motivo_rechazo }` al endpoint de rechazo.
  * Mostrar badge visual para el estado `rechazada` y renderizar el `motivo_rechazo` en el detalle de la factura para que tanto el bodeguero como la empresa puedan verlo.

---

## 5. Mocks y Suite de Pruebas (`Vitest`)

1. **`src/shared/api/mocks.js`:**
   * Agregar `mockEmpresas` (al menos 1 activa y 1 pendiente), el rol `4: 'empresa'`, cuenta demo `empresa@entrega.com / Empresa123*`, estadísticas demo para `empresa` y soporte simulado para `POST /register`, `GET /clientes/buscar` y `PATCH /empresas/:id/estado`.
2. **Nuevos tests en `test/`:**
   * `test/rol-empresa.test.js`: validar matriz de permisos `RULES.empresa`, navegación visible y restricciones en `UsuariosView` / `BodegasView`.
   * `test/register.test.js`: validar formularios de registro Cliente vs. Empresa, bloqueos numéricos y mensaje de aprobación pendiente.
   * `test/facturas-rechazo.test.js`: validar bloqueo de edición/eliminación fuera de estado `emitida` y validación de motivo obligatorio al rechazar.
   * Ejecutar `npm test` y confirmar **0 fallos** antes de dar por cerrada la tarea.