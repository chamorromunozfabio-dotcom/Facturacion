# Entrega de Productos – Frontend

Vue 3 + Vue Router + Pinia + Axios.

## Cómo ejecutar

```bash
npm install
cp .env.example .env   # en Windows: copy .env.example .env
npm run dev
```

Abrir: http://localhost:5173

## Variables de entorno (.env)

| Variable | Valor | Para qué sirve |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Dirección del backend FastAPI |
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

- **Login:** `POST /login` con `{ "correo": "ana@empresa.com", "contrasena": "..." }`
- **Respuesta login:** `{ "access_token": "<jwt>", "token_type": "bearer", "user": { "id": 1, "nombre": "Ana Pérez", "correo": "ana@empresa.com", "rol": "admin" } }`
- Listados: `{ "data": [...], "total": 1, "page": 1, "limit": 10 }`
- Errores (incluido 422): `{ "detail": "mensaje legible" }`
- Token: `Authorization: Bearer <token>`
- CORS habilitado para `http://localhost:5173`
- Endpoints: `/login`, `/tipos`, `/bodegas`, `/usuarios`, `/permisos`, `/roles` (CRUD completo)

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
- [x] 8 tests unitarios (32 aserciones) en `test/`
- [ ] Confirmar con el líder los roles y los campos de "quién recibe" en Bodegas
- [ ] Confirmar formato de la firma (fase 2)
