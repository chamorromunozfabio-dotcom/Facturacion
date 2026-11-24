# Campos de solo números en Facturas y Usuarios

El backend ahora rechaza con **422** los textos en los campos numéricos. Antes convertía `"10"` en `10`.

**Importante para el front:** un `<input>` de HTML entrega texto. Hay que convertirlo antes de enviar (`Number(valor)` o `v-model.number`) y no mandar `""` si el campo está vacío.

## 1. Facturas (`POST /facturas` y `PUT /facturas/{id}`)

| Campo | Se acepta | Se rechaza |
|---|---|---|
| `cliente_id`, `bodega_id`, `detalle[].tipo_id` | entero: `3` | `"3"`, `3.5`, `true`, `""` |
| `detalle[].cantidad` | número mayor que 0, hasta 2 decimales: `10`, `1.5` | `"10"`, `""`, `true` |
| `detalle[].precio_unitario` | número desde 0, hasta 2 decimales | `"3500"`, `""` |
| `detalle[].descuento_porcentaje` | número de 0 a 100, hasta 2 decimales | `"0"`, `""` |
| `detalle[].iva_porcentaje` | `0`, `5` o `19` | `"19"` |

## 2. Usuarios (`POST /usuarios` y `PUT /usuarios/{id}`)

| Campo | Cómo se envía | Regla |
|---|---|---|
| `rol_id` | número | `3`, no `"3"` |
| `numero_documento` | texto | Solo dígitos, sin puntos, guiones ni espacios. **Solo con tipo `PA`** acepta también letras |
| `telefono` | texto | Solo dígitos, de **7 a 15**. Sin `+`, espacios ni guiones |

- `numero_documento` y `telefono` **siguen siendo texto** en el JSON (`"1020304050"`), porque pueden empezar por 0. Si se envían como número, dan 422.
- `""` sigue sirviendo para borrarlos.
- **Al editar**, el documento se valida con el tipo que va a quedar guardado. Si un usuario tiene pasaporte con letras y lo pasan a `CC`, hay que enviar también el número nuevo.

En `PUT /usuarios/{id}/permisos`, los `permisos_ids` también van como números: `[1, 2]`.

## 3. Mensajes

Llegan en `errores`, con la ruta del campo:

```json
{
  "detail": "cantidad: debe ser un número; precio_unitario: debe ser un número",
  "errores": {
    "detalle[0].cantidad": "debe ser un número",
    "detalle[0].precio_unitario": "debe ser un número"
  }
}
```

| Mensaje | Cuándo |
|---|---|
| `debe ser un número` | Llegó un texto, `true`/`false`, una lista, etc. |
| `debe ser un número entero` | Un id con decimales (`3.5`) |
| `solo puede tener números` | Documento o teléfono con letras o símbolos |
| `solo puede tener letras y números` | Pasaporte (`PA`) con símbolos |
| `debe tener entre 7 y 15 dígitos` | Teléfono muy corto o muy largo |

Los demás mensajes no cambian (`es obligatorio`, `debe ser mayor que 0`, `debe ser 0, 5 o 19`…).

## 4. Lo que no cambió

- Las respuestas (`GET`) son iguales.
- Bodegas no cambió: `telefono`, `recibe_documento` y `recibe_telefono` siguen aceptando cualquier texto.
