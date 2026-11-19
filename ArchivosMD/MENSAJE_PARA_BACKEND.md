# Mensaje para el backend — contrato v2 aplicado

> Listo para copiar y pegar. Fecha: 18-11-2026 (actualizado).
> Estado del frontend: **37 archivos de test / 183 pruebas en verde y build correcto.**

---

> Hola, gracias por `CAMBIOS_PARA_FRONTENDv2.md`. Ya lo revisé todo contra la API en vivo y apliqué los cambios en el frontend. Te confirmo qué quedó de cada lado.

## ✅ Lo que ajusté yo

1. **Bodeguero sin Usuarios.** Quité el menú, la ruta `/usuarios` y el permiso `view` de su matriz. El API ya respondía `403`, ahora el front tampoco lo ofrece.
2. **Selector de clientes.** `FacturaForm` ya no usa `/usuarios?rol=cliente`; usa tu endpoint nuevo `GET /facturas/clientes` (verifiqué 200 para admin/bodeguero y 403 para cliente).
3. **Bodegas con dueño.** Agregué `bodeguero_nombre` como columna para el admin y un selector “Bodeguero dueño” con `GET /usuarios?rol=bodeguero`. El valor se envía como número. El bodeguero no ve ese campo: al crear, el backend lo asigna solo.
4. **Permisos de bodegas.** El bodeguero ya tiene Crear/Editar/Eliminar (sus bodegas). El admin ve y edita todas.
5. **Pantalla de Permisos del admin.** Ya no es solo un CRUD suelto: el admin elige un usuario (o un rol), marca/desmarca permisos y guarda con `PUT /roles/{id}/permisos` (`permisos_ids` completo, `[]` para quitar todos). La pantalla muestra a qué usuarios afecta porque el backend guarda permisos por **rol**, no por usuario.
6. **Documentación y tests.** Actualicé README, checklist, integración y contrato interno. Agregué los Tests 35 y 36; todo en verde.

## ✅ Lo que verifiqué de tu parte

- `DELETE /tipos/{id}` con bodeguero: ya no da `403` (da `404` con id inexistente). Quedó resuelto el punto A.
- `/facturas/clientes` publicado con `{data, total, page, limit}`.
- `/bodegas` con parámetro `bodeguero_id` y campos `bodeguero_id` / `bodeguero_nombre` en la respuesta.
- El bodeguero solo recibe sus bodegas (hoy `data: []`, porque aún no tiene ninguna asignada).
- `/usuarios` da `403` para bodeguero y cliente.
- Los borrados protegidos, errores 422 en español y el PDF `FE-0001.pdf` siguen iguales.
- `PUT /roles/{id}/permisos` está en tu OpenAPI con `RolPermisosUpdate.permisos_ids` obligatorio y responde el rol con su lista nueva; lo dejamos marcado como estable en el documento v2. No modifiqué datos reales al probar: simulé axios.

## 📌 Observación sobre los documentos

`CONTRATO_FACTURASv2.md` todavía trae los valores del contrato viejo (`creada`, `aceptada`, `cerrada`, `FAC-000001`, `responsable_nombre`). No lo estamos usando como referencia; si lo vas a dejar como histórico, conviene marcarlo arriba con “versión anterior, ver CAMBIOS_PARA_FRONTENDv2.md” para evitar confusión.

También quedó sin efecto nuestro pedido anterior de filtrar `GET /facturas` por bodega: tu cuadro v2 dice que el bodeguero **ve todas** y solo puede crear desde las suyas. Nos alineamos con eso.

## Cuentas con las que estoy probando

| Rol | Correo | Contraseña |
|---|---|---|
| admin | `admin@entrega.com` | `Admin123*` |
| bodeguero | `bodeguero@gmail.com` | `Bodega123*` |
| cliente | `cliente@gmail.com` | `Cliente123*` |

> Coincido con tu aviso: las cuentas `@entrega.com` del documento v2 ya no son las que están en la BD. Estas son las que responden `200`.

## ✅ Pedido de permisos por usuario — resuelto por el backend (18-11-2026)

> Gracias por `RESPUESTA_PERMISOS_FRONTEND.md`. Verifiqué los 4 endpoints en `/openapi.json` y que `/login`, `/me` y `/usuarios` traen `permisos`. Ya adapté la vista: eliges usuario, cargas `GET /usuarios/{id}/permisos` y guardas con `PUT /usuarios/{id}/permisos`. Dejo el pedido original abajo como registro.

### Pedido original

Hola, necesitamos cambiar el modelo de permisos. Hoy `PUT /roles/{id}/permisos` asigna permisos al **rol**, así que no se puede dar o quitar un acceso a **un usuario** sin afectar a todos los que tienen ese rol. Para la lógica de negocio necesitamos que el permiso sea **por usuario**.

