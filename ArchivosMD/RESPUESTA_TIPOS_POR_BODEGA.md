# Tipos por bodega: listo en el backend

Cada bodega tiene ahora su propio catálogo de tipos. Abajo están las reglas exactas que aplica el backend.

## 1. Qué cambió en la respuesta (`TipoOut`)

```json
{
  "id": 24,
  "nombre": "Granos",
  "bodega_id": 20,
  "bodega_nombre": "Bodega Norte",
  "estado": true,
  "fecha_creacion": "...",
  "fecha_actualizacion": "..."
}
```

- `bodega_id` y `bodega_nombre` pueden venir en `null`. Eso pasa con los **12 tipos que ya existían**: quedaron sin bodega.
- Los tipos sin bodega **solo los ve y los edita el admin**.

## 2. `POST /tipos`

| Quién | Qué envía | Qué pasa |
|---|---|---|
| Admin | `{"nombre", "bodega_id"}` | Se crea en esa bodega. Si la bodega no existe: **400**. |
| Admin | `{"nombre"}` sin `bodega_id` | Se crea **sin bodega** (tipo general). |
| No admin con **1** bodega | `{"nombre"}` | Se asigna solo a su bodega. Si envía otro `bodega_id`, se ignora. |
| No admin con **varias** bodegas | `{"nombre", "bodega_id"}` | `bodega_id` es obligatorio y debe ser una de las suyas. |
| No admin **sin** bodegas | cualquiera | **400** |

Errores (siempre `{"detail": "..."}`):

- 400 `No tiene una bodega asignada: no puede crear tipos`
- 400 `Tiene varias bodegas: indique bodega_id con una de las suyas`
- 400 `La bodega indicada no existe o no le pertenece`
- 400 `Ya existe un tipo con ese nombre en esta bodega`
  - El nombre es único **por bodega**, sin distinguir mayúsculas.
  - Dos bodegas distintas sí pueden tener cada una un tipo llamado "Granos".

**Sugerencia de UI:**

- Para el admin, muestren un selector de bodega que permita dejarlo vacío (tipo general).
- Para el bodeguero, muestren el selector solo si tiene más de una bodega.

## 3. `GET /tipos`

Parámetros: `q`, `estado`, `page`, `limit` (como antes), más el nuevo **`bodega_id`**.

- **Admin:**
  - Sin `bodega_id`, ve **todos**, incluidos los que no tienen bodega.
  - Con `bodega_id=X`, ve solo los de esa bodega.
- **No admin:**
  - Solo ve los tipos de **sus** bodegas.
  - Con `bodega_id` de una bodega ajena recibe una lista vacía (`total: 0`), no un error.
  - Un usuario no admin **sin bodegas** recibe siempre la lista vacía. Por ejemplo, un cliente al que le den `tipos_view`.

**Para el formulario de factura:** pidan `GET /tipos?bodega_id=<bodega elegida>&estado=true`. Así el selector muestra solo los tipos de esa bodega.

## 4. `GET /tipos/{id}`, `PUT /tipos/{id}` y `DELETE /tipos/{id}`

- **404** `Tipo no encontrado` si no existe.
- **403** `El tipo no pertenece a su bodega`: un no admin intenta ver, editar o borrar un tipo de otra bodega o sin bodega.
- En `PUT`:
  - El **admin** puede cambiar `bodega_id` y mover el tipo a otra bodega. Si la bodega no existe: 400. Si en la bodega destino ya hay un tipo con ese nombre: 400 `Ya existe un tipo con ese nombre en esta bodega`.
  - Si un **no admin** envía `bodega_id`, se **ignora**: el tipo se queda en su bodega.
- `DELETE` de un tipo usado en facturas sigue dando 400 `No se puede eliminar: el tipo está usado en facturas`.
- Los permisos (`tipos_view`, `tipos_create`, `tipos_edit` y `tipos_delete`) siguen aplicando igual que antes. Sin el permiso la respuesta es 403 `No tiene permiso para esta acción`.

## 5. Facturas

Las líneas de una factura solo pueden usar tipos **de la misma bodega de la factura**, o tipos sin bodega.

- `POST /facturas` y `PUT /facturas/{id}` (si cambian `detalle` o `bodega_id`) responden:
  - 400 `Uno o más tipos no existen`
  - 400 `Uno o más tipos no pertenecen a la bodega de la factura`
- Si cambian la bodega de una factura cuyas líneas tienen tipos de la bodega anterior, recibirán ese 400. Hay que enviar también el `detalle` con tipos de la nueva bodega.

## 6. Bodegas

- `DELETE /bodegas/{id}` ahora también responde 400 `No se puede eliminar: la bodega tiene tipos`.
- Primero hay que borrar esos tipos, o que el admin los mueva a otra bodega.

## Probado

Todo esto se probó contra el servidor real:

- Un admin, un bodeguero sin bodega, uno con 1 bodega, uno con 2 bodegas y un cliente.
- Los casos de creación, listado, filtros, 403, nombre repetido por bodega, facturas con tipos de otra bodega y el borrado de bodega con tipos.

Además, la regresión general del API dio los mismos resultados que antes, salvo los cambios de tipos descritos aquí.
