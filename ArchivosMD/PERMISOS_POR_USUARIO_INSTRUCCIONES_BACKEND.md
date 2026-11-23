# Permisos por usuario — instrucciones para el backend

**Fecha:** 19-11-2026
**Estado del frontend:** terminado y subido (`commit f5d9335`). 40 archivos de test / 201 pruebas en verde y `npm run build` correcto.
**Objetivo:** que el administrador pueda dar o quitar una funcionalidad a **una persona** sin afectar a los demás usuarios que tienen el mismo rol.

> **Respuesta recibida el 19-11-2026:** ver `RESPUESTA_PERMISOS_POR_USUARIO.md`. El backend confirmó los 9 puntos del checklist y el front ya quedó alineado (menú, botones y rutas con permisos reales). Este documento se conserva como contrato de referencia.
>
> **Actualización 20-11-2026:** el catálogo quedó en **30 permisos** (los 29 de este documento más `estadisticas_view`, ya publicado). La cifra de tests de la fecha es histórica; hoy son 59 archivos / 316 pruebas.
>
> Para el estado vigente complete, prevalece `indicaciones/info-proyecto.md`. Dentro de este cambio, este documento sigue siendo la referencia.

---

## 1. Resumen en 30 segundos

El front ya no crea permisos. Muestra un desplegable fijo de **módulo + acción** y, al elegir una función, llama a:

- `POST /usuarios/{id}/permisos/{permiso_id}` → **dar** permiso.
- `DELETE /usuarios/{id}/permisos/{permiso_id}` → **quitar** permiso.
- `GET /usuarios/{id}/permisos` → **consultar** los que ya tiene.

Para que eso funcione de verdad faltan **tres cosas del backend**:

1. Publicar los **29 permisos** del catálogo (hoy solo existe 1).
2. Hacer que los **guards de los endpoints usen los permisos del usuario**, no solo el rol.
3. Confirmar qué se hace con la **plantilla del rol al crear usuarios** y cómo se refresca el token.

---

## 2. Lo que YA existe y no hay que cambiar

Verificado en `http://192.168.20.49:8000/openapi.json`:

| Endpoint | Estado |
|---|---|
| `GET /permisos` (admin, paginado) | Existe. Sin cambios. |
| `GET /usuarios/{id}/permisos` | Existe. Devuelve `{ "data": [{id, nombre}] }`. |
| `PUT /usuarios/{id}/permisos` | Existe. Cuerpo `{ "permisos_ids": [...] }`. Se deja por compatibilidad. |
| `POST /usuarios/{id}/permisos/{permiso_id}` | Existe. |
| `DELETE /usuarios/{id}/permisos/{permiso_id}` | Existe. |
| `GET /me`, `POST /login`, `GET /usuarios` | Ya traen `permisos: [{id, nombre}]`. |
| `PUT /roles/{id}/permisos` | Se deja como **plantilla/legacy**. No lo usa la pantalla nueva. |
| CORS y proxy `/api` | No se tocan. |

---

## 3. Tarea 1 — Sembrar el catálogo de 29 permisos

El front **no envía nombres** al guardar: resuelve el `id` leyendo `GET /permisos` y buscando por `nombre`. Por eso el `nombre` debe ser **exactamente** este (minúsculas, guion bajo, sin espacios).

El **id puede ser cualquiera**; el front lo descubre automáticamente. Todos deben quedar con `estado: true`.

### Facturación (9)

| `nombre` | Funcionalidad |
|---|---|
| `facturas_view` | Ver facturas |
| `facturas_create` | Crear facturas |
| `facturas_edit` | Editar facturas |
| `facturas_delete` | Eliminar facturas |
| `facturas_entregar` | Marcar como entregada |
| `facturas_recibir` | Registrar recepción / firmar |
| `facturas_aceptar` | Aceptar factura (cliente) |
| `facturas_rechazar` | Rechazar factura (cliente) |
| `facturas_pdf` | Descargar PDF |

### Bodegas (4)

| `nombre` | Funcionalidad |
|---|---|
| `bodegas_view` | Ver bodegas |
| `bodegas_create` | Crear bodegas |
| `bodegas_edit` | Editar bodegas |
| `bodegas_delete` | Eliminar bodegas |

### Usuarios (4)

| `nombre` | Funcionalidad |
|---|---|
| `usuarios_view` | Ver usuarios |
| `usuarios_create` | Crear usuarios |
| `usuarios_edit` | Editar usuarios |
| `usuarios_delete` | Eliminar usuarios |

### Tipos / productos (4)

| `nombre` | Funcionalidad |
|---|---|
| `tipos_view` | Ver tipos |
| `tipos_create` | Crear tipos |
| `tipos_edit` | Editar tipos |
| `tipos_delete` | Eliminar tipos |

### Roles (4)

| `nombre` | Funcionalidad |
|---|---|
| `roles_view` | Ver roles |
| `roles_create` | Crear roles |
| `roles_edit` | Editar roles |
| `roles_delete` | Eliminar roles |

### Permisos (4)

