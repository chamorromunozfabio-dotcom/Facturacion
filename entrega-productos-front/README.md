# Entrega de Productos – Frontend

Vue 3 + Vue Router + Pinia + Axios.

## Cómo ejecutar

```bash
npm install
cp .env.example .env   # en Windows: copy .env.example .env
npm run dev
```

Abrir: http://localhost:5173

`npm run dev` ya incluye `--host`, así que Vite también se expone en la red local.

## Ver el frontend desde otra PC de la red

1. En la PC que corre el frontend, ejecutar `npm run dev`.
2. En la terminal aparece la línea **Network**, por ejemplo:
   `http://192.168.20.44:5173/`
3. Tu compañero abre esa URL en su navegador (debe estar en la misma Wi-Fi/red).
4. Login de prueba: `admin@entrega.com` / `Admin123*`.

> Si no conecta, revisa el firewall de Windows: debe permitir el **puerto 5173** (TCP) para redes privadas.

### ¿Por qué funciona si el backend solo permite `localhost:5173`?

El navegador llama a `/api` en el **mismo origen** del frontend (por ejemplo `http://192.168.20.44:5173/api/login`). Vite lo reenvía al backend indicado en `VITE_BACKEND_URL` y le quita la cabecera `Origin`. Así no hay preflight CORS y da igual desde qué IP se abra el frontend.

## Variables de entorno (.env)

| Variable | Valor | Para qué sirve |
|---|---|---|
| `VITE_API_URL` | `/api` | Ruta que usa Axios; Vite la reenvía al backend |
| `VITE_BACKEND_URL` | `http://192.168.20.49:8000` | IP real de FastAPI (la usa solo el proxy de Vite) |
| `VITE_USE_MOCKS` | `true` / `false` | `true` usa datos falsos; `false` llama a la API real |

Cuando el backend publique `/login` y los CRUD, cambia `VITE_USE_MOCKS=false` y reinicia `npm run dev`.

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

- **Login:** `POST /login` con JSON `{ "correo": "admin@entrega.com", "contrasena": "Admin123*" }` (no form-data).
- **Respuesta login:** `{ "access_token": "<jwt>", "token_type": "bearer", "user": { "id": 1, "nombre": "Administrador", "correo": "admin@entrega.com", "rol": "admin" } }`.
- `user.rol` llega como **texto** (`admin`, `bodeguero`, `cliente`).
- **Token:** `Authorization: Bearer <token>`, vence a los **60 minutos**.
- **Recuperar sesión:** `GET /me` con ese header devuelve el mismo `user`. Se llama al arrancar la app.
- **Errores 401/403:** `{ "detail": "texto" }` (`"Correo o contraseña incorrectos"`, `"No ha iniciado sesión"`, `"Token inválido o vencido"`, `"No tiene permiso para esta acción"`).
- **Errores 422:** `detail` como texto. Si llega como lista, `getErrorMessage()` lo normaliza. Los 422 de `page`/`limit` todavía están en inglés (backend los traducirá).
- **Listados:** confirmado `{ data, total, page, limit }`, `page` empieza en 1, `limit` por defecto 10 y máximo 100 (exceso → 422).
- **Búsqueda:** `q` con coincidencia parcial y sin distinguir mayúsculas.
- CORS habilitado para `http://localhost:5173`; para otras IPs se usa el proxy `/api` de Vite (ver arriba).
- Endpoints publicados: `/login`, `/me`, `/solo-admin` (temporal), `/tipos`. En contrato (a publicar): `/bodegas`, `/usuarios`, `/permisos`, `/roles`, `/facturas`.

### Tipos (Día 3 — publicado por el backend)

- Campos: `id` (lo genera el backend) y `nombre` (1 a 100 caracteres, se quitan espacios al inicio/final, único sin distinguir mayúsculas).
- `POST /tipos` → `201` con el registro. `PUT /tipos/{id}` → `200` con el registro; acepta campos parciales (`null` se ignora).
- `GET /tipos/{id}` → `200`. `DELETE /tipos/{id}` → `204` **sin cuerpo** (no se parsea JSON).
- `GET /tipos?q=&page=1&limit=10` → `{ data, total, page, limit }`, ordenado por `id`, `limit` máximo 100.
- `q` busca coincidencias parciales sin distinguir mayúsculas (`q=ALI` → "Alimentos").
- Errores: `401`, `403`, `404` (`Tipo no encontrado`), `400` (`Ya existe un tipo con ese nombre`; el front también maneja `409`) y `422` con `detail` como texto.
- Roles: el backend responderá `403` a `POST`/`PUT`/`DELETE` para `bodeguero` (a aplicar). Los `GET` siguen permitidos para `admin` y `bodeguero`.

