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
| `PUT /roles/{id}/permisos` (estable según el aviso v2) | pantalla de Permisos del admin: elige usuario/rol, marca permisos y guarda la lista completa |

### Asignación de permisos (verificado en `/openapi.json`)

- El backend **no tiene un endpoint de permisos por usuario**. Los permisos se guardan en el **rol** y, por eso, en todos los usuarios que lo tienen.
- `PUT /roles/{rol_id}/permisos` con `{ "permisos_ids": [1, 2] }` **reemplaza** los permisos actuales. `[]` se los quita todos. Responde el rol actualizado con `permisos: [{id, nombre}]`.
- `rolesApi.setPermisos(rolId, ids)` llama a ese endpoint (o usa un equivalente en mocks).
- La vista `PermisosView` carga `GET /roles`, `GET /permisos` y `GET /usuarios`; muestra quién se afecta porque `UsuarioOut` trae `rol_id` y `rol`.
- En vivo: hay 1 permiso (`comra`) y los 3 roles tienen `permisos: []`. El test no modifica datos reales: solo comprueba la URL y el cuerpo de la petición con axios simulado.

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
- Test 36: asignación de permisos por rol (`PUT /roles/{id}/permisos`) y pantalla del admin.
- 36 archivos de test / 177 aserciones en verde.
- `npm run build` correcto.
- API en vivo: `/facturas/clientes` → 200 para admin/bodeguero y 403 para cliente; `/bodegas?bodeguero_id=` existe; el bodeguero ve `data: []` porque aún no tiene bodegas asignadas.