### Lo que necesitamos del backend

1. Tabla nueva `usuario_permisos` con `usuario_id` + `permiso_id` (únicos juntos, con FK a `usuarios` y `permisos`).
2. Endpoints nuevos, **solo admin**:
   - `GET /usuarios/{usuario_id}/permisos` → `{ data: [{ id, nombre }] }` (o la misma forma que ya usan los roles).
   - `PUT /usuarios/{usuario_id}/permisos` con `{ "permisos_ids": [1, 2] }` → **reemplaza** todos los permisos del usuario y devuelve el usuario con `permisos: [{id, nombre}]`. `[]` le quita todos. Si algún id no existe → `400` y no cambia nada. Usuario inexistente → `404`. No admin → `403`.
   - Opcional: `POST /usuarios/{id}/permisos/{permiso_id}` y `DELETE /usuarios/{id}/permisos/{permiso_id}` para sumar/quitar uno solo.
3. Que `GET /usuarios`, `GET /usuarios/{id}` y `GET /me` traigan el campo `permisos: [{ id, nombre }]`, como ya trae `RolOut`.
4. Regla de **permisos efectivos**. Recomiendo esta: **los permisos efectivos son solo los del usuario**; el rol se usa únicamente como plantilla al crearlo (se copian sus permisos en ese momento). Así, cambiar un rol después **no** modifica silenciosamente a los usuarios ya creados. La alternativa sería unir rol + usuario, pero para "quitar" haría falta además una lista de permisos denegados.
5. Migración: al crear la tabla, copiar los permisos actuales de `roles_permisos` a `usuario_permisos` para que nadie se quede sin acceso.
6. Podés dejar `PUT /roles/{id}/permisos` por compatibilidad, pero marcarlo como "plantilla/legacy" para evitar confusión.
7. Si además los guards de los endpoints van a usar estos permisos en vez de un rol fijo, avisennos para probar los `403` con cada permiso.

### Qué hacemos nosotros en el frontend

En cuanto estén publicados los endpoints, cambiamos `PermisosView`: el usuario ya se puede elegir en el selector y los checks ya están; solo reemplazamos la llamada `PUT /roles/{id}/permisos` por `PUT /usuarios/{id}/permisos` y mostramos los `permisos` que devuelve cada usuario. No tocamos CORS ni el proxy `/api`.

Si ves algo distinto en una prueba manual, me pasás **rol + pasos + mensaje de consola (F12)** y lo ajustamos. ¡Gracias! 🚀

---

## 🧾 Facturas: todos los datos obligatorios salvo `observaciones` (19-11-2026)

> Confirmado por el equipo de frontend. Ya lo aplicamos en `FacturaForm.vue`; necesitamos que el contrato del backend coincida.

Hola, según lo que acordamos, en `POST /facturas` y `PUT /facturas/{id}` queremos que **todos los campos sean obligatorios y el único opcional sea `observaciones`**:

- **Cabecera:** `cliente_id`, `bodega_id`, `forma_pago`, `medio_pago`, `fecha_vencimiento`.
- **Detalle:** al menos 1 línea con `tipo_id`, `descripcion`, `unidad_medida`, `cantidad`, `precio_unitario`, `descuento_porcentaje`, `iva_porcentaje`.
- **`observaciones`:** opcional (aceptamos `null` o texto).

Hoy `/openapi.json` marca `forma_pago` (default `contado`), `medio_pago`, `fecha_vencimiento`, `tipo_id`, `unidad_medida` (default `UND`), `descuento_porcentaje` (default `0`) e `iva_porcentaje` (default `19`) como opcionales o con valores por defecto. Si van a mantener esos defaults, avísenos para no exigirlos en el formulario; si pueden pasarlos a obligatorios, mejor para que el mensaje sea idéntico en ambos lados.

También confirmamos que `fecha_vencimiento` debe ser obligatoria **siempre**, no solo cuando `forma_pago` es `credito`/`crédito`.

Cuando falte un dato, ¿podemos recibir un `422` con un mensaje en español por campo? Ejemplo:

```json
{
  "detail": {
    "cliente_id": "Falta seleccionar el cliente: elige quién recibe la factura.",
    "detalle[0].descripcion": "Falta la descripción del producto en la línea 1: escribe qué producto se está entregando.",
    "detalle[0].iva_porcentaje": "Falta el IVA en la línea 1: selecciona 0, 5 o 19."
  }
}
```

Si prefieren el formato `loc`/`msg` de FastAPI, mándenlo y lo adaptamos del lado del front sin cambiar el texto visible para el usuario.
