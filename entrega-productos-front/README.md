# Entrega de Productos – Frontend

Vue 3 + Vue Router + Pinia + Axios + `@lucide/vue` (iconos). Animaciones con Vue/CSS puro.

## Cómo ejecutar

```bash
npm install
cp .env.example .env   # en Windows: copy .env.example .env
npm run dev
```

Abrir: http://localhost:5173

> Para verificar en el navegador, seguí la [checklist de prueba manual](../ArchivosMD/CHECKLIST_PRUEBA_MANUAL.md).

`npm run dev` ya incluye `--host`, así que Vite también se expone en la red local.

## Ver el frontend desde otra PC de la red

1. En la PC que corre el frontend, ejecutar `npm run dev`.
2. En la terminal aparece la línea **Network**, por ejemplo:
   `http://192.168.20.44:5173/`
3. Tu compañero abre esa URL en su navegador (debe estar en la misma Wi-Fi/red).
4. Login de prueba (modo demo): `admin@entrega.com` / `Admin123*`.

### Cuentas demo por rol (con `VITE_USE_MOCKS=true`)

El login muestra botones **Admin / Bodeguero / Cliente** que llenan las credenciales automáticamente.

| Rol | Correo | Contraseña |
|---|---|---|
| admin | `admin@entrega.com` | `Admin123*` |
| bodeguero | `luis@entrega.com` | `Bodega123*` |
| cliente | `juan@cliente.com` | `Cliente123*` |

Cualquier otro correo entra como admin demo. El rol se guarda en `localStorage` y se conserva al recargar.

### Cuentas reales (con `VITE_USE_MOCKS=false`)

| Rol | Correo | Contraseña |
|---|---|---|
| admin | `admin@entrega.com` | `Admin123*` |
| bodeguero | `bodeguero@gmail.com` | `Bodega123*` |
| cliente | `cliente@gmail.com` | `Cliente123*` |

> Las cuentas de `@entrega.com` para bodeguero y cliente daban `401`; estas son las que realmente existen en la API.

> Si no conecta, revisa el firewall de Windows: debe permitir el **puerto 5173** (TCP) para redes privadas.

### ¿Por qué funciona si el backend solo permite `localhost:5173`?

El navegador llama a `/api` en el **mismo origen** del frontend (por ejemplo `http://192.168.20.44:5173/api/login`). Vite lo reenvía al backend indicado en `VITE_BACKEND_URL` y le quita la cabecera `Origin`. Así no hay preflight CORS y da igual desde qué IP se abra el frontend.

## Variables de entorno (.env)

| Variable | Valor | Para qué sirve |
|---|---|---|
| `VITE_API_URL` | `/api` | Ruta que usa Axios; Vite la reenvía al backend |
| `VITE_BACKEND_URL` | `http://192.168.20.49:8000` | IP real de FastAPI (la usa solo el proxy de Vite) |
| `VITE_USE_MOCKS` | `true` / `false` | `true` usa datos falsos en todo; `false` usa la API real |
| `VITE_FACTURAS_MOCKS` | `true` / `false` | `false` usa `/facturas` real; `true` solo para trabajar sin backend |

### Integración completa (todo contra la API real)

El backend ya publicó todos los módulos, incluido `/facturas` con el contrato definitivo. La configuración actual es:

```env
VITE_USE_MOCKS=false
VITE_FACTURAS_MOCKS=false
```

Los tests fuerzan mocks en `vite.config.js`, así que siguen siendo estables aunque tu `.env` apunte a la API real. Si cambiás `.env`, reiniciá `npm run dev` (Vite no recarga variables en caliente).

## Estructura

```
src/
  api/          axios.js, crud.js, mocks.js y un archivo por módulo
  assets/       estilos globales
  components/   DataTable, FormModal, ConfirmDelete, AlertMessage,
                SignaturePad, FacturaDetail, FacturaForm
  config/       menú y matriz de permisos definitiva (permissions.js)
  layouts/      MainLayout (menú + barra superior)
  router/       rutas y guardas de sesión/rol
  stores/       auth.js (token, usuario, rol)
  views/        una vista por pantalla
```

## Contrato acordado con backend

> El contrato original está en `ArchivosMD/CONTRATO_FACTURAS.md`. Los cambios definitivos del backend están en `ArchivosMD/CAMBIOS_PARA_FRONTEND.md` y `ArchivosMD/CAMBIOS_PARA_FRONTENDv2.md` (estados `emitida/firmada/recibida`, número `FE-0001`, campos `recibe_*`, bodegas con dueño y `/facturas/clientes`) y ya están aplicados en este frontend.
> Ojo: `ArchivosMD/CONTRATO_FACTURASv2.md` todavía trae valores viejos (`creada`, `aceptada`, `cerrada`, `FAC-000001`, `responsable_nombre`); no usar ese archivo como referencia.

