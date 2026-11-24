# Regla de dueño en facturas: lista en el backend

## 1. El dato del creador: `creado_por_id`

El creador ya se guardaba: es el usuario del token que hizo el `POST /facturas`. Internamente estaba en `bodeguero_id`, por eso el nombre confundía, porque también puede ser el admin. Ahora se expone con un nombre claro.

- **`GET /facturas`**: cada fila trae ahora `creado_por_id` (número) y `creado_por_nombre`.
- **`FacturaOut`** (`GET /facturas/{id}` y la respuesta de todas las acciones): trae `creado_por_id` y `creado_por_nombre` en el primer nivel.
- `trazabilidad.bodeguero_id` y `trazabilidad.creada_por` **se mantienen**, para no romper nada. Valen exactamente lo mismo que `creado_por_id` y `creado_por_nombre`. Usen `creado_por_id`.

```json
{ "id": 21, "numero": "FE-0009", "estado": "recibida", "cliente_id": 5, "cliente_nombre": "Cliente Prueba",
  "bodega_nombre": "Plaza central", "creado_por_id": 1, "creado_por_nombre": "Administrador", "total": 1190.0 }
```

## 2. Qué facturas ve cada uno (sale del token, sin parámetro en la URL)

| Rol | Ve |
|---|---|
| **Admin** | Todas. |
| **Cliente** | Las que **él creó** + las que tienen su `cliente_id`. De las que son para él, **nunca** las que están en `emitida`. |
| **Bodeguero** (y cualquier otro rol que no sea admin ni cliente) | Solo las que **él creó**. |

Detalle de la regla del cliente: si él mismo creó la factura (solo puede si le dieron el permiso `facturas_create`), la ve aunque esté en `emitida`, porque es su propio borrador. El "nunca `emitida`" aplica a las que le hicieron otros.

`total` y la búsqueda `q` respetan la regla. Por ejemplo, un bodeguero que busca el número de una factura ajena recibe `total: 0`.

## 3. Alcance: todos los endpoints de facturas

Si la factura no es suya, responden **404** `{"detail": "Factura no encontrada"}`, aunque tenga el link directo:

- `GET /facturas/{id}`
- `GET /facturas/{id}/pdf`
- `PUT /facturas/{id}`
- `DELETE /facturas/{id}`
- `POST /facturas/{id}/entregar`
- `POST /facturas/{id}/recibir`
- `POST /facturas/{id}/aceptar`
- `POST /facturas/{id}/rechazar`

Cosas que **no** cambiaron:

- Aceptar y rechazar siguen siendo **solo del cliente de la factura**. Si alguien sí ve la factura pero no es su cliente, recibe **403** `Solo el cliente de la factura puede aceptarla o rechazarla`. Ese es el caso del admin, o de un cliente que creó una factura para otro.
- Si el cuerpo viene mal, el **422** sale antes del 404. Por ejemplo, una firma que no es PNG. Ese 422 no revela si la factura existe.
- Sin el permiso de la acción, la respuesta sigue siendo 403 `No tiene permiso para esta acción`.

## 4. Facturas viejas

**No hace falta backfill:** las 5 facturas ya tienen su creador real guardado. No son todas del admin:

| Factura | Creada por |
|---|---|
| FE-0001, FE-0006, FE-0007 | Bodeguero Prueba (id 2) |
| FE-0008 | Fabio (id 20) |
| FE-0009 | Administrador (id 1) |

Las 5 son del cliente "Cliente Prueba" (id 5), así que con la regla nueva:

- el admin ve las 5;
- Bodeguero Prueba ve 3;
- Fabio ve 1;
- Cliente Prueba ve las 5 (todas están en `recibida`).

Como el creador siempre se guarda, no existe el caso "sin creador conocido".

## 5. Probado contra el servidor real

Escenario: dos bodegueros, dos clientes (uno con `facturas_create`) y el admin. Se crearon 4 facturas cruzadas:

- **Listados:** el admin ve todas; cada bodeguero solo la suya; el cliente ve la entregada y la que él creó, pero no la `emitida` que le hicieron; el otro cliente no ve nada mientras sus facturas están en `emitida`.
- **Factura ajena:** con `GET`, PDF, `PUT`, entregar, recibir, `DELETE`, aceptar y rechazar responde **404**. Con una factura propia funciona normal.
- **Regresión general del API:** idéntica a la anterior.
