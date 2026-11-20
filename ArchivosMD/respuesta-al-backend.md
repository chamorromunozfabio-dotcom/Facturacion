# Respuesta al backend — decisiones del frontend

> **Documento histórico:** refleja el contrato inicial. Los cambios posteriores (bodeguero con CRUD en sus Tipos/Bodegas, permisos por usuario, estados `emitida/firmada/recibida` y Estadísticas) están en `indicaciones/info-proyecto.md`.

> Copiar y pegar en el chat del equipo.

---

Hola, gracias por las respuestas. Confirmo lo que decidimos desde el frontend:

## 1) Login ✅

- **Request:** `POST /login` con JSON `{ "correo": "ana@empresa.com", "contrasena": "1234" }`.
- **Response:** `{ "access_token": "<jwt>", "token_type": "bearer", "user": { "id": 1, "nombre": "Ana Pérez", "correo": "ana@empresa.com", "rol": "admin" } }`.
- Necesitamos que `user.rol` venga como **string con el nombre del rol** (no solo `rol_id`), para no hacer un viaje extra a `/roles`.
- Si `user.rol` viniera como objeto `{ id, nombre }`, nuestro store también lo acepta.
- Error de credenciales: `401` con `{ "detail": "Correo o contraseña incorrectos" }`.

Ya adapté `LoginView` y el store de Pinia a `correo` + `contrasena`.

## 2) Roles ✅ (provisional)

Usamos como punto de partida: **`admin`, `bodeguero`, `cliente`**. Está marcado como provisional hasta que el líder confirme.

Matriz que dejamos armada:

| Rol | Menú |
|---|---|
| `admin` | Todo |
| `bodeguero` | Inicio, Tipos, Bodegas, Órdenes, Factura |
| `cliente` | Inicio, Órdenes, Factura |

Agregué el módulo `GET/POST/PUT/DELETE /roles` al frontend para el selector de rol en Usuarios.

## 3) Bodegas ✅ (resuelto: campos `codigo`, `departamento`, `correo` y `recibe_*`)

Lo consultamos con el líder. Por ahora dejamos `nombre` + `direccion` opcional. En cuanto confirme los campos de "quién recibe", te aviso para que ajustes el schema.

## 4) Errores 422 ✅

Para 401/403 confirmado `{ "detail": "texto" }` con esos mensajes.

Para los **422** vimos que `detail` sigue llegando como lista. Por ahora lo normalizamos en el frontend (`getErrorMessage()` convierte la lista en texto legible), pero si podés unificarlo vos mejor:

```json
{ "detail": "texto legible para el usuario" }
```

Así el front no depende del formato interno de FastAPI.

## 5) Listados y búsqueda ✅ (por nuestra parte)

Confirmamos usar **`q`** como parámetro de búsqueda, junto con **`page`** y **`limit`**. Ya lo tenemos así en los mocks. El formato `{ data, total, page, limit }` lo dejamos pendiente hasta que publiques el primer listado.

## 6) Sesión ✅

Agregamos `GET /me` al arranque para recuperar el usuario al recargar. Si el token de 60 min venció, el interceptor 401 limpia la sesión y manda al login.

## 7) CORS / ver el front desde otra PC ✅ (resuelto en el front)

Como el backend solo permite `http://localhost:5173`, al abrir el front por la IP (`http://192.168.20.44:5173`) aparecía `400 Disallowed CORS origin`. Lo solucionamos en el frontend con un proxy de Vite: el navegador llama a `/api` (mismo origen) y Vite reenvía a tu IP `http://192.168.20.49:8000` quitando el `Origin`. Ya no necesitás agregar la IP a `allow_origins`, aunque si la agregás tampoco molesta.

Verificado: `/login`, `/me` y `/solo-admin` funcionan a través de ese proxy.

## 8) Pendiente tuyo

- Normalizar los 422 si es posible (por ahora lo hacemos en el front).
- Definir el formato de listados y confirmar `q` + `page` + `limit`.
- Confirmar con el líder los roles definitivos y los campos de "quién recibe" en Bodegas.

¡Gracias! 🚀
