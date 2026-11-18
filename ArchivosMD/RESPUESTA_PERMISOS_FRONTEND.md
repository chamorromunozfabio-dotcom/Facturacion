# Respuesta del backend: permisos por usuario

> Fecha: 18-11-2026 · Servidor: `http://192.168.20.49:8000` · Todo está publicado y probado. Ya puedes cambiar `PermisosView`.

## Respuesta punto por punto

**1) Tabla `usuario_permisos`: ✅ creada.**
Tiene `usuario_id` y `permiso_id`, que juntos son la llave primaria (únicos juntos), con FK a `usuarios` y a `permisos`.
Si se borra un usuario, sus filas se borran solas. Un permiso asignado a alguien no se puede borrar.

**2) Endpoints (solo admin): ✅**

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/usuarios/{id}/permisos` | — | 200 `{ "data": [{ "id", "nombre" }] }` |
| PUT | `/usuarios/{id}/permisos` | `{ "permisos_ids": [1, 2] }` | 200 con el **usuario completo** y sus `permisos` |
| POST | `/usuarios/{id}/permisos/{permiso_id}` | — | 200 con el usuario (si ya lo tenía, no pasa nada) |
| DELETE | `/usuarios/{id}/permisos/{permiso_id}` | — | 204 sin cuerpo (si no lo tenía, no pasa nada) |

- En `PUT`, la lista **reemplaza** todos los permisos. `[]` quita todos y los ids repetidos se ignoran.
- Un id de permiso que no existe en el `PUT` → **400** `"Uno o más permisos no existen"`, y no cambia nada.
- Usuario que no existe → **404** `"Usuario no encontrado"`. En POST o DELETE, un permiso que no existe → **404** `"Permiso no encontrado"`.
- Si no es admin → **403** `"No tiene permiso para esta acción"`.

**3) Permisos en las respuestas: ✅**
`GET /usuarios`, `GET /usuarios/{id}`, `GET /me` **y también** el `user` del `POST /login` traen `permisos: [{ id, nombre }]`.

**4) Permisos efectivos = solo los del usuario: ✅**
- El rol funciona como **plantilla**: al crear un usuario (`POST /usuarios`) se le copian los permisos que tenga su rol **en ese momento**.
- Cambiar los permisos de un rol **no** modifica a los usuarios que ya existen. Lo probé.
- Cambiar el `rol_id` de un usuario existente **tampoco** cambia sus permisos. Para eso se usa `PUT /usuarios/{id}/permisos`.

**5) Migración: ✅ ejecutada.**
Copié `rol_permiso` a `usuario_permisos` según el rol de cada usuario. Hoy `rol_permiso` estaba vacía, así que no había accesos que perder.
El script quedó en `migraciones/001_usuario_permisos.sql` y se puede volver a correr sin duplicar.

**6) `PUT /roles/{id}/permisos`: ✅ queda como plantilla.**
Sigue funcionando igual, pero en `/docs` está documentado como plantilla para usuarios nuevos.

**7) Guards:** por ahora el backend **sigue bloqueando por rol** (`admin`, `bodeguero`, `cliente`). Los permisos todavía **no** generan 403.
Sirven para que el frontend arme el menú y los botones. Si más adelante el backend empieza a usarlos para bloquear, les aviso antes para que prueben los 403.

## Otros cambios
- Ya no se puede borrar un permiso que tenga algún usuario: responde 400 `"No se puede eliminar: el permiso está asignado a uno o más usuarios"`.
  Lo mismo pasa si está en la plantilla de algún rol.
- No toqué CORS ni el login.