- **Login:** `POST /login` con JSON `{ "correo": "admin@entrega.com", "contrasena": "Admin123*" }` (no form-data).
- **Respuesta login:** `{ "access_token": "<jwt>", "token_type": "bearer", "user": { "id": 1, "nombre": "Administrador", "correo": "admin@entrega.com", "rol": "admin" } }`.
- `user.rol` llega como **texto** (`admin`, `bodeguero`, `cliente`).
- **Token:** `Authorization: Bearer <token>`, vence a los **60 minutos**.
- **Recuperar sesión:** `GET /me` con ese header devuelve el mismo `user`. Se llama al arrancar la app.
- **Errores 401/403:** `{ "detail": "texto" }` (`"Correo o contraseña incorrectos"`, `"No ha iniciado sesión"`, `"Token inválido o vencido"`, `"No tiene permiso para esta acción"`).
- **Errores 422:** `detail` como texto y en español, también para `page`/`limit` (`page: debe ser mayor o igual a 1`). Si llega como lista, `getErrorMessage()` lo normaliza.
- **Listados:** confirmado `{ data, total, page, limit }`, `page` empieza en 1, `limit` por defecto 10 y máximo 100 (exceso → 422).
- **Búsqueda:** `q` con coincidencia parcial y sin distinguir mayúsculas.
- CORS habilitado para `http://localhost:5173`; para otras IPs se usa el proxy `/api` de Vite (ver arriba).
- Endpoints publicados y en uso: `/login`, `/me`, `/tipos`, `/bodegas`, `/usuarios`, `/roles`, `/permisos` y `/facturas` con sus acciones y PDF (más `/solo-admin`, temporal).

### Tipos (Día 3 — publicado por el backend)

- Campos: `id` (lo genera el backend) y `nombre` (1 a 100 caracteres, se quitan espacios al inicio/final, único sin distinguir mayúsculas).
- `POST /tipos` → `201` con el registro. `PUT /tipos/{id}` → `200` con el registro; acepta campos parciales (`null` se ignora).
- `GET /tipos/{id}` → `200`. `DELETE /tipos/{id}` → `204` **sin cuerpo** (no se parsea JSON).
- `GET /tipos?q=&page=1&limit=10` → `{ data, total, page, limit }`, ordenado por `id`, `limit` máximo 100.
- `q` busca coincidencias parciales sin distinguir mayúsculas (`q=ALI` → "Alimentos").
- Errores: `401`, `403`, `404` (`Tipo no encontrado`), `400` (`Ya existe un tipo con ese nombre`; el front también maneja `409`) y `422` con `detail` como texto.
- Roles: los `GET` están permitidos para admin y bodeguero; `POST`/`PUT`/`DELETE` devuelven `403` al bodeguero. Ya aplicado por el backend.

### Bodegas (Día 4 — contrato definitivo)

- Campos: `nombre` (único, obligatorio), `codigo`, `direccion`, `ciudad`, `departamento`, `telefono`, `correo`, `recibe_nombre`, `recibe_documento`, `recibe_cargo` y `recibe_telefono` (todos opcionales salvo `nombre`).
- Ojo: el backend ya no usa `responsable_*`. Ahora es `recibe_*` y el correo es `correo` de la bodega.
- Columnas del listado: Nombre, Ciudad, Responsable, Teléfono. El resto va en el formulario.
- Validaciones: teléfono 7-20 caracteres (dígitos, espacios, `+`, `-`), correo con formato válido, documento máx. 20 caracteres.

### Usuarios (Día 4)

