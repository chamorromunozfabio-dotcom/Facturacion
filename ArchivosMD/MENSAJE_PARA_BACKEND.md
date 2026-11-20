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

> **Actualización posterior:** eso se corrigió después. La regla vigente es que el bodeguero ve **solo las facturas que creó** (`creado_por_id`), el cliente las de su `cliente_id` (sin `emitida`) y el admin todas. El front no envía ids para filtrar: el backend lo hace por token. Ver `ArchivosMD/RESPUESTA_ESTADISTICAS.md` e `indicaciones/info-proyecto.md`.

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

---

## Pedido (19-11-2026) — tipos de producto por bodega

Hola equipo 👋

Queremos que **cada bodega tenga su propio catálogo de tipos**. Hoy `POST /tipos` crea un tipo global: si lo crea el bodeguero 1, le aparece también al bodeguero 2. Necesitamos que quede asociado a una bodega.

### Contrato que necesitamos

**1. `TipoOut` debe incluir `bodega_id` y, si es posible, `bodega_nombre`.**

**2. `POST /tipos` — asignación automática por usuario (lo que elegimos):**
- Si quien crea es **bodeguero**: el backend asigna el tipo a **su bodega** (la que tenga `bodeguero_id` = id del usuario), sin importar lo que venga en el body. Si no tiene bodega asignada, devolver un `400` claro.
- Si quien crea es **admin**: el front envía `bodega_id` en el body y el backend lo respeta (lo validamos nosotros en el formulario).
- La **unicidad del nombre debe ser por bodega**, no global: "Arroz" puede existir en la bodega 1 y en la bodega 2 sin conflicto, pero no dos veces en la misma bodega.

**3. `GET /tipos?bodega_id=X` — nuevo filtro opcional:**
- **Bodeguero:** siempre ve solo los tipos de su bodega (por seguridad, ignora o valida el parámetro).
- **Admin:** si envían `bodega_id`, devuelve solo esos tipos; si no lo envían, mantiene el comportamiento actual de devolver todos (así no rompemos nada).

**4. `PUT /tipos/{id}` y `DELETE /tipos/{id}`:**
- El bodeguero solo puede editar/borrar tipos de **su** bodega; si intenta con otro, `403`.
- El admin puede editarlos todos. Si se permite cambiar `bodega_id` en el PUT, mejor; si no, también lo adaptamos.

### De nuestro lado (front)
Ya preparamos el `bodega_id` en el envío y el filtro en la pantalla de Tipos, además de reemplazar el desplegable de tipos en Facturas por un **buscador** (así no se hace enorme con muchos productos).

Pusimos un **fallback**: si el backend todavía no devuelve `bodega_id`, el front sigue mostrando todos los tipos como hoy. O sea que nuestro cambio no rompe nada mientras publican esto. Cuando esté listo, avisen y lo verificamos en vivo con el admin y el bodeguero de prueba. Gracias 🚀

> **Resuelto (ver respuesta recibida abajo):** el backend ya devuelve `bodega_id`, el front usa los tipos por bodega reales y el catálogo de facturas pide `GET /tipos?estado=true`. El fallback quedó solo para modo demo.

### Respuesta recibida (19-11-2026) — `RESPUESTA_TIPOS_POR_BODEGA.md` ✅ adoptado

Gracias, quedó claro y ya adaptamos el front:

- **Tipos generales (`bodega_id: null`)**: el admin puede crearlos desde un option “Tipo general (sin bodega)”, verlos con “Todas las bodegas” y devolver un tipo a general en una edición (`bodega_id: null`). En el formulario de factura se muestran junto a los tipos de la bodega elegida, porque el backend los acepta.
- **Bodeguero**: el selector de bodega aparece solo cuando tiene más de una; con una sola se asigna automáticamente. Verificamos en vivo que con bodega ajena recibe `total: 0` y no un error.
- **Solo activos**: el catálogo de facturas ahora pide `GET /tipos?estado=true`.
- **Verificación en vivo**: creé un tipo temporal en la bodega del bodeguero de prueba → `201` con `bodega_id`/`bodega_nombre`; lo vio el admin filtrando y el propio bodeguero; una bodega ajena devolvió `total: 0`; lo borré (`204`). No quedaron datos.

