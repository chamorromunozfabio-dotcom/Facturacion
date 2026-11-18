# Cambios del backend para el frontend

> Fecha: 18-11-2026 · Servidor: `http://192.168.20.49:8000` · Documentación: `/docs`
> Todo está publicado y probado. Abajo van primero las cosas que **tienes que cambiar** en el frontend.

---

## 🔴 Tienes que cambiar esto

### 1. Facturas: ya existe, apaga los mocks
```env
VITE_FACTURAS_MOCKS=false
```

### 2. Estados y número de factura (diferentes al contrato viejo)
| Antes (contrato) | Ahora (definitivo) |
|---|---|
| `creada` | **`emitida`** |
| `entregada` | `entregada` |
| `aceptada` | **`firmada`** |
| `rechazada` | `rechazada` |
| `cerrada` | **`recibida`** |
| `FAC-000001` | **`FE-0001`** |

Las acciones mantienen los mismos nombres: `entregar`, `aceptar`, `rechazar` y `recibir`.

### 3. Bodegas: renombrar campos
| Tu formulario | Backend |
|---|---|
| `responsable_nombre` | **`recibe_nombre`** |
| `responsable_documento` | **`recibe_documento`** |
| `responsable_telefono` | **`recibe_telefono`** |
| `responsable_correo` | ❌ no existe. Usa `correo` (de la bodega) |
| — | **nuevos:** `codigo`, `departamento`, `recibe_cargo` |

### 4. Usuarios: los datos del cliente son opcionales
`tipo_documento`, `numero_documento`, `telefono`, `direccion` y `ciudad` son **opcionales para todos los roles**. No esperes un 422 si faltan.
`tipo_documento` acepta `CC`, `NIT`, `CE` y **`PA`**.

### 5. Bodeguero: sin acceso a Usuarios
- `/usuarios` es **solo del admin**. El bodeguero recibe **403** en todo `/usuarios`, incluido `?rol=cliente`. Oculta el menú Usuarios para él.
- Para elegir el cliente al crear una factura, usa el endpoint nuevo:
  `GET /facturas/clientes?q=&page=&limit=` → `{data, total, page, limit}`, con `data: [{id, nombre, tipo_documento, numero_documento}]`.
  Trae solo clientes activos. `q` busca por nombre o por documento. Lo pueden usar admin y bodeguero.

### 6. Bodegas: cada bodega tiene dueño
- Campo nuevo: **`bodeguero_id`**. La respuesta también trae `bodeguero_nombre`.
- **Bodeguero:** ve, crea, edita y elimina **solo sus bodegas**. Las de otro le responden 404.
  Al crear una bodega queda como dueño automáticamente. No envíes `bodeguero_id`: se ignora.
- **Admin:** ve todas. Puede asignar o cambiar el dueño con `bodeguero_id` en POST o PUT, y filtrar con `GET /bodegas?bodeguero_id=`.
  Para el selector, los bodegueros salen de `GET /usuarios?rol=bodeguero`.
- **Facturas:** el bodeguero solo puede facturar desde **sus** bodegas. Si usa otra, recibe 400 `"La bodega indicada no existe, está inactiva o no le pertenece"`.
- Las bodegas que ya existían ("La santa" y "Plaza central") **no tienen dueño**: solo las ve el admin hasta que les asigne un bodeguero.

---

## 🟢 Ya funciona (no tienes que hacer nada)

