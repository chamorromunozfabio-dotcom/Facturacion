# Módulo Estadísticas: listo en el backend

Seguimos su propuesta: módulo nuevo, un solo endpoint y el permiso `estadisticas_view`.
Abajo están las reglas exactas que aplica el backend.

## 1. Permiso `estadisticas_view`

- Ya existe en la tabla `permisos`. Resuélvanlo por `nombre` desde `GET /permisos`, como los otros. El catálogo pasa de 29 a 30 permisos.
- Viene **por defecto** en la plantilla de los tres roles: admin, bodeguero y cliente.
- Ya se les dio a **todos los usuarios actuales**.
- Se asigna y se quita con los endpoints de siempre: `POST/DELETE /usuarios/{id}/permisos/{permiso_id}`.

## 2. Endpoint

```http
GET /estadisticas/resumen?desde=2026-11-01&hasta=2026-11-30
```

**Fechas (opcionales, `AAAA-MM-DD`):** el periodo es por **fecha de emisión**, con ambos días incluidos.

| Envían | Periodo |
|---|---|
| Nada | El mes actual |
| Solo `desde` | De `desde` al fin de ese mes |
| Solo `hasta` | Del inicio de ese mes a `hasta` |

**Errores** (formato de siempre):

| Caso | Respuesta |
|---|---|
| Sin token | 401 `No ha iniciado sesión` |
| Sin `estadisticas_view` | 403 `No tiene permiso para esta acción` |
| Fecha mal escrita | 422 `desde: tiene un formato inválido` |
| `hasta` anterior a `desde` | 422 `hasta: debe ser igual o posterior a desde` |

## 3. Respuesta

Es la forma que propusieron:

```json
{
  "periodo": { "desde": "2026-11-01", "hasta": "2026-11-30" },
  "generado_para": "bodeguero",
  "tarjetas": [
    { "clave": "facturas", "etiqueta": "Facturas", "valor": 3, "sufijo": "" },
    { "clave": "facturado", "etiqueta": "Facturado", "valor": 7140, "sufijo": "$" }
  ],
  "series": [
    { "clave": "por_estado", "titulo": "Facturas por estado", "tipo": "barras",
      "datos": [ { "etiqueta": "Emitida", "valor": 1 }, { "etiqueta": "Entregada", "valor": 1 } ] }
  ]
}
```

- `valor` es un número. Sale **entero** si no tiene decimales (`3`, `7140`); si tiene decimales, sale con hasta 2.
- `tipo` es `barras` o `linea`.
- `generado_para` es el nombre del rol, solo como dato informativo.

## 4. Qué facturas cuenta cada rol

Usa **la misma regla de `GET /facturas`**, así los números del panel cuadran con lo que cada uno ve en su listado:

| Rol | Cuenta |
|---|---|
| admin | Todas |
| bodeguero (y cualquier rol que no sea admin ni cliente) | Solo las que **él creó** |
| cliente | Las que **él creó** + las que llevan su `cliente_id`. De las que son para él, nunca cuenta las `emitida` |

Esto ajusta lo que propusieron para el cliente ("solo `creado_por_id`"). Un cliente casi nunca crea facturas, así que con esa regla su panel saldría siempre en cero.

## 5. Qué recibe cada rol

Lo que un rol no puede ver **no se manda**.

### Tarjetas

| `clave` | Admin | Bodeguero | Cliente |
|---|---|---|---|
| `facturas` | "Facturas" | "Facturas" | "Mis facturas" |
| `facturado` ($) | "Facturado" | "Facturado" | "Total de mis facturas" |
| `pendientes` | "Pendientes de firma" | "Pendientes de firma" | "Por firmar" |
| `rechazadas` | ✔ | ✔ | ✔ |
| `usuarios_activos` | ✔ | — | — |
| `bodegas_activas` | ✔ | — | — |
| `bodegas` ("Mis bodegas") | — | ✔ | — |
| `tipos` ("Tipos en mis bodegas") | — | ✔ | — |

### Series

| `clave` | Tipo | Admin | Bodeguero | Cliente |
|---|---|---|---|---|
| `por_estado` | barras | ✔ (los 5 estados) | ✔ (los 5 estados) | ✔ (sin `Emitida`, salvo que él haya creado alguna) |
| `por_fecha` | linea | ✔ | ✔ | ✔ |
| `por_bodega` (facturado por bodega) | barras | ✔ todas | ✔ de sus facturas | — |
| `top_productos` (top 5 tipos por cantidad) | barras | ✔ todas | ✔ de sus facturas | — |

### Cómo se calculan

- **`facturado` y `top_productos`** no cuentan las facturas **rechazadas**.
- **`pendientes`** son las facturas en `entregada`, es decir, las que esperan la firma del cliente.
- **`por_fecha`:**
  - Si el periodo es de hasta 62 días, va día por día, con etiqueta `AAAA-MM-DD`.
  - Si es más largo, va mes por mes, con etiqueta `AAAA-MM`.
  - Los días o meses sin facturas vienen con `0`, para que la línea no tenga huecos.
- **`por_estado`:** trae los estados en el orden del flujo, con `0` en los que no tienen facturas.
- **Tarjetas que no dependen del periodo:** `usuarios_activos`, `bodegas_activas`, `bodegas` y `tipos` muestran el total actual.
- **Series vacías:** si una serie no tiene datos, viene con `"datos": []`. Por ejemplo, `top_productos` de un bodeguero que solo tiene facturas rechazadas.

## 6. Probado contra el servidor real

Escenario de prueba:
- 2 bodegueros y 2 clientes de prueba.
- 4 facturas: una entregada, una emitida, una rechazada y una firmada.

Resultados:
- **Las cifras cuadran con el cálculo a mano.** Por ejemplo, el bodeguero 1 tiene 3 facturas, $7.140 facturados, 1 pendiente, y su top es "Arroz" con 6 unidades.
- **El cliente** recibe solo 2 series, y su panel no muestra la factura que sigue en `emitida`.
- **Al admin** le suman las 4 facturas.
- **Errores:** sin token da 401, sin el permiso 403, y con fechas inválidas 422.
- **Regresión general:** salió igual que antes. Lo único distinto es que un bodeguero nuevo trae 16 permisos y un cliente nuevo 5, porque ahora incluyen `estadisticas_view`.