Todo en verde: **57 archivos / 312 pruebas** y build correcto (en ese momento eran 44 / 234). Si el catálogo de facturas debe mostrar también tipos inactivos en algún caso, avisen y lo ajustamos.

---

## Pedido (19-11-2026) — cada usuario solo sus propias facturas

Hola 👋 Confirmamos la regla de propiedad con el líder. Hoy `GET /facturas` devuelve **las 5 facturas** al admin, al bodeguero y al cliente (lo verificamos en vivo): el filtro actual solo aplica al rol `cliente` por `cliente_id`. Queremos esto:

### Regla de dueño

| Rol | Facturas que debe ver |
|---|---|
| **Admin** | Todas (sin cambio, se mantiene la excepción actual). |
| **Bodeguero** | Solo las que **él creó**. |
| **Cliente** | Las que **él creó** + las que tienen su `cliente_id` (y nunca las `emitida`, como hoy). |

### Alcance (importante)

Que el filtro se aplique en **todos** los endpoints de facturas, no solo en el listado: `GET /facturas/{id}`, `PUT`, `DELETE`, PDF, entregar, recibir, aceptar y rechazar. Si la factura no es suya, queremos **404** aunque tenga el link directo (es lo que eligió el líder). El admin sigue teniendo acceso a todas.

### Dato que necesitamos del backend

Hoy el listado trae `cliente_id`, `cliente_nombre`, `bodega_nombre`, etc., pero **no trae quién creó la factura**. En el detalle aparece `trazabilidad.creada_por: "Administrador"` (texto) y `trazabilidad.bodeguero_id: 1`, que es ambiguo: en esa factura el `1` es el admin, no un bodeguero.

Por eso pedimos una de dos opciones:

1. **Ideal:** agregar `creado_por_id` (numérico) a cada fila de `GET /facturas` y al `FacturaOut`, y filtrar por él según el token.
2. **Si ya existe ese dato con otro nombre:** decinos el nombre exacto y lo devolvés también en el listado, lo adaptamos sin drama.

No hace falta un parámetro nuevo en la URL: el dueño se deduce del token, para que nadie pueda pedir facturas ajenas cambiando un filtro.

### Facturas viejas

Las 5 facturas actuales parecen creadas por el admin. ¿Se pueden backfillear con su creador real? Si no es posible, la regla por defecto que nos sirve es: **sin creador conocido → solo admin**. Así no le aparecen facturas ajenas al bodeguero de prueba.

### De nuestro lado (front)

Preparamos el aviso por rol (“Ves todas” / “Solo las que creaste” / “Solo tus facturas”) y una prueba que verifica que el front muestra exactamente lo que devuelve el backend y que un `404` al abrir una factura ajena no deja la pantalla rota. El front **no envía ningún flag de “ver todas”**: confiamos en el filtro del token, que es lo seguro.

Mientras publican esto, el front sigue funcionando con el comportamiento actual. Cuando esté listo, lo verificamos en vivo con los tres usuarios de prueba. Gracias 🚀

### Respuesta recibida (19-11-2026) — `RESPUESTA_DUENO_FACTURAS.md` ✅ adoptado

Gracias, quedó clarísimo y ya lo verificamos contra el servidor real:

- **Admin:** 5 facturas.
- **Bodeguero Prueba (id 2):** 3 (`FE-0001`, `FE-0006`, `FE-0007`).
- **Cliente Prueba (id 5):** 5.
- Cada fila trae `creado_por_id` y `creado_por_nombre` como indicaron.

Adaptamos el front: el aviso por rol ya está, el filtro de seguridad usa `creado_por_id` (y ya no dependemos del viejo `bodeguero_id`), y dejamos una prueba con el escenario real de los 5/3/5. También confirmamos que el `404` de una factura ajena cierra el detalle y muestra el error, sin pantalla rota.

No hicieron falta backfills ni cambios de parámetros. Todo en verde: 45 archivos / 240 pruebas y build correcto. Gracias 🚀

