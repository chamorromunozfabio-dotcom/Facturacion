# Respuesta del backend: permisos por usuario

> Fecha: 19-11-2026 · Servidor: `http://192.168.20.49:8000` · Todo está publicado y probado contra el servidor real.

## Checklist (punto 9 de su documento)

- [x] **Los 29 permisos están sembrados** con los `nombre` exactos y `estado: true`.
- [x] **`GET /permisos?page=1&limit=100` devuelve `total: 29`.**
- [x] **`POST /usuarios/{id}/permisos/{permiso_id}`** agrega sin duplicar y devuelve 200 con el usuario.
- [x] **`DELETE /usuarios/{id}/permisos/{permiso_id}`** devuelve 204 sin cuerpo. No se cambió.
- [x] **Los guards usan los permisos del usuario** (ver la excepción del admin abajo).
- [x] **Los guards leen la base de datos en cada pedido**, no el JWT: dar o quitar un permiso aplica **de inmediato**, sin renovar el token ni volver a iniciar sesión.
- [x] **Opción A:** al crear un usuario se copian los permisos actuales de su rol. Después, cambiar el rol o su plantilla **no** modifica a usuarios ya creados.
- [x] **Plantilla confirmada:** la que sugirieron (admin 27, bodeguero 15, cliente 4).
- [x] **`ususarios` se renombró a `usuarios_view`**: conserva el **id 6** y la asignación que tenía el admin. Ya pueden **quitar el alias** del front.

## Reglas de acceso (cómo quedó)

1. **Cada endpoint exige un permiso** del catálogo (tabla abajo). Si el usuario no lo tiene → `403 {"detail": "No tiene permiso para esta acción"}`.
2. **El rol `admin` siempre tiene acceso total**, aunque le quiten permisos. Lo decidimos así para que nadie se quede sin poder administrar el sistema (por ejemplo, quitándose `usuarios_edit`). Para bodeguero y cliente cuentan **solo** sus permisos guardados.
3. **Un permiso desactivado** (`estado: false` en `/permisos`) no cuenta para nadie.
4. Dar o quitar un permiso a un usuario **no afecta a nadie más**. Lo probamos con dos clientes.
5. El **alcance de los datos** sigue dependiendo del rol, aunque el permiso lo tenga cualquiera:
   - **Bodegas:** el admin ve todas; cualquier otro usuario solo las suyas (`bodeguero_id`).
   - **Facturas:** un usuario con rol `cliente` solo ve **sus** facturas y nunca las que están en `emitida`. Los demás ven todas.
   - **Aceptar o rechazar:** además del permiso, solo puede hacerlo **el cliente de la factura**. Cualquier otro (incluido el admin) recibe 403 `"Solo el cliente de la factura puede aceptarla o rechazarla"`.
6. **Ojo:** quien tenga `usuarios_edit` puede asignarle permisos a cualquiera, incluso a sí mismo. Denle ese permiso solo a quien corresponda.

## Permiso que exige cada endpoint

| Endpoint | Permiso |
|---|---|
| `GET /tipos`, `GET /tipos/{id}` | `tipos_view` |
| `POST /tipos` · `PUT /tipos/{id}` · `DELETE /tipos/{id}` | `tipos_create` · `tipos_edit` · `tipos_delete` |
| `GET /bodegas`, `GET /bodegas/{id}` | `bodegas_view` |
| `POST` · `PUT` · `DELETE /bodegas…` | `bodegas_create` · `bodegas_edit` · `bodegas_delete` |
| `GET /usuarios`, `GET /usuarios/{id}`, `GET /usuarios/{id}/permisos` | `usuarios_view` |
| `POST /usuarios` | `usuarios_create` |
| `PUT /usuarios/{id}` y `PUT`/`POST`/`DELETE /usuarios/{id}/permisos…` | `usuarios_edit` |
| `DELETE /usuarios/{id}` | `usuarios_delete` |
| `GET /roles`, `GET /roles/{id}` | `roles_view` |
| `POST /roles` · `PUT /roles/{id}` y `PUT /roles/{id}/permisos` · `DELETE /roles/{id}` | `roles_create` · `roles_edit` · `roles_delete` |
| `GET /permisos`, `GET /permisos/{id}` | `permisos_view` |
| `POST` · `PUT` · `DELETE /permisos…` | `permisos_create` · `permisos_edit` · `permisos_delete` |
| `GET /facturas`, `GET /facturas/{id}` | `facturas_view` |
| `GET /facturas/clientes` (selector de cliente) | `facturas_create` |
| `POST /facturas` · `PUT /facturas/{id}` · `DELETE /facturas/{id}` | `facturas_create` · `facturas_edit` · `facturas_delete` |
| `POST /facturas/{id}/entregar` · `/recibir` | `facturas_entregar` · `facturas_recibir` |
| `POST /facturas/{id}/aceptar` · `/rechazar` | `facturas_aceptar` · `facturas_rechazar` (y ser el cliente de la factura) |
| `GET /facturas/{id}/pdf` | `facturas_pdf` |
| `POST /login`, `GET /me` | cualquiera / cualquier usuario con sesión |

La pantalla de Permisos del front usa `GET /usuarios`, `GET /permisos` y `GET /roles`, así que necesita `usuarios_view`, `permisos_view` y `roles_view` (el admin ya pasa siempre).

## Usuarios existentes

Para que nadie perdiera acceso al pasar de roles a permisos, a los 3 usuarios actuales se les **agregó** la plantilla de su rol:

| Usuario | Rol | Permisos ahora |
|---|---|---|
| `admin@entrega.com` | admin | 27 (y además acceso total por ser admin) |
| `bodeguero@gmail.com` | bodeguero | 15 |
| `cliente@gmail.com` | cliente | 4 |

## Resultado de la prueba (resumen)

```
GET /permisos → total 29 · usuarios_view = id 6
Usuarios nuevos → heredan la plantilla: cliente 4, bodeguero 15
Juan (cliente) sin permiso: POST /facturas → 403 · se le da facturas_create → 201 al instante (sin renovar token)
María (cliente) sigue sin facturas_create → 403
Se le quita facturas_view a Juan → GET /facturas 403 · María sigue con 200
Bodeguero: /tipos, /bodegas, /facturas/clientes 200 · /usuarios y /roles 403 · se le da usuarios_view → /usuarios 200
Permiso desactivado → deja de contar (403) · el admin sigue con 200
Admin acepta una factura ajena → 403 · el cliente de la factura acepta → 200 · descarga el PDF → 200
```
