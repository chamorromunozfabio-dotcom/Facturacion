# Respuestas al frontend: roles, bodegas y facturas

> **Contrato inicial (18-11-2026), actualizado a lo vigente el 20-11-2026.** Antes se usaban `creada`/`aceptada`/`cerrada` y `FAC-000001`; hoy son `emitida`/`entregada`/`firmada`/`recibida` (o `rechazada`) y `FE-0001`. El dueño real de una factura es `creado_por_id`. Fuente confiable: `indicaciones/info-proyecto.md`.

## 1. Roles

Roles: `admin`, `bodeguero`, `cliente`.

| Módulo | admin | bodeguero | cliente |
|---|---|---|---|
| Tipos, Bodegas | CRUD global | CRUD solo de los suyos | — |
| Usuarios | CRUD | No ve el menú; `/usuarios` da `403` | — |
| Roles, Permisos | CRUD | — | — |
| Facturas: crear, editar, eliminar, entregar, recibir firmada | ✅ (excepto aceptar/rechazar ajenas) | ✅ (solo las que creó) | — |
| Facturas: aceptar con firma o rechazar | Solo las propias; ajenas → `403` | — | ✅ (solo las suyas) |
| Facturas: ver | Todas | Solo las que creó | Solo las suyas por `cliente_id` |
| Estadísticas | Cifras globales | Solo las que creó | Solo las suyas, sin `emitida` |

- Sin permiso: `403 {"detail": "No tiene permiso para esta acción"}`.
- Factura de otro cliente: `404`.

## 2. Bodega (quién recibe)

| Campo | Obligatorio |
|---|---|
| `nombre` (único) | ✅ |
| `codigo` | — |
| `departamento` | — |
| `correo` | — |
| `recibe_*` (por ejemplo `recibe_telefono`) | — |
| `bodeguero_id` | Lo asigna el backend cuando crea un bodeguero |

Los antiguos campos `responsable_*` quedaron en desuso. Usuario (cliente) agrega: `tipo_documento` (CC, NIT, CE, PA), `numero_documento`, `telefono`, `direccion` y `ciudad`.

## 3. Facturas

La orden es la factura: una sola entidad, `/facturas`.

### Estados

```
emitida → entregada → firmada (con firma) → recibida
                    ↘ rechazada (con motivo)
```

Acción en un estado no válido: `400 {"detail": "La factura no está en un estado válido para esta acción"}`.

### Endpoints

| Método | Ruta | Quién | Efecto |
|---|---|---|---|
| GET | `/facturas?q=&estado=&page=&limit=` | todos | Listado `{data, total, page, limit}`; el backend filtra por token |
| GET | `/facturas/{id}` | todos | Detalle |
| GET | `/facturas/clientes` | admin, bodeguero | Clientes para el selector del formulario |
| POST | `/facturas` | admin, bodeguero | Crea en estado `emitida` (201), número `FE-0001` |
| PUT | `/facturas/{id}` | admin, bodeguero | Edita, solo en estado `emitida` |
| DELETE | `/facturas/{id}` | admin, bodeguero | Elimina, solo en estado `emitida` (204) |
| POST | `/facturas/{id}/entregar` | admin, bodeguero | Pasa a `entregada` |
| POST | `/facturas/{id}/aceptar` | cliente dueño | `{"firma": "data:image/png;base64,..."}` → pasa a `firmada`; admin con factura ajena → `403` |
| POST | `/facturas/{id}/rechazar` | cliente dueño | `{"motivo": "texto"}` → pasa a `rechazada`; admin con factura ajena → `403` |
| POST | `/facturas/{id}/recibir` | admin, bodeguero | Pasa a `recibida` |
| GET | `/facturas/{id}/pdf` | todos | Descarga `FE-0001.pdf` (`blob`) |

El dueño para permisos es `creado_por_id` (quien creó la factura). `trazabilidad.bodeguero_id` y `creada_por` se conservan como información, pero no deciden quién puede aceptar o rechazar.

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
  "numero": "FE-0001",
  "estado": "firmada",
  "fecha_emision": "2026-11-18T10:30:00",
  "fecha_vencimiento": null,
  "forma_pago": "contado",
  "medio_pago": "transferencia",
  "moneda": "COP",
  "emisor": { "razon_social": "", "nit": "", "direccion": "", "telefono": "", "correo": "" },
  "adquiriente": { "id": 3, "nombre": "", "tipo_documento": "CC", "numero_documento": "", "direccion": "", "telefono": "", "correo": "" },
  "bodega": { "id": 1, "nombre": "Bodega Central", "recibe_nombre": "" },
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
