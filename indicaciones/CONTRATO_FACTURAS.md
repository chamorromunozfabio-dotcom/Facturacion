# Respuestas al frontend: roles, bodegas y facturas

## 1. Roles

Roles: `admin`, `bodeguero`, `cliente`.

| Módulo | admin | bodeguero | cliente |
|---|---|---|---|
| Tipos, Bodegas | CRUD | Solo ver | — |
| Usuarios | CRUD | Solo ver clientes | — |
| Roles, Permisos | CRUD | — | — |
| Facturas: crear, editar, eliminar, entregar, recibir firmada | ✅ | ✅ | — |
| Facturas: aceptar con firma o rechazar | — | — | ✅ (solo las suyas) |
| Facturas: ver | Todas | Todas | Solo las suyas |

- Sin permiso: `403 {"detail": "No tiene permiso para esta acción"}`.
- Factura de otro cliente: `404`.

## 2. Bodega (quién recibe)

| Campo | Obligatorio |
|---|---|
| `nombre` (único) | ✅ |
| `direccion` | — |
| `ciudad` | — |
| `telefono` | — |
| `responsable_nombre` | — |
| `responsable_documento` | — |
| `responsable_telefono` | — |
| `responsable_correo` | — |

Usuario (cliente) agrega: `tipo_documento` (CC, NIT, CE), `numero_documento`, `telefono`, `direccion`.

## 3. Facturas

La orden es la factura: una sola entidad, `/facturas`.

### Estados

```
creada → entregada → aceptada (con firma) → cerrada
                   ↘ rechazada (con motivo)
```

Acción en un estado no válido: `400 {"detail": "La factura no está en un estado válido para esta acción"}`.

### Endpoints

| Método | Ruta | Quién | Efecto |
|---|---|---|---|
| GET | `/facturas?q=&estado=&page=&limit=` | todos | Listado `{data, total, page, limit}` |
| GET | `/facturas/{id}` | todos | Detalle |
| POST | `/facturas` | admin, bodeguero | Crea en estado `creada` (201) |
| PUT | `/facturas/{id}` | admin, bodeguero | Edita, solo en estado `creada` |
| DELETE | `/facturas/{id}` | admin, bodeguero | Elimina, solo en estado `creada` (204) |
| POST | `/facturas/{id}/entregar` | admin, bodeguero | Pasa a `entregada` |
| POST | `/facturas/{id}/aceptar` | cliente dueño | `{"firma": "data:image/png;base64,..."}` → pasa a `aceptada` |
| POST | `/facturas/{id}/rechazar` | cliente dueño | `{"motivo": "texto"}` → pasa a `rechazada` |
| POST | `/facturas/{id}/recibir` | admin, bodeguero | Pasa a `cerrada` |
| GET | `/facturas/{id}/pdf` | todos | Descarga el PDF |

### Crear (entrada)

```json
{
  "cliente_id": 3,
  "bodega_id": 1,
  "forma_pago": "contado",
  "medio_pago": "transferencia",
  "fecha_vencimiento": null,
  "observaciones": "Entregar en portería",
  "detalle": [
    { "tipo_id": 5, "descripcion": "Arroz 500 g", "cantidad": 10, "precio_unitario": 3500, "descuento_porcentaje": 0, "iva_porcentaje": 5 }
  ]
}
```

| Campo | Valores |
|---|---|
| `forma_pago` | `contado`, `credito` (con `credito`, `fecha_vencimiento` es obligatoria) |
| `medio_pago` | `efectivo`, `transferencia`, `tarjeta` |
| `iva_porcentaje` | 0, 5, 19 |

Los totales los calcula el backend.

### Detalle (salida)

```json
{
  "id": 1,
  "numero": "FAC-000001",
  "estado": "aceptada",
  "fecha_emision": "2026-11-18T10:30:00",
  "fecha_vencimiento": null,
  "forma_pago": "contado",
  "medio_pago": "transferencia",
  "moneda": "COP",
  "emisor": { "razon_social": "", "nit": "", "direccion": "", "telefono": "", "correo": "" },
  "adquiriente": { "id": 3, "nombre": "", "tipo_documento": "CC", "numero_documento": "", "direccion": "", "telefono": "", "correo": "" },
  "bodega": { "id": 1, "nombre": "Bodega Central", "responsable_nombre": "" },
  "detalle": [
    { "linea": 1, "tipo_id": 5, "descripcion": "Arroz 500 g", "cantidad": 10, "precio_unitario": 3500,
      "descuento_porcentaje": 0, "iva_porcentaje": 5, "subtotal": 35000, "valor_descuento": 0, "valor_iva": 1750, "total_linea": 36750 }
  ],
  "totales": { "subtotal": 35000, "total_descuento": 0, "base_gravable": 35000, "total_iva": 1750, "total": 36750 },
  "observaciones": "Entregar en portería",
  "pie_pagina": "",
  "validacion_electronica": { "cufe": "", "qr": "", "fecha_validacion": "" },
  "software": { "nombre": "Entrega de Productos", "version": "1.0.0", "fabricante": "" },
  "trazabilidad": {
    "creada_por": "", "fecha_entrega": null, "fecha_respuesta": null,
    "motivo_rechazo": null, "firma": "data:image/png;base64,...", "fecha_recepcion": null
  }
}
```

### Listado (cada elemento de `data`)

`id`, `numero`, `estado`, `fecha_emision`, `cliente_nombre`, `total`.
