# Preguntas para el líder — estado actual

> Equipo: frontend (Vue) + backend (FastAPI). Entrega: lunes 23-11-2026.
> El backend ya respondió gran parte; acá queda lo resuelto y lo que **todavía necesitamos del líder**.

---

## ✅ Ya resuelto con backend

| Tema | Respuesta |
|---|---|
| BD | `entrega_productos` (MySQL/Laragon). La crea el backend al arrancar; no hay `.sql`. |
| `tipos` | `id`, `nombre` (obligatorio, único) |
| `bodegas` | `id`, `nombre` (obligatorio, único), `direccion` (opcional) |
| `permisos` | `id`, `nombre`, `descripcion` |
| `roles` | `id`, `nombre`, `descripcion` + relación muchos a muchos con permisos |
| `usuarios` | `id`, `nombre`, `correo`, `contrasena` (solo envío), `rol_id` |
| Rutas | Sin prefijo: `/tipos`, `/bodegas`, `/usuarios`, `/permisos`, `/roles` |
| Login | `POST /login` con `{ correo, contrasena }` → `{ access_token, user }` |
| Errores | Unificados como `{ "detail": "texto" }`, incluido 422 |

---

## ⏳ Pendiente con el líder (responder hoy si puede)

1. **Roles:** confirmar si los valores son `admin`, `bodeguero`, `cliente` (los pusimos como provisional) y qué debe ver cada uno.
   - Propuesta nuestra: admin = todo; bodeguero = Inicio, Tipos, Bodegas, Órdenes, Factura; cliente = Inicio, Órdenes, Factura.
2. **Bodegas — "quién recibe":** ¿qué campos lleva (cliente, dirección de entrega, contacto, teléfono, etc.)? El backend dijo que pueden cambiar cuando lo definas.
3. **Firma (Día 4):** ¿se envía como base64 (data URL PNG)? ¿en qué campo del JSON?
4. **Factura (Día 5):** ¿endpoint exacto, PDF generado por backend y formato de la "validación electrónica"?
5. **Diseño:** ¿hay Figma/paleta o armamos un diseño limpio propio?

---

## Mensaje listo para el líder

> Hola [líder], el backend ya nos pasó campos, rutas y formato de login, y lo dejamos aplicado en el frontend. Nos faltan 2 decisiones tuyas para no adivinar: (1) confirmar los roles `admin`, `bodeguero`, `cliente` y qué ve cada uno, y (2) definir los campos de "quién recibe" en Bodegas. También necesitamos el formato de la firma para el Día 4. Con eso cerramos el diseño de pantallas. ¡Gracias!

---

## Notas para nuestro equipo

- Los roles provisionales se cambian en `src/config/navigation.js` y `src/router/index.js`.
- El login ya usa `correo` + `contrasena`; el store acepta `rol` como string u objeto `{ nombre }`.
- Agregamos `src/api/roles.js` y la ruta `/roles`.
- Los tests siguen en verde: `npm test` → 8 archivos, 32 aserciones.
