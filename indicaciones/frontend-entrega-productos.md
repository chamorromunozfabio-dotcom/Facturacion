# Frontend – Entrega de Productos

> **Estado vigente (20-11-2026):** este era el instructivo inicial. Ya no existe el módulo “Órdenes” (la orden es la factura) y se sumó **Estadísticas**. La fuente confiable es `indicaciones/info-proyecto.md`, `entrega-productos-front/README.md` y `src/ARQUITECTURA.md`. Abajo se conserva el plan original con las correcciones aplicadas.

**Stack:** Vue 3 + Vue Router + Pinia + Axios
**Rol:** Es la parte visual. Muestra datos, recoge lo que escribe el usuario y se comunica con el backend (FastAPI) por medio de la API REST. **No guarda datos ni aplica reglas de negocio:** eso lo hace el backend.

**Fecha de entrega:** lunes 23-11-2026

---

## 1. Qué hace el frontend

1. Mostrar pantallas (login, listados, formularios).
2. Validar datos básicos antes de enviarlos (campos vacíos, formato de correo, longitud).
3. Enviar peticiones HTTP al backend (`GET`, `POST`, `PUT`, `DELETE`).
4. Guardar el token de sesión y enviarlo en cada petición.
5. Mostrar u ocultar menús y botones según el rol del usuario.
6. Mostrar mensajes de éxito y de error que devuelve el backend.
7. Ser usable en web y en móvil (diseño responsive).

## 2. Qué NO hace el frontend

- No se conecta a la base de datos.
- No calcula totales ni impuestos de la factura (los recibe del backend).
- No decide permisos reales (solo oculta opciones; el backend es quien bloquea).
- No genera ni valida la firma digital ni la validación electrónica de la factura.

---

## 3. Módulos y pantallas

### 3.1 Login
- Formulario: usuario y contraseña.
- Llama a `POST /login`, guarda el token y redirige al inicio.
- Muestra error si las credenciales son incorrectas.
- Botón cerrar sesión.

### 3.2 Layout principal
- Menú lateral: Inicio, Tipos, Bodegas, Usuarios, Permisos, Roles, Facturas y Estadísticas (según permisos del usuario).
- Barra superior con el nombre del usuario y cerrar sesión.
- Las opciones del menú dependen del rol.

### 3.3 CRUD Tipos (de producto)
- Listado con búsqueda y paginación.
- Crear, editar y eliminar (con confirmación).

### 3.4 CRUD Bodegas
- Igual que Tipos.
- Muestra a quién recibe el producto (cliente, etc.) según los campos que defina el líder.

### 3.5 CRUD Usuarios
- Listado, crear, editar, eliminar.
- Asignar rol al usuario.

### 3.6 CRUD Permisos
- Listado y gestión de permisos por rol.

### 3.7 Facturas (antes “Órdenes”, fase 2)
- Listado con su estado (`emitida` → `entregada` → `firmada` → `recibida`, o `rechazada`).
- Detalle con emisor, adquiriente, bodega, líneas, totales y trazabilidad.
- Aceptar con **Recibir y Firmar**: canvas con mouse/touch, firma PNG en base64 (máx. 500 KB).
- Descargar el PDF generado por el backend (`FE-0001.pdf`, response `blob`).

### 3.8 Estadísticas (módulo nuevo)
- Ruta `/estadisticas` con permiso `estadisticas_view`; menú y descripción por rol.
- Un solo endpoint `GET /estadisticas/resumen?desde=&hasta=`: admin global, bodeguero solo lo que creó, cliente lo suyo sin `emitida`.
- Tarjetas y series en CSS puro (`StatCard`, `BarrasPorEstado`, `SerieTiempo`).

---

## 4. Componentes reutilizables

| Componente | Función |
|---|---|
| `DataTable` | Tabla con búsqueda, paginación y botones de acción |
| `FormModal` | Ventana para crear/editar |
| `ConfirmDelete` | Confirmación antes de eliminar |
| `AlertMessage` | Mensajes de éxito/error |
| `SignaturePad` | Lienzo de firma (fase 2) |

Con estos, cada CRUD es la misma estructura con distintos campos.

## 5. Estructura de carpetas

```
src/
  api/          # axios.js y una archivo por módulo (tipos.js, bodegas.js...)
  components/   # componentes reutilizables
  views/        # una vista por pantalla
  router/       # rutas y guardas (requiere login / rol)
  stores/       # pinia: sesión, usuario, rol
  layouts/      # layout con menú
```

## 6. Conexión con el backend

- Variables: `VITE_API_URL=/api` y `VITE_BACKEND_URL=http://192.168.20.49:8000`. Vite reenvía `/api` al backend y quita el header `Origin`.
- Axios con `baseURL` y un interceptor que agrega `Authorization: Bearer <token>`.
- Si el backend responde `401`, se cierra sesión y se redirige al login.
- Rutas protegidas: si no hay token, se redirige a `/login`.

Endpoints que consume (acordar con backend):

```
POST   /login
GET    /tipos        GET /tipos/{id}      POST /tipos      PUT /tipos/{id}      DELETE /tipos/{id}
GET    /bodegas      (mismo patrón)
GET    /usuarios     (mismo patrón)
GET    /permisos     (mismo patrón)
```

---

## 7. Plan de trabajo (5 días)

| Día | Tarea |
|---|---|
| 1 | Proyecto Vue, estructura, router, layout, axios |
| 2 | Login + guardas de rutas + manejo de token |
| 3 | Componentes reutilizables + CRUD Tipos y Bodegas |
| 4 | CRUD Usuarios, Roles y Permisos; Recibir/Firmar dentro de Facturas |
| 5 | Facturas, Estadísticas, integración final, pruebas y ajustes |

Mientras el backend no esté listo, se trabaja con **datos falsos (mock)** y luego se cambian por las llamadas reales.

## 8. Lo que el frontend necesita del backend

- Campos de cada tabla y cuáles son obligatorios.
- Lista de endpoints y formato de respuestas y errores.
- Cómo viene la paginación (`page`, `limit`, `total`).
- Roles disponibles y qué puede ver cada uno.
- CORS habilitado para `http://localhost:5173`.

## 9. Checklist de entrega

- [x] Login funcionando con token
- [x] Rutas protegidas por permisos reales (`auth.permisos`, con respaldo por rol)
- [x] CRUD Tipos, Bodegas, Usuarios, Roles y Permisos conectados a la API
- [x] Validaciones y mensajes de error
- [x] Diseño responsive (falta la revisión visual final en 320/375/768/1024 px)
- [x] Facturas con Recibir y Firmar (antes “Órdenes”)
- [x] Vista de factura y descarga de PDF
- [x] Módulo de Estadísticas conectado a `/estadisticas/resumen`
- [x] README con cómo ejecutar el proyecto