- `POST /usuarios` y `PUT /usuarios/{id}` reciben `nombre`, `correo`, `contrasena` (obligatoria al crear, opcional al editar), `rol_id` (1=admin, 2=bodeguero, 3=cliente).
- `tipo_documento` (CC/NIT/CE/**PA**), `numero_documento`, `telefono`, `direccion` y `ciudad` son **opcionales para todos los roles**; el front los muestra solo al elegir cliente.
- `GET /usuarios?rol=cliente`: el bodeguero siempre ve solo clientes (el backend fuerza el filtro); el admin puede filtrar por cualquier rol o ver todos.

### Facturas (Día 5 — `CONTRATO_FACTURAS.MD`)

- La orden **es** la factura: un solo módulo en `/facturas`.
- Número: **`FE-0001`** (ya no `FAC-000001`).
- Listado `{ data, total, page, limit }`; `q` busca por número **y** nombre del cliente; cada fila trae `cliente_id`, `cliente_nombre`, `bodega_nombre` y `total`.
- Estados definitivos: **`emitida` → `entregada` → `firmada` → `recibida`**, o `rechazada`. Acción en estado inválido → `400`.
- Acciones: `POST /facturas/{id}/entregar`, `/aceptar` (`{ firma }`), `/rechazar` (`{ motivo }`), `/recibir`; `GET /facturas/{id}/pdf`.
- El cliente solo ve las suyas (el backend filtra por el token); no ve borradores `emitida`.
- Firma: data URL completa `data:image/png;base64,...`, base64 válido, máx. 500 KB. Se devuelve en `trazabilidad.firma` (solo en el detalle).
- PDF: `application/pdf` con `Content-Disposition: attachment; filename="FE-0001.pdf"`. Se descarga con `blob` porque el `<a>` simple no envía el Bearer.
- Líneas: al menos 1; `cantidad > 0`, `precio_unitario ≥ 0`, `descuento_porcentaje` 0-100, `iva_porcentaje` 0/5/19, `tipo_id` y `unidad_medida` opcionales (por defecto `UND`). Los totales los calcula el backend.
- `forma_pago`: `contado`, `credito` o `crédito`; con crédito, `fecha_vencimiento` es obligatoria.
- Interfaz: el estado se muestra con `StatusBadge.vue` (mismo componente en listado y detalle). Colores: gris `emitida`, ámbar `entregada`, verde `firmada`, rojo `rechazada`, azul `recibida`. `DataTable` admite slots `cell-<key>` para personalizar celdas.

## Roles y permisos definitivos

Definidos por el líder en `CONTRATO_FACTURAS.MD`. Se cambian en un solo lugar: `src/config/permissions.js` y `src/config/navigation.js`. El front oculta botones; el backend bloquea con `403`.

| Módulo | admin | bodeguero | cliente |
|---|---|---|---|
| Tipos (productos) | CRUD | **CRUD** (es su catálogo) | — |
| Bodegas | CRUD de todas; asigna dueño con `bodeguero_id` | CRUD **solo de las suyas** (el backend filtra) | — |
| Usuarios | CRUD | **Sin acceso** (ni menú, ni ruta; API da 403) | — |
| Roles, Permisos | CRUD de roles/permisos; **permisos por usuario** con `PUT /usuarios/{id}/permisos` | — | — |
| Facturas | Todo | Crear solo desde sus bodegas, editar, borrar, entregar, recibir y ver PDF | Ver las suyas, aceptar con firma y rechazar |

El selector de clientes de Facturas ya no usa `/usuarios`: viene de `GET /facturas/clientes` (admin y bodeguero). El bodeguero tampoco ve el campo `bodeguero_id` en Bodegas: al crear, el backend lo pone como dueño automáticamente.

**Cómo funcionan los permisos (respuesta del backend en `ArchivosMD/RESPUESTA_PERMISOS_FRONTEND.md`):** son **por usuario**. En `Permisos` el admin elige un usuario, ve sus permisos actuales (`GET /usuarios/{id}/permisos`), los marca/desmarca y guarda con `PUT /usuarios/{id}/permisos` → `{ permisos_ids: [...] }`; `[]` quita todos. También existen `POST`/`DELETE /usuarios/{id}/permisos/{permiso_id}` para uno solo. El **rol es solo la plantilla** al crear usuarios: cambiar un rol después no altera permisos de usuarios existentes. `/login`, `/me` y `/usuarios` ya traen `permisos: [{id, nombre}]` y la sesión los guarda (`auth.permisos`). Por ahora los guards siguen siendo por rol y el menú/botones usan la matriz fija `permissions.js`: cuando el backend pase a bloquear por permiso, se ajusta esa matriz. El menú y las rutas de `Roles`/`Permisos` son solo del admin.

`Órdenes` se quitó del menú: **la orden es la factura**, un solo módulo en `/facturas`. Las rutas viejas `/ordenes` y `/factura` redirigen ahí.

### Interfaz por rol

- El menú y el dashboard se construyen con `visibleMenuFor(rol)`: admin ve 7 módulos, bodeguero 4 (Inicio, Tipos, Bodegas y Facturas) y cliente solo Inicio + Facturas.
- Los iconos son componentes SVG de **`@lucide/vue`** (paquete oficial de Lucide; `lucide-vue-next` quedó deprecated). Están declarados en `src/config/navigation.js` y se pintan con `<component :is="item.icon" />`.
- No se agregó ninguna librería de animación: el cambio de vista usa `<Transition name="fade" mode="out-in">` en `MainLayout.vue` y las tarjetas del dashboard usan una animación CSS escalonada.
- Si el sistema pide “reducir movimiento”, las animaciones CSS se desactivan automáticamente (`prefers-reduced-motion`).
- Los botones (`Nuevo tipo`, `Nueva bodega`, `Nuevo usuario`, `Editar`, `Eliminar`, `Ver`, `Entregar`, `Aceptar`, `Rechazar`, `Recibir`, `PDF` y paginación) también llevan iconos Lucide. Siguen emitiendo los mismos eventos y teniendo los mismos `data-test`. El texto de creación se define con la prop `createLabel` de `DataTable`.
- Cada rol tiene un color de acento: admin violeta, bodeguero verde y cliente ámbar. Se define con una variable CSS `--accent` en `MainLayout.vue` (`data-role`) y la hereda el dashboard. En pantallas chicas el menú se vuelve horizontal y se muestra compacto.
- Las alertas y todos los modales (generales y de facturas: detalle, firma y rechazo) entran y salen con `<Transition>`: `name="alert"` y `name="modal"`. Las clases CSS viven en `src/assets/main.css` y respetan `prefers-reduced-motion`.
- Accesibilidad: el composable `useModalA11y.js` mueve el foco al panel al abrir y cierra con **Escape**. Los botones de cierre tienen `aria-label` y el canvas de firma tiene `role="img"` con etiqueta. El foco se limpia al desmontar el modal.
- Mensajes para el usuario: el login valida correo y contraseña por separado (obligatorios, formato de correo y mínimo 8 caracteres), deshabilita **Ingresar** hasta que todo sea válido y explica qué falta. Los diálogos de eliminación avisan que la acción no se puede deshacer y los formularios dicen `Crear …` o `Guardar cambios` según corresponda.

## Campos confirmados por backend

- `tipos`: `id`, `nombre` (obligatorio, único)
- `bodegas`: 11 campos detallados arriba + `bodeguero_id` / `bodeguero_nombre` (solo `nombre` obligatorio)
- `permisos`: `id`, `nombre`, `descripcion`
- `roles`: `id`, `nombre`, `descripcion` (relación muchos a muchos con permisos)
- `usuarios`: `id`, `nombre`, `correo`, `contrasena` (solo envío), `rol_id` + campos de cliente
- `facturas`: número, estado, emisor, adquiriente, bodega, detalle, totales, observaciones, validación electrónica, software y trazabilidad (ver contrato)

## Día 1 completado

- [x] Proyecto Vue creado con Router y Pinia
- [x] Axios con `baseURL`, interceptor de token y manejo de 401
- [x] Store de sesión con persistencia en `localStorage`
- [x] Rutas públicas y protegidas
- [x] Layout responsive con menú por rol (valores provisionales)
- [x] Vistas base y mocks para trabajar sin backend
- [x] Login adaptado a `correo` + `contrasena`
- [x] Módulo y ruta `/roles` agregados
- [x] 24 archivos de tests unitarios (128 aserciones) en `test/`
- [x] `GET /me` para recuperar la sesión al recargar
- [x] Normalización de errores 422 (`detail` lista → texto)
- [x] Frontend accesible desde la red (`npm run dev` con `--host`)
- [x] Proxy `/api` para evitar problemas de CORS al abrirlo por IP
- [x] Componentes reutilizables: `DataTable`, `FormModal`, `ConfirmDelete`, `AlertMessage`
- [x] CRUD de Tipos y Bodegas conectado a los mocks (listo para API real)
- [x] Validación de `nombre`: `trim` + máximo 100 caracteres
- [x] Mensaje claro para nombre repetido (400/409) y `PUT` parcial
- [x] Roles y permisos definitivos del líder (matriz en `permissions.js`)
- [x] Menú sin "Órdenes": un solo módulo **Facturas**
- [x] Botones por rol: `bodeguero` gestiona Tipos y sus Bodegas, y no tiene acceso a Usuarios
- [x] Bodegas con 8 campos, columnas y validaciones confirmadas
- [x] Usuarios con campos condicionales de cliente y filtro `?rol=`
- [x] `SignaturePad` con firma PNG y límite de 500 KB
- [x] Facturas: listado, detalle, formulario de líneas, estados, firma, rechazo y PDF
- [x] 24 archivos de test en verde y `npm run build` correcto

## Pendiente del backend / líder

- [ ] Definir el diseño visual (¿hay Figma/paleta?) si el líder lo tiene.

Ya resuelto por el backend: `DELETE /tipos` para bodeguero, `/facturas/clientes`, bodegas con dueño y `403` en `/usuarios`. Según `CAMBIOS_PARA_FRONTENDv2.md`, el bodeguero **ve todas** las facturas (solo puede crear desde las suyas), así que el filtro `bodega_id` que enviamos es un refuerzo opcional que hoy se ignora. Detalle en `ArchivosMD/INTEGRACION_BACKEND.md`.
