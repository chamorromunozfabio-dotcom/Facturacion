# Respuesta al backend — decisiones del frontend

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

## 3) Bodegas ⏳

Lo consultamos con el líder. Por ahora dejamos `nombre` + `direccion` opcional. En cuanto confirme los campos de "quién recibe", te aviso para que ajustes el schema.

## 4) Errores 422 ✅

Sí, unificamos **todos** los errores (400, 401, 403, 404, 422) como:

```json
{ "detail": "texto legible para el usuario" }
```

Si FastAPI devuelve el array típico de validación, convertí lo a un solo string. Nuestro `getErrorMessage()` ya lee solo `detail`.

## 5) Pendiente tuyo

- Avisarme cuando publiques `POST /login` para probar con `VITE_USE_MOCKS=false`.
- Confirmar que CORS sigue activo para `http://localhost:5173`.
- Pasarme la URL de `/docs` cuando esté arriba.

¡Gracias! 🚀
