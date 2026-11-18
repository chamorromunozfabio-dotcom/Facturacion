# Integración con los CRUD publicados por el backend

Fecha: 18-11-2026. Revisión hecha contra `http://192.168.20.49:8000/openapi.json` y pruebas reales de login/permisos.

## Lo que ya funciona y el frontend está usando

| Módulo | Estado | Observación |
|---|---|---|
| `POST /login` | ✅ | JSON `{ "correo", "contrasena" }`; devuelve `access_token`, `token_type` y `user` con `rol` como texto. |
| `GET /me` | ✅ | Mantiene la sesión al recargar. |
| `/tipos` | ✅ | CRUD completo; búsqueda `q` y paginación `{ data, total, page, limit }`. |
| `/bodegas` | ✅ | CRUD completo, pero con campos reducidos (ver pendiente 2). |
| `/usuarios` | ✅ | CRUD completo para admin; `rol_id` 1/2/3. |
| `/roles` | ✅ | CRUD completo; `permisos` viene como lista. El frontend ya tiene pantalla real. |
| `/permisos` | ✅ | CRUD completo. El frontend ya tiene pantalla real. |
| Errores 422 | ✅ | Vienen en español, p. ej. `nombre: es demasiado corto`. |

Cuentas reales confirmadas:

- admin: `admin@entrega.com` / `Admin123*`
- bodeguero: `bodeguero@entrega.com` / `Bodega123*`

> En mocks se usa `luis@entrega.com` para el bodeguero demo. En la API real es `bodeguero@entrega.com`.

## Configuración actual del frontend

```env
VITE_API_URL=/api
VITE_BACKEND_URL=http://192.168.20.49:8000
VITE_USE_MOCKS=false
VITE_FACTURAS_MOCKS=true
```

El proxy `/api` de Vite quita el header `Origin`, así que no hace falta tocar el CORS del backend. Los tests fuerzan mocks, por lo que siguen siendo estables.

## Pendientes del backend (bloquean el cambio 100% real)

1. **`/facturas` no existe.** `GET /facturas` devuelve `404 Not Found`. Faltan el CRUD, las acciones `/entregar`, `/aceptar`, `/rechazar`, `/recibir` y `/pdf`. Hasta entonces Facturas se queda con mocks.
2. **Bodegas con campos incompletos.** El esquema real solo acepta `nombre`, `direccion`, `estado`. Falta `ciudad`, `telefono`, `responsable_nombre`, `responsable_documento`, `responsable_telefono` y `responsable_correo`. Sin eso se pierden datos del formulario.
3. **Usuarios con campos incompletos.** Falta `tipo_documento`, `numero_documento`, `telefono` y `direccion` para cuando `rol_id=3` (cliente).
4. **Permisos de bodeguero invertidos en dos puntos:**
   - Hoy **puede** `POST`/`PUT`/`DELETE` en `/tipos` y `/bodegas`; debería dar `403` (solo lectura).
   - Hoy **no puede ni listar** `/usuarios` (`403`); debería poder ver solo clientes (`GET /usuarios?rol=cliente`).
5. **422 de paginación.** Confirmar que `page`/`limit` fuera de rango también estén traducidos como el resto.

## Cómo se hizo el cambio en el frontend

- `src/config/apiModes.js` decide si cada bloque usa mocks o API real.
- `src/api/crud.js` acepta la opción `{ mocks: true }` para recursos que aún no existen.
- Facturas usa esa opción mientras `/facturas` no esté publicado.
- `RolesView.vue` y `PermisosView.vue` dejaron de ser placeholders y ahora son CRUD reales con `DataTable`, `FormModal` y `ConfirmDelete`.
- Test 32 (`test/real-api-modules.test.js`) cubre el modo híbrido y ambos CRUD nuevos.
