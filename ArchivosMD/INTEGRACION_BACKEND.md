# Integración con el backend — estado final

Fecha: 18-11-2026. El backend publicó `ArchivosMD/CAMBIOS_PARA_FRONTEND.md` con los últimos cambios y el frontend ya los aplicó. **No quedan pendientes de contrato.**

## Configuración actual

```env
VITE_API_URL=/api
VITE_BACKEND_URL=http://192.168.20.49:8000
VITE_USE_MOCKS=false
VITE_FACTURAS_MOCKS=false
```

Todo el frontend llama a la API real. El proxy `/api` de Vite sigue evitando el CORS; no se tocó el backend.

## Cambios del último aviso del backend, ya aplicados

| Aviso del backend | Cambio en el frontend |
|---|---|
| `/facturas` publicado | `VITE_FACTURAS_MOCKS=false`; Facturas usa la API real |
| `creada → emitida` | `ESTADOS`, filtros, botones y `StatusBadge` |
| `aceptada → firmada` | `PATCHES`, `patchRow`, badge y textos |
| `cerrada → recibida` | `PATCHES`, `patchRow`, badge y mensaje “Factura recibida.” |
| `FAC-000001 → FE-0001` | mocks, tests y nombres de PDF |
| `responsable_* → recibe_*` | `BodegasView`, `FacturaDetail`, mocks y tests |
| `responsable_correo → correo` | campo “Correo de la bodega” |
| Nuevos `codigo`, `departamento`, `recibe_cargo` | agregados al formulario de Bodegas |
| Campos de cliente opcionales + `PA` + `ciudad` | `UsuariosView` y tests |
| Permisos del bodeguero corregidos | el front ya ocultaba los botones; ahora el backend también bloquea |
| 422 en español, incluso `page`/`limit` | documentado y cubierto por `getErrorMessage()` |
| Borrados protegidos con 400 | el front muestra el motivo con `getErrorMessage()` |

## Credenciales reales

| Rol | Correo | Contraseña |
|---|---|---|
| admin | `admin@entrega.com` | `Admin123*` |
| bodeguero | `bodeguero@entrega.com` | `Bodega123*` |
| cliente | `cliente@entrega.com` | `Cliente123*` |

> En mocks se sigue usando `luis@entrega.com` y `juan@cliente.com` como datos demo; no son cuentas reales.

## Verificación

- Test 33 (`test/contrato-definitivo.test.js`) cubre estados, número `FE-0001`, campos `recibe_*` y datos opcionales de cliente.
- 33 archivos de test / 162 aserciones en verde.
- `npm run build` correcto.
