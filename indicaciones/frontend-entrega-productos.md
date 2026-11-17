# Frontend – Entrega de Productos

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
- Menú lateral: Tipos, Bodegas, Usuarios, Permisos, Órdenes, Facturas.
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

### 3.7 Órdenes de producto (fase 2)
- Listado de órdenes con su estado.
- Detalle de la orden.
- Pantalla **Recibir y Firmar**: lienzo para dibujar la firma y botón de confirmar.

### 3.8 Factura (fase 2)
- Ver la factura con encabezado, emisor, adquiriente, detalle, totales, pie de página y validación electrónica.
- Botón para descargar o imprimir (PDF generado por el backend).

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

- Variable de entorno: `VITE_API_URL=http://localhost:8000`
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
| 4 | CRUD Usuarios y Permisos, Órdenes y Recibir/Firmar |
| 5 | Factura, integración final, pruebas y ajustes |

Mientras el backend no esté listo, se trabaja con **datos falsos (mock)** y luego se cambian por las llamadas reales.

## 8. Lo que el frontend necesita del backend

- Campos de cada tabla y cuáles son obligatorios.
- Lista de endpoints y formato de respuestas y errores.
- Cómo viene la paginación (`page`, `limit`, `total`).
- Roles disponibles y qué puede ver cada uno.
- CORS habilitado para `http://localhost:5173`.

## 9. Checklist de entrega

- [ ] Login funcionando con token
- [ ] Rutas protegidas por sesión y rol
- [ ] CRUD Tipos, Bodegas, Usuarios y Permisos conectados a la API
- [ ] Validaciones y mensajes de error
- [ ] Diseño usable en móvil
- [ ] Órdenes con Recibir y Firmar
- [ ] Vista de factura
- [ ] README con cómo ejecutar el proyecto