---

## Pedido (20-11-2026) — módulo nuevo de Estadísticas por usuario autenticado

Hola equipo 👋 Queremos agregar un módulo **Estadísticas** donde **cada usuario vea sus propias cifras**. La decisión del líder fue **módulo nuevo** (ruta `/estadisticas`, menú y permiso propios), no meterlo dentro de Facturas ni del Inicio.

### 1. Permiso nuevo (catálogo fijo)

Agregar a la tabla `permisos` un permiso con nombre **`estadisticas_view`** (módulo `estadisticas`, acción `view`) y poder asignarlo **por usuario** con los endpoints que ya existen (`POST/DELETE /usuarios/{id}/permisos/{permiso_id}`). El admin lo tiene por defecto; a bodeguero y cliente se lo damos usuario por usuario. El menú y la ruta del front se leen de los permisos reales de la sesión, no de un rol fijo.

> Como hicimos con los otros 29, no necesitamos un id concreto: resolvemos el id por `nombre` desde `GET /permisos`.

### 2. Endpoint único

```http
GET /estadisticas/resumen?desde=2026-11-01&hasta=2026-11-30
```

- `desde` y `hasta` son **opcionales** (`YYYY-MM-DD`). Si no vienen, usamos el mes actual.
- Solo admin, bodeguero y cliente con `estadisticas_view`. Sin permiso → `403`. Sin token → `401` (el front ya lo maneja).
- Preferimos **un solo endpoint** y no tres (`/admin`, `/bodeguero`, `/cliente`) para no mantener tres contratos.

### 3. Respuesta propuesta

```json
{
  "periodo": { "desde": "2026-11-01", "hasta": "2026-11-30" },
  "generado_para": "bodeguero",
  "tarjetas": [
    { "clave": "facturas", "etiqueta": "Facturas", "valor": 24, "sufijo": "" },
    { "clave": "facturado", "etiqueta": "Facturado", "valor": 8450000, "sufijo": "$" },
    { "clave": "pendientes", "etiqueta": "Pendientes de firma", "valor": 3, "sufijo": "" }
  ],
  "series": [
    {
      "clave": "por_estado",
      "titulo": "Facturas por estado",
      "tipo": "barras",
      "datos": [
        { "etiqueta": "Emitida", "valor": 4 },
        { "etiqueta": "Entregada", "valor": 6 }
      ]
    }
  ]
}
```

`generado_para` es solo informativo: el front **no decide** qué mostrar según ese campo, pinta lo que llegue.

### 4. Regla de datos por usuario autenticado (esto es lo importante)

El filtro debe hacerse **en el backend**, igual que ya hacemos con `GET /facturas`. **El front nunca envía un `usuario_id`, `cliente_id` ni `bodega_id`: el usuario se toma del token.** Así nadie puede pedir las cifras de otro.

| Usuario autenticado | Datos que puede contar |
|---|---|
| admin | Todas las facturas, todas las bodegas, top de productos y usuarios activos |
| bodeguero | Solo las facturas que **ese usuario** creó (`creado_por_id`) y/o de sus bodegas, y los tipos de esas bodegas |
| cliente | Solo las facturas de **ese usuario** (`creado_por_id`), sin series de bodegas ni de otros usuarios |

Dos bodegueros (o dos clientes) con el mismo rol deben recibir cifras distintas si sus facturas son distintas. Nunca devolver una serie que ese usuario no puede ver: es mejor omitirla que mandarla y ocultarla en el front.

### 5. De nuestro lado (front)

Preparamos `api/estadisticas.js`, `useEstadisticas.js`, la vista, el permiso en el menú y la ruta con su test. Mientras el endpoint no esté publicado, el panel funciona con mocks del modo demo; al publicarlo, solo cambia `VITE_USE_MOCKS=false` y lo verificamos en vivo con las tres cuentas de prueba. No tocamos CORS ni el proxy `/api`.

Si prefieren otro nombre de permiso, otra forma de respuesta o un rango distinto, avisen y lo adaptamos antes de cerrar el contrato. Gracias 🚀
