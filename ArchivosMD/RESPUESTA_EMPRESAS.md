# Empresas, registro público y multiempresa: respuestas del backend

> **Esto es el contrato acordado, todavía no está implementado.** Hoy no existen `/register`, `/empresas`,
> `/clientes/buscar`, `empresa_id` ni el rol `empresa`. Sigan con mocks hasta que les avisemos.
> Lo marcado con ✅ ya funciona.

Errores, en todos los casos (✅ formato actual):

- **422** validación: `{"detail": "texto", "errores": {"campo": "mensaje"}}`
- **400** regla de negocio (duplicados, estado inválido): `{"detail": "texto"}`. No usamos 409.
- **401** sin sesión, **403** sin permiso, **404** no existe o no es suyo.

## 1. Registro público: `POST /register`

1. **Un solo endpoint con `tipo`**, tal como lo enviaron.
2. **Cliente:** queda activo y entra de inmediato. **Empresa:** queda `pendiente` y `POST /login` da **403** hasta que un admin la active.
3. **Respuestas (201).** Ninguna devuelve token: después se llama a `/login`.

```json
{ "message": "Cuenta creada", "user": { "id": 9, "nombre": "Juan Pérez", "correo": "juan@cliente.com", "rol": "cliente" } }
```
```json
{ "message": "Registro recibido. Un administrador debe aprobar la empresa", "estado": "pendiente",
  "empresa": { "id": 1, "razon_social": "Distribuidora Andina S.A.S.", "nit": "900123456-1", "estado": "pendiente" } }
```

4. **Repetidos: 400**, con uno de estos `detail`: `Ya existe un usuario con ese correo`, `Ya existe un usuario con ese documento`, `Ya existe una empresa con ese NIT`.
5. **Sí se crea el usuario de la empresa** en el registro, con rol `empresa`, el correo y la contraseña enviados y `nombre` = `representante`. No puede entrar hasta que la empresa esté activa. Permisos: sección 6.
6. **No.** El correo es único en todo el sistema: el mismo correo no puede ser cliente y empresa. Da 400 en ambos sentidos.

Validaciones:

| Campo | Regla |
|---|---|
| `nit` | Obligatorio, con dígito de verificación: `900123456-1` |
| `telefono` | Solo dígitos, de 7 a 15 |
| `numero_documento` | Solo dígitos (con `PA` también letras) |
| `contrasena` | De 8 a 72 caracteres |
| `razon_social`, `representante`, `nombre` | De 1 a 100 caracteres |
| `direccion` | De 1 a 200 caracteres |

El rol lo decide el backend según `tipo`. Si envían `rol_id`, `estado` o `permisos`, se ignoran.

## 2. Empresas (solo admin)

1. `GET /empresas?q=&estado=&page=&limit=` → `{data, total, page, limit}`. `q` busca en razón social, NIT y correo. Cada empresa:

```json
{ "id": 1, "razon_social": "Distribuidora Andina S.A.S.", "nit": "900123456-1", "correo": "empresa@entrega.com",
  "telefono": "3001234567", "direccion": "Calle 10 # 20-30", "representante": "Ana Torres", "estado": "pendiente",
  "motivo_rechazo": null, "fecha_registro": "2026-11-24T10:30:00",
  "total_bodegueros": 0, "total_bodegas": 0, "total_facturas": 0 }
```

2. Estados exactos: `pendiente`, `activa`, `rechazada`, `suspendida`. Reactivar es `PATCH /empresas/{id}/estado` con `{"estado": "activa"}`; no hay endpoint aparte. Responde 200 con la empresa.

| Desde | Puede pasar a |
|---|---|
| `pendiente` | `activa`, `rechazada` |
| `activa` | `suspendida` |
| `suspendida` | `activa` |
| `rechazada` | `activa` |

Otro cambio: **400** `No se puede pasar de <estado> a <estado>`.

3. `motivo_rechazo` es obligatorio al rechazar, de 10 a 255 caracteres. Si falta: **422** `motivo_rechazo: es obligatorio`. Si es corto: **422** `motivo_rechazo: debe tener al menos 10 caracteres`.
4. **Suspender bloquea a todos sus usuarios** (empresa y bodegueros): `/login`, `/refresh` y cualquier petición con un token ya emitido dan **403**. Sus bodegas y facturas no se borran. Los clientes siguen viendo, aceptando o rechazando las facturas que ya recibieron.
5. **Sí, solo admin.** Los demás roles reciben 403.

Textos del 403. En el login salen solo si la contraseña es correcta; si no, es el 401 de siempre:

