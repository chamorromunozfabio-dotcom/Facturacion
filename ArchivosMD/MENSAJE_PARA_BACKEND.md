# Mensaje para el backend — contrato v2 aplicado

> Listo para copiar y pegar. Fecha: 23-11-2026 (actualizado).
> Estado del frontend: **70 archivos de test / 390 pruebas en verde y build correcto.**

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

Todo en verde: **61 archivos / 324 pruebas** y build correcto (en ese momento eran 44 / 234). Si el catálogo de facturas debe mostrar también tipos inactivos en algún caso, avisen y lo ajustamos.

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

---

## Pedido (23-11-2026) — app móvil: CORS nativo y refresh token

Hola equipo 👋 Cerramos la Fase 1 de la app móvil (Ionic Vue + Capacitor): en Android el WebView carga el Vite de desarrollo, así que hoy el proxy `/api` evita cualquier problema de CORS. Para pasar a un build de producción necesitamos dos cosas del backend.

### 1. CORS para los orígenes nativos

Cuando el build deje de usar el Vite, las peticiones saldrán directo del WebView con estos orígenes:

| Plataforma | Origen |
|---|---|
| Android | `http://localhost` |
| iOS | `capacitor://localhost` |

Pedido: agregar esos dos orígenes a la configuración de CORS (además de `http://192.168.20.44:5173`, que ya funciona) para `GET`, `POST`, `PUT`, `DELETE` y `OPTIONS`, con `Authorization` y `Content-Type` en `Access-Control-Allow-Headers`. **No queremos cambiar el CORS que hoy usa el front web**: solo sumar los dos orígenes nuevos.

Si prefieren no abrir CORS, la alternativa es publicar un reverse proxy `/api` delante del backend: en ese caso el front sigue con `VITE_API_URL=/api` y este punto queda resuelto. Nos ajustamos a lo que les sea más cómodo.

### 2. Refresh token

Hoy `POST /login` devuelve un JWT que vence a los 60 minutos y no hay forma de renovarlo. En la app eso significa pedir login otra vez cada hora. Necesitamos:

1. Que `POST /login` devuelva también un `refresh_token` (o el nombre de campo que prefieran).
2. Un endpoint `POST /refresh` que reciba ese token y devuelva un `access_token` nuevo sin pedir contraseña.
3. Un vencimiento más largo para el refresh (por ejemplo 7 o 30 días, con rotación si es posible; si no, al menos 24 h).

De nuestro lado: hoy guardamos el `access_token` en `localStorage` bajo `token` y el usuario en `user`. En el celular vamos a migrar eso a `@capacitor/preferences` **sin cambiar el contrato**: seguimos enviando `Authorization: Bearer <access_token>` exactamente igual. Cuando una respuesta dé `401`, vamos a llamar a `/refresh` una vez y reintentar la petición original; si falla, cerramos sesión con el aviso actual (`No ha iniciado sesión`).

### 3. Lo que NO pedimos

- No queremos cambiar `POST /login` a `username`/`password` ni a form-data: sigue siendo `{ "correo": "...", "contrasena": "..." }`.
- No pedimos cambios en roles, permisos, facturas ni estadísticas.
- No hace falta que el backend detecte la plataforma: alcanza con el origen/User-Agent.

Cuando nos confirmen qué opción de CORS eligen y el contrato del refresh, lo verificamos en el emulador y cerramos la preparación para producción. Gracias 🚀

### Respuesta recibida (23-11-2026) — `cambios-backend-movil.md` ✅ adoptada

Gracias, quedó confirmado:

- **CORS nativo:** `http://localhost` (Android) y `capacitor://localhost` (iOS) sumados al listado existente, con `GET`/`POST`/`PUT`/`DELETE`/`OPTIONS` y headers `Authorization`/`Content-Type`. El CORS del front web (`http://localhost:5173`) sigue igual.
- **Refresh token:** `/login` devuelve `refresh_token`; `POST /refresh` recibe `{ "refresh_token": "..." }` y responde `access_token` + `refresh_token` nuevos con rotación. Vencimientos: 60 min para el access y 7 días para el refresh (`REFRESH_TOKEN_EXPIRE_DAYS=7`).
- **401 del refresh** → `{"detail":"Refresh token inválido o vencido"}`. El front cierra sesión con el aviso actual.

De nuestro lado quedó integrado: guardamos siempre el último refresh recibido, ante un 401 hacemos **una sola** renovación compartida entre peticiones concurrentes, reintentamos la petición original una vez y, si el refresh falla, limpiamos la sesión y mostramos `Tu sesión venció…`. Seguimos enviando `Authorization: Bearer <access_token>` y el body de `/login` con `correo`/`contrasena`, sin cambios. ✅

---

## Pedido (24-11-2026) — rol `empresa`, registro público y multiempresa

Hola equipo 👋 Ya implementamos en el frontend la base del rol **`empresa`**, el **registro público** y el módulo **Empresas** para el admin. Para cerrar la parte de catálogos y facturas necesitamos que confirmen estos contratos. Mientras responden, el front sigue funcionando con mocks y con los endpoints actuales; no rompimos web ni móvil.

