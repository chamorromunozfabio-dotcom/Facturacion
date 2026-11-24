# Respuesta del backend: formulario de facturas

> Fecha: 19-11-2026 · Servidor: `http://192.168.20.49:8000` · Ya está publicado y probado; `/openapi.json` ya refleja estos cambios.

## 1 y 2) Campos obligatorios en `POST /facturas`: ✅ ahora coinciden con su formulario

| Campo | ¿Obligatorio? |
|---|---|
| `cliente_id` | ✅ sí |
| `bodega_id` | ✅ sí (si factura un bodeguero, debe ser una de sus bodegas) |
| `forma_pago` | ✅ sí: `contado` o `credito` (se acepta `crédito`) |
| `medio_pago` | ✅ sí: `efectivo`, `transferencia` o `tarjeta` |
| `fecha_vencimiento` | ⚠️ **solo con `credito`** (ver punto 4) |
| `observaciones` | ❌ opcional, el único |
| `detalle` | ✅ sí, al menos 1 línea |

**En cada línea de `detalle`, todo es obligatorio:**

| Campo | Regla |
|---|---|
| `tipo_id` | id de un tipo existente |
| `descripcion` | de 1 a 255 caracteres |
| `unidad_medida` | hasta 20 caracteres (se guarda en MAYÚSCULAS: `und` → `UND`) |
| `cantidad` | mayor que 0, hasta 2 decimales |
| `precio_unitario` | mayor o igual a 0, sin IVA |
| `descuento_porcentaje` | de 0 a 100 (**envía 0** si no hay descuento) |
| `iva_porcentaje` | 0, 5 o 19 |

Ya **no hay valores por defecto**: `forma_pago`, `unidad_medida`, `descuento_porcentaje` e `iva_porcentaje` deben venir siempre.
Las mismas reglas aplican en `PUT /facturas/{id}` cuando se envía `detalle` (reemplaza todas las líneas).

## 3) 422 con un mensaje por campo: ✅ con una diferencia de formato

No cambiamos `detail` a objeto, porque así se rompería el `{"detail": "texto"}` que ya usan en todos los módulos.
En su lugar, **todos los 422 de la API** traen además una clave **`errores`** con un mensaje por campo y la ruta completa:

```json
{
  "detail": "cliente_id: es obligatorio; descripcion: es obligatorio",
  "errores": {
    "cliente_id": "es obligatorio",
    "detalle[0].descripcion": "es obligatorio"
  }
}
```

- **Claves:** la ruta completa del campo, con la posición en las listas: `detalle[0].cantidad`, `detalle[2].tipo_id`, etc. La línea 1 es `detalle[0]`.
- **Mensajes:** en español y genéricos: `es obligatorio`, `debe ser mayor que 0`, `debe ser 0, 5 o 19`, `debe ser efectivo, transferencia o tarjeta`...
  Los textos amigables para el usuario ("Selecciona un cliente.", "Escribe la descripción del producto en la línea 1.") conviene armarlos en el front a partir de la clave.
- Si el JSON llega roto: `"errores": {"general": "El cuerpo de la petición no es un JSON válido"}`.
- Los demás errores (400, 401, 403, 404) siguen como siempre: solo `{"detail": "texto"}`.

Ejemplo real con `{}`:
```json
{
  "detail": "cliente_id: es obligatorio; bodega_id: es obligatorio; forma_pago: es obligatorio; medio_pago: es obligatorio; detalle: es obligatorio",
  "errores": {"cliente_id": "es obligatorio", "bodega_id": "es obligatorio", "forma_pago": "es obligatorio",
              "medio_pago": "es obligatorio", "detalle": "es obligatorio"}
}
```

## 4) `fecha_vencimiento`: obligatoria **solo con crédito**

- Con `credito` sin fecha → 422 con `"errores": {"fecha_vencimiento": "es obligatoria cuando la forma de pago es crédito"}`.
- Con `contado` pueden mandarla o no: con fecha → 201 y se guarda; sin fecha o `null` → 201.
- Si la mandan siempre (como dijeron), no hay problema. Solo tengan en cuenta que en la factura de contado también quedará guardada.

## Otro cambio
- `medio_pago` ya no se puede borrar con `""` en el `PUT`, porque ahora es obligatorio. Se puede cambiar por otro valor válido.
