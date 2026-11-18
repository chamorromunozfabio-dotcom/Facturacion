# Mensaje para el backend — informe de frontend y trabajo pendiente

> Listo para copiar y pegar. Fecha: 18-11-2026.
> El frontend terminó los Días 1 a 5: 24 tests en verde y build correcto.

---

> Hola, el frontend ya está terminado (Días 1 a 5): 24 tests en verde y build correcto. Te paso exactamente lo que ya consume y lo que falta de tu parte para poder conectarlo.
>
> **Lo que ya está publicado y funcionando:** `/login`, `/me`, `/solo-admin` y el CRUD de `/tipos`.
>
> **1) Pendiente en Tipos**
> Falta aplicar la distinción que confirmó el líder: `GET` (listado y detalle) para `admin` y `bodeguero`, pero `POST`/`PUT`/`DELETE` deben devolver `403` al `bodeguero`. Hoy todavía puede crear.
>
> **2) Bodegas — publicar con 8 campos**
> `nombre` (único, obligatorio, máx. 100), `direccion`, `ciudad`, `telefono`, `responsable_nombre`, `responsable_documento` (máx. 20), `responsable_telefono`, `responsable_correo`. Los opcionales pueden ser `null` o no venir.
> Validaciones: teléfono 7-20 caracteres (dígitos, espacios, `+`, `-`); correo con formato válido.
> El front envía solo los campos con valor, por ejemplo:
> ```json
> { "nombre": "Bodega Sur", "ciudad": "Cali", "telefono": "+57 300 123 4567" }
> ```
> Mismo patrón que Tipos: `GET /bodegas?q=&page=&limit=` → `{ data, total, page, limit }`, `POST` → 201, `PUT` parcial → 200, `DELETE` → 204 sin cuerpo, duplicado → 400. Solo `admin` escribe; `bodeguero` solo lee.
>
> **3) Usuarios — publicar con campos de cliente**
> `POST /usuarios` y `PUT /usuarios/{id}` reciben:
> ```json
> {
>   "nombre": "Juan Pérez",
>   "correo": "juan@cliente.com",
>   "contrasena": "Clave123*",
>   "rol_id": 3,
>   "tipo_documento": "CC",
>   "numero_documento": "1020304050",
>   "telefono": "3001234567",
>   "direccion": "Calle 10 # 20-30"
> }
> ```
> - `rol_id`: 1=admin, 2=bodeguero, 3=cliente. Las respuestas devuelven `rol` como texto.
> - Los cuatro campos de cliente son **obligatorios solo cuando `rol_id = 3`** (si faltan → 422); opcionales para los otros roles.
> - `contrasena` obligatoria al crear, opcional al editar (si no viene, no se cambia).
> - `GET /usuarios?rol=cliente`: el `bodeguero` siempre debe ver solo clientes, aunque mande otro valor o no mande el filtro. El `admin` puede filtrar por cualquier rol o ver todos. El bodeguero no puede crear, editar ni eliminar.
>
> **4) Facturas — publicar `/facturas` completo**
> La orden es la factura: una sola entidad.
>
> `GET /facturas?q=&estado=&page=&limit=` → `{ data, total, page, limit }`.
> - `q`: coincidencia parcial, sin distinguir mayúsculas, por **número y nombre del cliente** a la vez.
> - `estado`: un solo valor exacto (`creada`, `entregada`, `aceptada`, `rechazada`, `cerrada`); otro valor → 422.
> - Cada elemento de `data`: `id`, `numero`, `estado`, `fecha_emision`, `cliente_nombre`, `total`.
>
> `POST /facturas` (admin/bodeguero) → 201:
> ```json
> {
>   "cliente_id": 3,
>   "bodega_id": 1,
>   "forma_pago": "contado",
>   "medio_pago": "transferencia",
>   "fecha_vencimiento": null,
>   "observaciones": "Entregar en portería",
>   "detalle": [
>     { "tipo_id": 5, "descripcion": "Arroz 500 g", "cantidad": 10,
>       "precio_unitario": 3500, "descuento_porcentaje": 0, "iva_porcentaje": 5 }
>   ]
> }
> ```
> - `forma_pago`: `contado` / `credito`. Con `credito`, `fecha_vencimiento` es obligatoria (la enviamos como `YYYY-MM-DD`); con `contado` va `null`.
> - `medio_pago`: `efectivo` / `transferencia` / `tarjeta`.
> - `iva_porcentaje`: solo 0, 5 o 19. `tipo_id` puede ser `null` (no eligió tipo).
> - Validaciones: al menos 1 línea, `cantidad > 0`, `precio_unitario ≥ 0`, `descuento_porcentaje` 0-100.
> - **Los totales los calculás vos**; el front no los envía.
>
> `GET /facturas/{id}` → el detalle completo del contrato, incluido `trazabilidad.firma` (solo en el detalle, no en el listado).
>
> `PUT /facturas/{id}` → solo campos cambiados, **únicamente en estado `creada`**. `DELETE` → 204, también solo en `creada`.
>
> Acciones:
> | Método | Ruta | Cuerpo | Quién | Desde |
> |---|---|---|---|---|
> | POST | `/facturas/{id}/entregar` | sin cuerpo | admin, bodeguero | `creada` |
> | POST | `/facturas/{id}/aceptar` | `{ "firma": "data:image/png;base64,..." }` | cliente dueño | `entregada` |
> | POST | `/facturas/{id}/rechazar` | `{ "motivo": "texto" }` | cliente dueño | `entregada` |
> | POST | `/facturas/{id}/recibir` | sin cuerpo | admin, bodeguero | `aceptada` |
>
> - `rechazada` y `cerrada` son finales. Acción en estado inválido → `400` con `detail`.
> - **El front nunca manda `cliente_id` en ninguna petición**: filtrás vos comparando con el usuario del token. Si un cliente pide por id una factura ajena → `404`.
> - El cliente no ve facturas en `creada` (son borradores): filtralas vos en listado y detalle.
> - Firma: data URL completa, debe empezar con `data:image/png;base64,`, base64 válido, máx. 500 KB de texto; si no → 422. La guardás tal cual y la devolvés en `trazabilidad.firma`.
>
> `GET /facturas/{id}/pdf`: `Content-Type: application/pdf` y `Content-Disposition: attachment; filename="FAC-000001.pdf"`. La descargamos con `blob` y el header `Authorization`, así que no necesitamos que el `<a>` lo envíe.
>
> **5) Traducir los 422 de `page`/`limit`** (hoy salen en inglés). No bloquea, pero queda pendiente.
>
> **Notas de integración**
> - Token `Authorization: Bearer <token>`, vence en 60 min; si vence, el front cierra sesión solo.
> - Errores siempre con `{ "detail": "texto" }`: 401, 403, 404, 400 y 422.
> - Seguimos usando el proxy `/api` de Vite, así que **no hace falta tocar el CORS** del backend.
> - Cuando publiques cada módulo me avisás y lo probamos de a uno con `VITE_USE_MOCKS=false`.

---

## Resumen rápido

| Prioridad | Qué hacer |
|---|---|
| 1 | 403 al bodeguero en `POST`/`PUT`/`DELETE` de `/tipos` |
| 2 | Publicar `/bodegas` (8 campos) |
| 3 | Publicar `/usuarios` (`rol_id`, campos de cliente, filtro `rol=cliente`) |
| 4 | Publicar `/facturas` (listado, detalle, CRUD, acciones, firma, PDF) |
| 5 | Traducir 422 de `page`/`limit` |

También está disponible el contrato original del líder en `ArchivosMD/CONTRATO_FACTURAS.md`, con los ejemplos de JSON.