### Bodegas (Día 4 — contrato recibido, a publicar por backend)

- Campos: `nombre` (único, obligatorio), `direccion`, `ciudad`, `telefono`, `responsable_nombre`, `responsable_documento`, `responsable_telefono`, `responsable_correo` (todos opcionales salvo `nombre`).
- Columnas del listado: Nombre, Ciudad, Responsable, Teléfono. El resto va en el formulario.
- Validaciones: teléfono 7-20 caracteres (dígitos, espacios, `+`, `-`), correo con formato válido, documento máx. 20 caracteres.

### Usuarios (Día 4)

- `POST /usuarios` y `PUT /usuarios/{id}` reciben `nombre`, `correo`, `contrasena` (obligatoria al crear, opcional al editar), `rol_id` (1=admin, 2=bodeguero, 3=cliente) y, **solo cuando el rol es cliente**, `tipo_documento` (CC/NIT/CE), `numero_documento`, `telefono`, `direccion`.
- `GET /usuarios?rol=cliente`: el bodeguero siempre ve solo clientes (el backend fuerza el filtro); el admin puede filtrar por cualquier rol o ver todos.

### Facturas (Día 5 — `CONTRATO_FACTURAS.MD`)

- La orden **es** la factura: un solo módulo en `/facturas`.
- Listado `{ data, total, page, limit }`; `q` busca por número **y** nombre del cliente; `estado` acepta un solo valor (`creada`, `entregada`, `aceptada`, `rechazada`, `cerrada`).
- Estados: `creada → entregada → aceptada → cerrada`, o `rechazada`. Acción en estado inválido → `400`.
- Acciones: `POST /facturas/{id}/entregar`, `/aceptar` (`{ firma }`), `/rechazar` (`{ motivo }`), `/recibir`; `GET /facturas/{id}/pdf`.
- El cliente solo ve las suyas (el backend filtra por `cliente_id` del token); no ve borradores `creada`.
- Firma: data URL completa `data:image/png;base64,...`, base64 válido, máx. 500 KB. Se devuelve en `trazabilidad.firma` (solo en el detalle).
- PDF: `application/pdf` con `Content-Disposition: attachment; filename="FAC-000001.pdf"`. Se descarga con `blob` porque el `<a>` simple no envía el Bearer.
- Líneas: al menos 1; `cantidad > 0`, `precio_unitario ≥ 0`, `descuento_porcentaje` 0-100, `iva_porcentaje` 0/5/19, `tipo_id` opcional. Los totales los calcula el backend.

## Roles y permisos definitivos

Definidos por el líder en `CONTRATO_FACTURAS.MD`. Se cambian en un solo lugar: `src/config/permissions.js` y `src/config/navigation.js`. El front oculta botones; el backend bloquea con `403`.

| Módulo | admin | bodeguero | cliente |
|---|---|---|---|
| Tipos, Bodegas | CRUD | Solo ver | — |
| Usuarios | CRUD | Solo ver (el backend filtra `rol=cliente`) | — |
| Roles, Permisos | CRUD | — | — |
| Facturas | Crear, editar, borrar, entregar, recibir, ver PDF | Igual que admin | Ver las suyas, aceptar con firma y rechazar |

`Órdenes` se quitó del menú: **la orden es la factura**, un solo módulo en `/facturas`. Las rutas viejas `/ordenes` y `/factura` redirigen ahí.

## Campos confirmados por backend

- `tipos`: `id`, `nombre` (obligatorio, único)
- `bodegas`: 8 campos detallados arriba (solo `nombre` obligatorio)
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
- [x] Botones Crear/Editar/Eliminar ocultos para `bodeguero`
- [x] Bodegas con 8 campos, columnas y validaciones confirmadas
- [x] Usuarios con campos condicionales de cliente y filtro `?rol=`
- [x] `SignaturePad` con firma PNG y límite de 500 KB
- [x] Facturas: listado, detalle, formulario de líneas, estados, firma, rechazo y PDF
- [x] 24 archivos de test en verde y `npm run build` correcto

## Pendiente del backend / líder

- [ ] Publicar los endpoints de `/bodegas`, `/usuarios` y `/facturas`.
- [ ] Aplicar el `403` a `POST`/`PUT`/`DELETE` de `bodeguero` en `/tipos` y `/bodegas`.
- [ ] Traducir los 422 de `page`/`limit`.
- [ ] Definir el diseño visual (¿hay Figma/paleta?) si el líder lo tiene.
