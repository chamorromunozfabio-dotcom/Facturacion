# Mensaje para el backend — contrato v2 aplicado

> Listo para copiar y pegar. Fecha: 18-11-2026 (actualizado).
> Estado del frontend: **41 archivos de test / 208 pruebas en verde y build correcto.**

---

> Hola, gracias por `CAMBIOS_PARA_FRONTENDv2.md`. Ya lo revisé todo contra la API en vivo y apliqué los cambios en el frontend. Te confirmo qué quedó de cada lado.

## ✅ Lo que ajusté yo

1. **Bodeguero sin Usuarios.** Quité el menú, la ruta `/usuarios` y el permiso `view` de su matriz. El API ya respondía `403`, ahora el front tampoco lo ofrece.
2. **Selector de clientes.** `FacturaForm` ya no usa `/usuarios?rol=cliente`; usa tu endpoint nuevo `GET /facturas/clientes` (verifiqué 200 para admin/bodeguero y 403 para cliente).
3. **Bodegas con dueño.** Agregué `bodeguero_nombre` como columna para el admin y un selector “Bodeguero dueño” con `GET /usuarios?rol=bodeguero`. El valor se envía como número. El bodeguero no ve ese campo: al crear, el backend lo asigna solo.
4. **Permisos de bodegas.** El bodeguero ya tiene Crear/Editar/Eliminar (sus bodegas). El admin ve y edita todas.
5. **Pantalla de Permisos del admin.** Ya no es solo un CRUD suelto: el admin elige un **usuario**, ve sus permisos y los da o quita con `POST/DELETE /usuarios/{id}/permisos/{permiso_id}`. El rol aparece solo como referencia; los accesos se guardan por usuario (ver sección del 19-11 al final).
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

### Respuesta recibida (19-11-2026) — ✅ adaptado

Gracias por `RESPUESTA_FORMULARIO_FACTURAS.md`. Confirmado: dejamos `detail` como texto y usamos la clave nueva `errores`. El front ya lee claves como `detalle[0].descripcion` y las convierte en mensajes amigables al lado de cada campo, por ejemplo:

- `cliente_id: es obligatorio` → `Revisa el cliente: es obligatorio.`
- `detalle[0].descripcion: es obligatorio` → `Revisa la descripción del producto de la línea 1: es obligatorio.`

También respetamos que `bodega_id` debe ser una de las bodegas del bodeguero y que `unidad_medida` se guarda en MAYÚSCULAS. Sobre `fecha_vencimiento`: quedó **solo con `credito`**, como indican en su respuesta. Con `contado` el campo ni se muestra y enviamos `null`. Si antes quedó guardada en alguna factura de contado, el próximo `PUT` la limpiará.

### Respuesta recibida (19-11-2026) — bodegas obligatorias ✅ adaptado

Gracias por `CAMBIO_BODEGAS_OBLIGATORIAS.md`. Confirmado:

- Los 11 datos de bodega ahora son obligatorios en el front, con los largos nuevos (`codigo` 30, `recibe_documento` 30, `recibe_cargo` 100). Enviamos `codigo` en MAYÚSCULAS.
- Ya no filtramos campos vacíos: si el usuario borra un dato, el front lo detecta y muestra un aviso corto junto al campo (por ejemplo `Escribe teléfono.`), antes de llamar al backend.
- Aceptamos el mensaje nuevo **`no puede estar vacío`** en toda la API. Lo dejamos tal cual en la alerta; no necesitamos que lo cambien.
- Aprovechamos para unificar la validación: avisos cortos por campo en **facturas y bodegas**, sin resumen inferior, y el aviso se corrige en cuanto el usuario escribe un valor válido.

---

## 🔑 Catálogo fijo de permisos funcionales (19-11-2026)

Hola, ajustamos la pantalla de Permisos según lo que pidió el equipo: el admin **ya no crea ni nombra permisos**. Ahora elige una funcionalidad de un desplegable fijo (módulo + acción) y con un botón se la da o se la quita a **un usuario**:

- `GET /usuarios/{id}/permisos` → permisos que ya tiene.
- `POST /usuarios/{id}/permisos/{permiso_id}` → dar permiso.
- `DELETE /usuarios/{id}/permisos/{permiso_id}` → quitar permiso.

El catálogo y la plantilla de referencia por rol están fijos en el front (`src/config/permissions.js`). Para poder guardar necesitamos que `GET /permisos` publique estos `nombre` (uno por módulo + acción):

```
facturas_view, facturas_create, facturas_edit, facturas_delete,
facturas_entregar, facturas_recibir, facturas_aceptar, facturas_rechazar, facturas_pdf
bodegas_view, bodegas_create, bodegas_edit, bodegas_delete
usuarios_view, usuarios_create, usuarios_edit, usuarios_delete
tipos_view, tipos_create, tipos_edit, tipos_delete
roles_view, roles_create, roles_edit, roles_delete
permisos_view, permisos_create, permisos_edit, permisos_delete
```

Hoy en vivo solo existe `ususarios` (id 6). Lo seguimos reconociendo como `usuarios_view` para no perder ese acceso ya guardado, pero las otras 28 funciones aparecen deshabilitadas en el desplegable hasta que las publiquen. **No necesitamos ids concretos**: resolvemos el id por `nombre` al cargar `/permisos`.

Dos preguntas:

1. ¿Pueden sembrar esos 29 nombres en `/permisos`? Si prefieren otros nombres, nos pasan el listado y lo adaptamos del lado del front.
2. Los guards de los endpoints hoy siguen siendo por rol. Hasta que pasen a usar los permisos del usuario, dar o quitar un permiso cambia los datos pero **no cambia el acceso real**. ¿Lo van a migrar?

No tocamos CORS ni el proxy `/api`.

### Respuesta recibida (19-11-2026) — permisos por usuario ✅ adaptado

Gracias por `RESPUESTA_PERMISOS_POR_USUARIO.md`. Verifiqué el servidor en vivo: `GET /permisos` devuelve `total: 29`, `usuarios_view` es el id 6, `ususarios` ya no existe y las plantillas quedaron en 27/15/4.

Apliqué todo de tu lado:

- **Saqué el alias `ususarios`** del front. Ahora se usa solo el nombre exacto `usuarios_view`.
- **El menú, los botones y las rutas ya leen los permisos reales** que vienen en `/login` y `/me` (`auth.permisos`), en vez de la matriz fija por rol. Si le quitan `facturas_create` a un bodeguero, el botón “Nueva factura” desaparece y la ruta directa redirige al inicio. El backend sigue siendo quien bloquea con `403`.
- **Admin con acceso total** respetado, con la excepción que indicaron: aceptar/rechazar facturas ajenas sigue oculto para el admin (`403` del backend).
- **Sin refresh manual:** `main.js` ya llama a `GET /me` al cargar la app, así que los cambios de permisos se ven al recargar.
- La matriz por rol quedó **solo como respaldo** para sesiones antiguas y las cuentas demo de mocks.

Agregué el Test 41 para cubrir este alineamiento; todo en verde. Si el nombre de algún permiso cambia en el futuro, avisen y lo ajustamos.