### 1. Registro público — `POST /register`

Hoy el front envía un único endpoint con un discriminador `tipo`:

**Cliente**
```json
{
  "tipo": "cliente",
  "nombre": "Juan Pérez",
  "tipo_documento": "CC",
  "numero_documento": "1020304050",
  "telefono": "3001234567",
  "correo": "juan@cliente.com",
  "contrasena": "Cliente123*"
}
```

**Empresa**
```json
{
  "tipo": "empresa",
  "razon_social": "Distribuidora Andina S.A.S.",
  "nit": "900123456-1",
  "telefono": "3001234567",
  "direccion": "Calle 10 # 20-30",
  "representante": "Ana Torres",
  "correo": "empresa@entrega.com",
  "contrasena": "Empresa123*"
}
```

Necesitamos confirmar:

1. ¿Les sirve `POST /register` con `tipo`, o prefieren `POST /register/cliente` y `POST /register/empresa`? Si prefieren dos endpoints, los adaptamos.
2. ¿El cliente queda **activo** y puede iniciar sesión de inmediato? ¿La empresa queda **pendiente** y `POST /login` debe devolver `403` con un `detail` claro hasta que un admin la active?
3. Respuesta esperada (propuesta): `201` con `{ message, user }` para cliente y `{ message, estado: "pendiente", empresa }` para empresa. ¿Nos confirman la forma exacta?
4. Errores: ¿`409` o `400` para correo/NIT repetido? ¿`422` con `detail` tipo FastAPI (`loc`/`msg`) o con `{ errores: { campo: mensaje } }`? El front ya acepta ambos.
5. ¿El registro de empresa crea también el usuario administrador de esa empresa, o queda pendiente hasta que el admin la apruebe? Si lo crea, ¿qué rol y qué permisos recibe?
6. ¿Se puede registrar una empresa con un correo que ya existe como cliente? ¿Y al revés?

### 2. Módulo Empresas — admin

El front ya consume:

- `GET /empresas?q=&page=1&limit=10&estado=pendiente`
- `PATCH /empresas/{id}/estado` con `{ "estado": "activa" }`, `{ "estado": "rechazada", "motivo_rechazo": "..." }`, `{ "estado": "suspendida" }` o `{ "estado": "activa" }` para reactivar.

Confirmar:

1. Forma de `GET /empresas`: ¿`{ data, total, page, limit }` como los demás listados? ¿Qué campos trae cada empresa (`id`, `razon_social`, `nit`, `correo`, `telefono`, `direccion`, `representante`, `estado`, `motivo_rechazo`, `fecha_registro`, totales)?
2. ¿Los estados exactos son `pendiente`, `activa`, `rechazada` y `suspendida`? ¿Reactivar una suspendida se hace con `PATCH .../estado { estado: "activa" }` o hay un endpoint aparte?
3. ¿El rechazo exige `motivo_rechazo` de mínimo 10 caracteres? ¿Qué código y mensaje devuelven si falta?
4. ¿Suspender una empresa bloquea el login de todos sus usuarios (`403`)? ¿Y qué pasa con sus bodegas y facturas?
5. ¿`GET /empresas` es solo admin? El front oculta la ruta y el menú a los demás roles, pero el backend debe devolver `403`.

### 3. Multiempresa — datos y filtros

Para la siguiente fase necesitamos saber cómo queda el modelo:

1. ¿`empresa_id` viaja en `/login` y `/me`? ¿Con qué forma? El front ya lee `user.empresa.id`, `user.empresa.razon_social` y, como respaldo, `user.empresa_id` / `user.empresa_nombre`.
2. En `GET /usuarios`, `GET /bodegas`, `GET /tipos` y `GET /facturas`, ¿el backend filtra automáticamente por la empresa del token? ¿Un usuario `empresa` ve solo los bodegueros, bodegas, tipos y facturas de su empresa?
3. ¿El admin puede filtrar por empresa con `?empresa_id=`? ¿O el front debe cargar `GET /empresas?estado=activa` y enviar `empresa_id` al crear?
4. Al crear un usuario `bodeguero` o una bodega como admin, ¿el body debe incluir `empresa_id`? ¿Es obligatorio? ¿Qué pasa si falta?
5. ¿Un usuario `empresa` puede crear bodegueros? ¿El backend asigna su `empresa_id` por token aunque el front no lo envíe?
6. ¿El rol `empresa` ya existe en `GET /roles`? El front lo resuelve por nombre y usa `4` solo como respaldo; no lo damos por fijo.

### 4. Búsqueda de clientes para facturar

La especificación pide `GET /clientes/buscar?q=...` (mínimo 5 caracteres) para reemplazar el listado abierto. Hoy el front usa `GET /facturas/clientes` (hasta 100). Confirmar:

1. ¿Publican `GET /clientes/buscar?q=`? ¿Qué devuelve: `{ data, total, page, limit }`? ¿Busca por nombre, documento y correo?
2. ¿Está disponible para admin, bodeguero y empresa? ¿O solo para quien puede crear facturas?
3. Si no lo van a publicar, seguimos usando `/facturas/clientes` con búsqueda local; avísenos para no duplicar.

### 5. Facturas: dos diferencias con el contrato actual

1. La especificación usa `factura.numero_factura` (ej. `FAC-0001`), pero el backend y el front hoy usan `numero`. ¿Agregan `numero_factura` como alias, lo renombramos o mantenemos `numero`?
2. El rechazo del cliente hoy envía `{ motivo }`; la especificación pide `{ motivo_rechazo }` con mínimo 10 caracteres. ¿Migramos a `motivo_rechazo` o mantenemos `motivo` por compatibilidad?
3. ¿La edición y eliminación de facturas deben bloquearse cuando `estado !== 'emitida'`? Hoy el front muestra los botones según permisos; si el backend ya lo bloquea, ajustamos la UI.

### 6. Permisos del rol `empresa`

El front ya aplica estas reglas duras, aunque el backend mande otra cosa:

- `empresa` nunca puede `facturas:aceptar` ni `facturas:rechazar`.
- `empresa` nunca puede `empresas:view`.
- `empresa` puede `tipos`, `bodegas`, `usuarios`, `facturas` y `estadisticas` según sus permisos reales.

Confirmar que el backend también lo bloquea con `403`, y si van a crear los permisos `empresa_*` o si reutilizan los existentes por usuario.

### Lo que ya está hecho del lado del front

- Rol `empresa` en la matriz de respaldo, navegación, color propio y mensajes de Inicio/Estadísticas.
- Registro público `/register` con selector Cliente/Empresa, validaciones en vivo, bloqueo de teclas no numéricas y confirmación de empresa pendiente.
- Módulo `/empresas` solo admin: listado paginado, filtro por estado, búsqueda con debounce, aprobar, rechazar con motivo mínimo de 10 y suspender/reactivar.
- Mocks de `POST /register`, `GET /empresas`, `PATCH /empresas/{id}/estado`, `GET /clientes/buscar`, cuenta demo `empresa@entrega.com / Empresa123*` y estadísticas de empresa.
- `UsuariosView`: la empresa solo ve y crea bodegueros de su equipo; el rol queda fijo y no se muestra el selector.
- El login ya muestra el `detail` del `403` (empresa pendiente, rechazada o suspendida).

Cuando nos confirmen estos puntos, activamos la fase de catálogos/facturas con datos reales. Si algo del contrato propuesto no les sirve, mándenlo como lo necesitan y lo adaptamos. ¡Gracias! 🚀


---

### Respuesta recibida (24-11-2026) — multiempresa, búsqueda de clientes y solo números ✅ adaptado

Gracias por `RESPUESTA_EMPRESAS.md` y `RESPUESTA_SOLO_NUMEROS.md`. Ya aplicamos todos los ajustes en el frontend (seguimos trabajando contra mocks mientras publican los endpoints):

1. **Multiempresa:**
   - El admin ya filtra por `?empresa_id=` (cargado desde `GET /empresas?estado=activa`) en Usuarios, Bodegas, Tipos, Facturas y Estadísticas, y envía `empresa_id` numérico obligatorio al crear bodegueros, usuarios `empresa` o bodegas.
   - Leemos `user.empresa` (`{ id, razon_social, estado }`) en `/login` y `/me`.
   - El rol `empresa` se resuelve siempre por nombre desde `GET /roles` (quitamos el respaldo `4`).
2. **Búsqueda de clientes:** `FacturaForm` ya consulta `GET /clientes/buscar?q=` (mínimo 5 caracteres, debounce 300 ms). Ya pueden retirar `/facturas/clientes` cuando publiquen `/clientes/buscar`.
3. **Facturas:**
   - Mantenemos `numero` (`FE-0001`) y usamos siempre `id` en claves y rutas (soportando numeración repetida entre empresas).
   - Mostramos `empresa_nombre` en listado y detalle al `admin` y al `cliente`.
   - Migramos el rechazo a `{ motivo_rechazo }` (10 a 255 caracteres), ocultamos **Editar** y **Eliminar** cuando `estado !== 'emitida'` y mostramos `motivo_rechazo` en el detalle.
4. **Solo números (teclado y pegado):** aplicado en Bodegas (`telefono`, `recibe_documento`, `recibe_telefono`), Usuarios (`telefono` y `numero_documento`, salvo `PA`) y Facturas (`cantidad`, `precio_unitario`, `descuento_porcentaje`), enviando los valores numéricos como número.
5. **Permisos por usuario:** `PermisosView` ya busca y muestra `empresa_nombre` y aplica la plantilla del rol `empresa` (sin `facturas_aceptar`, `facturas_rechazar`, `empresas_*` ni `roles_*`).

Estado actual del frontend: **71 archivos de test / 394 pruebas en verde y `vite build` correcto.** En cuanto nos avisen que `/register`, `/empresas` y `/clientes/buscar` están arriba, probamos contra el servidor real. 🚀