| `nombre` | Funcionalidad |
|---|---|
| `permisos_view` | Ver permisos |
| `permisos_create` | Crear permisos |
| `permisos_edit` | Editar permisos |
| `permisos_delete` | Eliminar permisos |

**Total: 29.** **Resuelto:** en vivo ya están los 29 y `usuarios_view` conserva el id 6.

### Alias heredado (importante)

**Resuelto:** `ususarios` se renombró a `usuarios_view` (id 6) y el front **ya quitó el alias**. Hoy solo se reconoce el nombre exacto `usuarios_view`.

### Cómo se verifica el paso 1

Con token de admin:

```http
GET /permisos?q=&page=1&limit=100
Authorization: Bearer <TOKEN>
```

Debe devolver `total: 29` y los 29 nombres anteriores en `data[].nombre`.

Mientras falte alguno, esa opción aparece **deshabilitada** en el desplegable con el aviso “pendiente en el backend”. Es un comportamiento intentado del front, no un error.

---

## 4. Tarea 2 — Los guards deben usar permisos del usuario

**Resuelto por el backend el 19-11-2026:** los guards ya usan los permisos del usuario y leen la base de datos en cada pedido, así que dar o quitar un permiso aplica **de inmediato**, sin renovar token. El `admin` tiene acceso total por diseño; la única excepción es aceptar/rechazar facturas ajenas, que sigue siendo solo del cliente de la factura.

### Regla que necesitamos

> **Los permisos efectivos de una sesión son exactamente los permisos guardados para ese usuario**, sin importar su rol.

Consecuencias concretas:

1. Si a un cliente se le da `facturas_create`, debe poder crear facturas aunque su rol `cliente` no lo permitiera antes.
2. Si a ese mismo cliente se le quita `facturas_view`, debe volver a recibir `403` en la consulta de facturas, aunque el rol `cliente` tenga ese permiso en su plantilla.
3. Dar o quitar un permiso a **Juan (cliente)** no debe cambiar nada para **María (cliente)**.
4. El campo `permisos` de `/login`, `/me` y `/usuarios` debe reflejar esos permisos efectivos.

### Preguntas — respondidas

- ¿Guards por rol o por permiso? **Por permiso** (con acceso total para el admin).
- ¿Token o base de datos? **Base de datos en cada pedido.** No hace falta refrescar el token.
- Excepción confirmada: aceptar/rechazar solo lo puede hacer **el cliente de la factura**; el admin recibe `403`. El front ya oculta esos botones para el admin.

---

## 5. Tarea 3 — Plantilla del rol y creación de usuarios

El front muestra como **referencia** cuántos permisos predefinidos tiene el rol, pero **no los aplica**: cuando el admin elige un usuario, ve solo los permisos que esa persona tiene guardados.

**Resuelto:** se eligió la **Opción A**. Al crear un usuario se copian los permisos actuales de su rol; después, cambiar el rol o su plantilla **no** modifica a usuarios ya creados. La plantilla confirmada es la de la tabla de abajo (27/15/4).

Si eligen la Opción A, hay que definir la plantilla inicial de cada rol. Sugerencia (es la misma que muestra el front como referencia):

| Rol | Permisos sugeridos |
|---|---|
| `admin` | Todos salvo `facturas_aceptar` y `facturas_rechazar` (27) |
| `bodeguero` | `tipos_*`, `bodegas_*` y `facturas_view/create/edit/delete/entregar/recibir/pdf` (15) |
| `cliente` | `facturas_view`, `facturas_aceptar`, `facturas_rechazar`, `facturas_pdf` (4) |

Si quieren otra plantilla, la mandan y el front actualiza solo el texto de referencia (no cambia el guardado).

---

## 6. Contratos exactos (tomados del OpenAPI en vivo)

Todos requieren `Authorization: Bearer <TOKEN>` y son **solo admin**.

### 6.1 Consultar permisos de un usuario

```http
GET /usuarios/{usuario_id}/permisos
```

**Respuesta 200**

```json
{
  "data": [
    { "id": 6, "nombre": "usuarios_view" },
    { "id": 12, "nombre": "facturas_view" }
  ]
}
```

Ordenados por `id`. Si no tiene: `{ "data": [] }`.

| Código | Cuándo |
|---|---|
| 200 | OK |
| 401 | Sin token o token inválido |
| 403 | No es admin |
| 404 | No existe el usuario |
| 422 | El id de la ruta no es número |

### 6.2 Dar un permiso

```http
POST /usuarios/{usuario_id}/permisos/{permiso_id}
```

Sin cuerpo.

**Respuesta 200:** el usuario completo con su lista nueva de `permisos` (`UsuarioOut`). Si ya tenía el permiso, no duplicar.

| Código | Cuándo |
|---|---|
| 200 | Permiso agregado |
| 401 / 403 | Sin sesión / no admin |
| 404 | No existe el usuario o el permiso |
| 422 | Algún id no es número |

### 6.3 Quitar un permiso

```http
DELETE /usuarios/{usuario_id}/permisos/{permiso_id}
```

Sin cuerpo.