- `Su empresa está pendiente de aprobación`
- `Su empresa fue rechazada: <motivo>`
- `Su empresa está suspendida`

## 3. Multiempresa

1. `/login` y `/me` traen `user.empresa`: `{"id", "razon_social", "estado"}` para empresa y bodeguero. Es `null` para admin, cliente y bodegueros sin empresa. No habrá `empresa_id` ni `empresa_nombre` sueltos.
2. **Sí, el backend filtra solo, por el token:**

| Rol | Ve |
|---|---|
| admin | Todo |
| empresa | Bodegueros, bodegas, tipos y facturas **de su empresa** |
| bodeguero | Igual que hoy: sus bodegas, los tipos de ellas y las facturas que creó |
| cliente | Igual que hoy. Los clientes no pertenecen a ninguna empresa |

3. El admin puede filtrar con `?empresa_id=` en `/usuarios`, `/bodegas`, `/tipos`, `/facturas` y `/estadisticas/resumen`. Para los demás roles ese parámetro se ignora. Para el selector usen `GET /empresas?estado=activa`.
4. **Sí, es obligatorio** cuando el **admin** crea un bodeguero, un usuario `empresa` o una bodega. Si falta: **422** `empresa_id: es obligatorio`. Si no existe o no está activa: **400**. Como los demás ids, va como número (`1`, no `"1"`). El `bodeguero_id` de una bodega debe ser de la misma empresa (400).
5. **Sí.** El backend asigna la empresa del token e ignora el `empresa_id` que envíen. El rol `empresa` solo puede crear, editar y eliminar **bodegueros de su empresa**; con otro `rol_id` recibe 403.
6. **Todavía no existe.** Se creará con el nombre `empresa`. Quiten el respaldo `4`: ese id no existe hoy y no será el suyo. Resuélvanlo siempre por nombre.

**Datos actuales:** el bodeguero, las bodegas y las facturas que ya existen quedan sin empresa (`null`). El bodeguero los sigue viendo igual; además de él, solo el admin.

## 4. Búsqueda de clientes

1. **Sí:** `GET /clientes/buscar?q=&page=&limit=` → `{data, total, page, limit}`. `q` es obligatorio, mínimo 5 caracteres (422). Busca por nombre, documento y correo, solo clientes activos. Cada fila: `id`, `nombre`, `tipo_documento`, `numero_documento`.
2. Para quien tenga `facturas_create` (admin, bodeguero y empresa).
3. ✅ `/facturas/clientes` sigue funcionando. La retiramos cuando nos confirmen que ya migraron.

## 5. Facturas

1. **Se mantiene `numero`.** No agregamos `numero_factura`. El prefijo es `FE` (`FE-0001`), no `FAC`.
2. **Migramos a `motivo_rechazo`**, de 10 a 255 caracteres. Mientras cambian, aceptamos también `motivo` con su regla actual (1 a 255).
3. ✅ **Ya está bloqueado.** Editar o eliminar fuera de `emitida` da 400 `La factura no está en un estado válido para esta acción`. Oculten los botones.

**Cambio nuevo, el emisor:** la factura saldrá con la razón social y el NIT de **su empresa**, y **cada empresa tiene su propia numeración**. Las facturas viejas no cambian. Por eso:

- `numero` se puede repetir entre empresas. **Usen siempre `id`** como clave y en las rutas, nunca `numero`.
- El listado y el detalle traerán `empresa_id` y `empresa_nombre`. Muéstrenlos al admin y al cliente.

## 6. Permisos del rol `empresa`

- **No creamos permisos `empresa_*`**: se reutilizan los 30 actuales, por usuario. Los nombres van con guion bajo (`facturas_aceptar`).
- Plantilla: `tipos_*`, `bodegas_*`, `usuarios_*` (solo sobre sus bodegueros), `facturas_view/create/edit/delete/entregar/recibir/pdf` y `estadisticas_view`.
- **El backend responde 403 siempre**, aunque alguien le asigne el permiso:
  - aceptar o rechazar facturas (✅ hoy ya solo puede el cliente de la factura);
  - todo `/empresas`;
  - asignar o quitar permisos a cualquier usuario.

## 7. Algo que necesitamos de ustedes

Ya tienen el **bloqueo de teclas no numéricas** en el registro. Por favor úsenlo en los demás formularios, empezando por **Bodegas**: `telefono`, `recibe_telefono` y `recibe_documento`. También en Usuarios (`telefono` y `numero_documento`, salvo con `PA`) y en las cantidades y precios de Facturas. Que cubra también **pegar** texto. El backend ya rechaza las letras; las reglas están en `RESPUESTA_SOLO_NUMEROS.md`.
