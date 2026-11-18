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
  components/   componentes reutilizables (PagePlaceholder)
  config/       menú y valores provisionales de roles
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
- **Errores 422:** hoy `detail` llega como **lista** de FastAPI. El frontend la normaliza a texto en `getErrorMessage()`; pendiente que el backend lo unifique.
- **Listados:** formato `{ data, total, page, limit }` **pendiente** (aún no hay endpoints de listado).
- **Búsqueda:** recomendado `q` con `page` y `limit`; confirmado por el frontend, pendiente de definición en backend.
- CORS habilitado para `http://localhost:5173`; para otras IPs se usa el proxy `/api` de Vite (ver arriba).
- Endpoints: `/login`, `/me`, `/solo-admin` (temporal), `/tipos`, `/bodegas`, `/usuarios`, `/permisos`, `/roles`.

## Roles provisionales

`admin`, `bodeguero`, `cliente` — **confirmar con el líder**. Se cambian en un solo lugar: `src/config/navigation.js` y `src/router/index.js`.

| Rol | Menú permitido |
|---|---|
| `admin` | Todo |
| `bodeguero` | Inicio, Tipos, Bodegas, Órdenes, Factura |
| `cliente` | Inicio, Órdenes, Factura |

## Campos confirmados por backend

- `tipos`: `id`, `nombre` (obligatorio, único)
- `bodegas`: `id`, `nombre` (obligatorio, único), `direccion` (opcional) — pendiente definir "quién recibe"
- `permisos`: `id`, `nombre`, `descripcion`
- `roles`: `id`, `nombre`, `descripcion` (relación muchos a muchos con permisos)
- `usuarios`: `id`, `nombre`, `correo`, `contrasena` (solo envío), `rol_id`

## Día 1 completado

- [x] Proyecto Vue creado con Router y Pinia
- [x] Axios con `baseURL`, interceptor de token y manejo de 401
- [x] Store de sesión con persistencia en `localStorage`
- [x] Rutas públicas y protegidas
- [x] Layout responsive con menú por rol (valores provisionales)
- [x] Vistas base y mocks para trabajar sin backend
- [x] Login adaptado a `correo` + `contrasena`
- [x] Módulo y ruta `/roles` agregados
- [x] 8 tests unitarios (34 aserciones) en `test/`
- [x] `GET /me` para recuperar la sesión al recargar
- [x] Normalización de errores 422 (`detail` lista → texto)
- [x] Frontend accesible desde la red (`npm run dev` con `--host`)
- [x] Proxy `/api` para evitar problemas de CORS al abrirlo por IP
- [ ] Confirmar con el líder los roles y los campos de "quién recibe" en Bodegas
- [ ] Confirmar formato de listados y parámetro `q` cuando publiquen los CRUD
- [ ] Confirmar formato de la firma (fase 2)
