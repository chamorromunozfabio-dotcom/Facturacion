# Integración con el backend — estado final (contrato v2)

Fecha: 18-11-2026. El backend publicó `ArchivosMD/CAMBIOS_PARA_FRONTENDv2.md` y el frontend ya aplicó todos sus cambios. La verificación en vivo confirmó los endpoints y permisos.

> `ArchivosMD/CONTRATO_FACTURASv2.md` trae valores viejos (`creada`, `aceptada`, `cerrada`, `FAC-000001`, `responsable_nombre`); **no es la referencia válida**. Manda `CAMBIOS_PARA_FRONTENDv2.md` + `CAMBIOS_PARA_FRONTEND.md`.

## Configuración actual

```env
VITE_API_URL=/api
VITE_BACKEND_URL=http://192.168.20.49:8000
VITE_USE_MOCKS=false
VITE_FACTURAS_MOCKS=false
```

Todo el frontend llama a la API real. El proxy `/api` de Vite sigue evitando el CORS; no se tocó el backend.

## Cambios v2 ya aplicados

| Aviso del backend (v2) | Cambio en el frontend |
|---|---|
| Bodegas con dueño `bodeguero_id` / `bodeguero_nombre` | columna “Bodeguero” para el admin y selector en el formulario |
| Bodeguero: CRUD solo de sus bodegas | `bodegas: view/create/edit/delete` en su matriz; el backend filtra el listado |
| Admin: asignar dueño | `GET /usuarios?rol=bodeguero` alimenta el selector; `bodeguero_id` se envía como número |
| Al crear bodega como bodeguero, el dueño es automático | el bodeguero no ve ni envía `bodeguero_id` |
| `/usuarios` es solo del admin | se quitó la clave `usuarios` del bodeguero, su menú y su ruta; `meta.roles: ['admin']` |
| Nuevo `GET /facturas/clientes` | `facturasApi.listClientes()` reemplaza a `/usuarios?rol=cliente` en el formulario de facturas |
| `DELETE /tipos` permitido al bodeguero | verificado en vivo: ya responde `404` (no `403`) con un id inexistente |
| Facturas desde las bodegas propias | el backend valida con `400`; el bodeguero solo ve sus bodegas en el selector |
| Permisos por usuario (`ArchivosMD/RESPUESTA_PERMISOS_FRONTEND.md`) | `PermisosView` elige usuario, carga sus permisos y guarda con `PUT /usuarios/{id}/permisos`; el rol quedó como plantilla |

### Asignación de permisos por usuario (verificado en vivo)

El backend aceptó el pedido y publicó:

| Método | Ruta | Uso en el front |
|---|---|---|
| GET | `/usuarios/{id}/permisos` | `usuariosApi.listPermisos(id)` → `{ data: [{id, nombre}] }` |
| PUT | `/usuarios/{id}/permisos` | `usuariosApi.setPermisos(id, ids)` → `{ permisos_ids }`, reemplaza, `[]` quita todos |
| POST | `/usuarios/{id}/permisos/{permiso_id}` | `usuariosApi.addPermiso(id, permisoId)` |
| DELETE | `/usuarios/{id}/permisos/{permiso_id}` | `usuariosApi.removePermiso(id, permisoId)` |

- `/usuarios`, `/usuarios/{id}`, `/me` y el `user` de `/login` traen `permisos: [{id, nombre}]`. El store los guarda en `auth.permisos` (no se usan aún para el menú: los guards siguen por rol y la matriz `permissions.js` sigue fija).
- Permisos efectivos = **solo los del usuario**; el rol es plantilla al crear y cambiarlo después no modifica usuarios existentes. `PUT /roles/{id}/permisos` sigue disponible como plantilla.
- En vivo: `/openapi.json` trae los 4 endpoints nuevos; `GET /usuarios/1/permisos` → `200 {data: []}`; `login` y `/me` traen `permisos: []`. Hay 1 permiso (`comra`) y los 3 roles con `permisos: []`. Las pruebas no cambiaron datos reales: simularon axios.

## Permisos finales

| Módulo | admin | bodeguero | cliente |
|---|---|---|---|
| Tipos | CRUD | CRUD | — |
| Bodegas | CRUD de todas + asignar dueño | CRUD solo de las suyas | — |
| Usuarios, Roles, Permisos | CRUD | 403 / sin menú ni ruta | 403 |
| Facturas | todo | crear desde sus bodegas, editar, borrar, entregar, recibir, PDF | ver las suyas, aceptar y rechazar |

Según el cuadro de `CAMBIOS_PARA_FRONTENDv2.md`, el bodeguero **ve todas** las facturas; el parámetro `bodega_id` que el front envía cuando `/me` lo trae es un refuerzo opcional que hoy se ignora.

## Credenciales reales (verificadas en vivo)

| Rol | Correo | Contraseña |
|---|---|---|
| admin | `admin@entrega.com` | `Admin123*` |
| bodeguero | `bodeguero@gmail.com` | `Bodega123*` |
| cliente | `cliente@gmail.com` | `Cliente123*` |

> El documento v2 muestra cuentas `@entrega.com`, pero advierte que la BD fue cambiada desde la app. Las de arriba son las que responden `200` hoy. En mocks se siguen usando `luis@entrega.com` y `juan@cliente.com`.

## Verificación

- Test 33: contrato definitivo (estados, `FE-0001`, campos `recibe_*`).
- Test 34: permisos del bodeguero en Tipos y parámetro `bodega_id`.
- Test 35: contrato v2 (bodegas propias, sin Usuarios, selector `/facturas/clientes`).
- Test 36: permisos por usuario (`GET/PUT /usuarios/{id}/permisos`, POST/DELETE) y pantalla del admin.
- 36 archivos de test / 178 aserciones en verde.
- `npm run build` correcto.
- API en vivo: `/facturas/clientes` → 200 para admin/bodeguero y 403 para cliente; `/bodegas?bodeguero_id=` existe; el bodeguero ve `data: []` porque aún no tiene bodegas asignadas.