**Respuesta 204 sin cuerpo** (confirmado en el OpenAPI). El front **no necesita** que devuelva el usuario; vuelve a llamar al `GET` después. Si el usuario no tenía ese permiso, puede devolver 204 igual.

| Código | Cuándo |
|---|---|
| 204 | Permiso quitado (sin body) |
| 401 / 403 | Sin sesión / no admin |
| 404 | No existe el usuario o el permiso |
| 422 | Algún id no es número |

> Ojo con este detalle: el `POST` devuelve 200 con cuerpo, el `DELETE` devuelve 204 sin cuerpo. No cambiar el `DELETE` para que devuelva 200; al front le da igual, pero queremos que el contrato siga siendo el publicado.

### 6.4 Reemplazar todos (se deja, no se usa en la pantalla)

```http
PUT /usuarios/{usuario_id}/permisos
Content-Type: application/json

{ "permisos_ids": [6, 12] }
```

- `permisos_ids` obligatorio.
- `[]` quita todos.
- Los ids repetidos se ignoran.
- Devuelve 200 con el usuario actualizado.
- Si algún id no existe → **400** y no cambia nada.

### 6.5 Formato de errores

Todos los errores: `{ "detail": "texto en español" }`. Solo los 422 agregan `"errores"` con claves por campo. No hace falta cambiarlo para este módulo.

---

## 7. Cómo funciona el front (para evitar malentendidos)

1. Al entrar a Permisos pide, en paralelo:
   - `GET /usuarios?page=1&limit=100`
   - `GET /permisos?q=&page=1&limit=100`
   - `GET /roles?page=1&limit=100`
2. Arma un mapa `nombre del permiso → id` con lo que vino de `/permisos`.
3. Al elegir un usuario, pide `GET /usuarios/{id}/permisos`.
4. El botón dice **Dar permiso** si no lo tiene y **Quitar permiso** si lo tiene.
5. Al dar → `POST`. Al quitar → `DELETE`. Después vuelve a consultar el `GET` para refrescar la lista.

**Lo que el front NO hace:**

- No llama a `POST`, `PUT` ni `DELETE /permisos`. No crea, edita ni borra permisos.
- No manda nombres al guardar: manda solo **ids**.
- No aplica la plantilla del rol automáticamente.
- No modifica `roles_permisos`.

Si el nombre de un permiso cambia, el front no lo encuentra en el mapa y la opción queda deshabilitada. Por eso importa respetar la lista del punto 3.

---

## 8. Verificación paso a paso (cuando esté listo)

Cuentas reales:

| Rol | Correo | Contraseña |
|---|---|---|
| admin | `admin@entrega.com` | `Admin123*` |
| bodeguero | `bodeguero@gmail.com` | `Bodega123*` |
| cliente (Juan) | `cliente@gmail.com` | `Cliente123*` |

1. Entrar como **admin** → menú **Permisos**.
2. Elegir a **Juan (cliente)**. Verificar que la lista muestre solo sus permisos actuales.
3. Elegir **Facturación — Crear** y apretar **Dar permiso**.
4. Verificar con `GET /usuarios/5/permisos` que aparece `facturas_create`.
5. Entrar como **Juan** y verificar que `/me` trae ese permiso y que el endpoint correspondiente ya no responde `403`.
6. Volver como admin, elegir a **otro cliente** y verificar que **no** recibió `facturas_create`.
7. Quitarle el permiso a Juan desde el botón **Quitar permiso** o desde **Quitar** en su lista. Verificar que el endpoint vuelve a `403`.
8. Repetir con el bodeguero para confirmar que sus cambios no afectan a admin ni a clientes.

**Verificado por el backend:** estos 8 pasos ya dieron el resultado esperado (`RESPUESTA_PERMISOS_POR_USUARIO.md`, sección “Resultado de la prueba”).

---

## 9. Checklist para la respuesta del backend

Por favor confirmar uno por uno:

- [x] Los 29 permisos están sembrados con los `nombre` exactos y `estado: true`.
- [x] `GET /permisos?page=1&limit=100` devuelve `total: 29`.
- [x] `POST /usuarios/{id}/permisos/{permiso_id}` agrega sin duplicar y devuelve 200 con el usuario.
- [x] `DELETE /usuarios/{id}/permisos/{permiso_id}` devuelve 204 sin cuerpo.
- [x] Los guards usan los permisos del usuario (o avisan que siguen siendo por rol).
- [x] Los guards leen la base en cada pedido (o indican cómo refrescar el token).
- [x] Opción elegida para nuevos usuarios: **A (copiar plantilla del rol)** o **B (empezar vacío)**.
- [x] Si eligieren A, plantilla confirmada para `admin`, `bodeguero` y `cliente`.
- [x] `ususarios` se conserva / se renombra a `usuarios_view` / se borra (tachar lo que no corresponda).

---

## 10. Contacto

Si algo de acá no coincide con lo que tienen en la BD o en el OpenAPI, mandar:

1. El endpoint y método.
2. El `curl` o la petición que usaron.
3. La respuesta real (JSON completo).

Con eso ajustamos el front sin tocar CORS ni el proxy `/api`.