### Facturas
| Método | Ruta | Quién | Cuándo |
|---|---|---|---|
| GET | `/facturas?q=&estado=&page=&limit=` | todos (el cliente solo ve las suyas) | siempre |
| GET | `/facturas/clientes?q=&page=&limit=` | admin, bodeguero | selector de cliente |
| GET | `/facturas/{id}` | todos (el cliente solo ve las suyas) | siempre |
| POST | `/facturas` | admin, bodeguero | crea en `emitida` → 201 |
| PUT | `/facturas/{id}` | admin, bodeguero | solo en `emitida` |
| DELETE | `/facturas/{id}` | admin, bodeguero | solo en `emitida` → 204 |
| POST | `/facturas/{id}/entregar` | admin, bodeguero | `emitida` → `entregada` |
| POST | `/facturas/{id}/aceptar` `{"firma": "data:image/png;base64,..."}` | cliente dueño | `entregada` → `firmada` |
| POST | `/facturas/{id}/rechazar` `{"motivo": "..."}` | cliente dueño | `entregada` → `rechazada` |
| POST | `/facturas/{id}/recibir` | admin, bodeguero | `firmada` → `recibida` |
| GET | `/facturas/{id}/pdf` | quien puede ver la factura | descarga `FE-0001.pdf` (como blob) |

- **El cliente no ve las facturas en `emitida`** (son borradores). El backend filtra con el token, así que no envíes `cliente_id`.
- `q` busca por número **o** por nombre del cliente. `estado` acepta un solo valor.
- Cada fila del listado trae `id`, `numero`, `estado`, `fecha_emision`, `cliente_id`, `cliente_nombre`, `bodega_nombre` y `total`.
- `forma_pago` acepta `contado`, `credito` o `crédito`. Con crédito, `fecha_vencimiento` es obligatoria.
- Cada línea del detalle acepta `unidad_medida` opcional (por defecto `UND`).
- **Tú no calculas totales.** El backend devuelve subtotal, descuento, IVA y total como números.
- Una acción en un estado equivocado responde 400 `"La factura no está en un estado válido para esta acción"`.

### Permisos por rol (los bloquea el backend)
| Módulo | admin | bodeguero | cliente |
|---|---|---|---|
| Tipos | todo | ver, crear, editar y eliminar | 403 |
| Bodegas | todas | **solo las suyas**: ver, crear, editar y eliminar | 403 |
| Usuarios, Roles, Permisos | todo | 403 | 403 |
| Facturas | todo | crear (desde sus bodegas), editar, eliminar, entregar y recibir | ver las suyas, aceptar y rechazar |

- En `/usuarios`, el admin puede filtrar con `?rol=cliente` o `?rol=bodeguero` (por nombre) o con `?rol_id=` (por id).

### Errores 422 en español
- `page: debe ser mayor o igual a 1`
- `limit: debe ser menor o igual a 100`
- `cantidad: debe ser mayor que 0`
- `iva_porcentaje: debe ser 0, 5 o 19`
- `detalle: debe tener al menos 1 elemento(s)`
- `firma: debe ser una imagen PNG en base64 (data:image/png;base64,...)`

### Borrados protegidos
Ya no se puede borrar un tipo, una bodega o un usuario que esté en una factura. Responde **400** con el motivo, en lugar de un error 500.

### Estable (no va a cambiar)
- Roles: `admin`, `bodeguero` y `cliente`.
- Ruta `PUT /roles/{rol_id}/permisos`.
- Login (`correo` + `contrasena`).
- CORS. No lo toqué; tu proxy `/api` sigue igual.

---

## 👤 Usuarios de prueba (solo desarrollo)
| Rol | Correo | Contraseña |
|---|---|---|
| admin | `admin@entrega.com` | `Admin123*` |
| bodeguero | `bodeguero@entrega.com` | `Bodega123*` |
| cliente | `cliente@entrega.com` | `Cliente123*` |

El cliente de prueba ya tiene documento, teléfono y dirección, así que sirve para probar facturas de punta a punta.

> ⚠️ En la base de datos actual alguien cambió desde la app los correos del bodeguero (`bodeguero@gmail.com`) y del cliente (`cliente@gmail.com`), y sus contraseñas ya no son las de la tabla. Si no entran, el admin puede corregirlos con `PUT /usuarios/{id}`.
> El bodeguero tampoco tiene bodegas todavía: el admin debe asignarle una (`PUT /bodegas/{id}` con `bodeguero_id`), o el bodeguero puede crear la suya.
