# Preguntas para el líder — estado actual

> Equipo: frontend (Vue) + backend (FastAPI). Entrega: lunes 23-11-2026.
> **Actualizado:** 18-11-2026 — ya no hay preguntas bloqueantes. El líder respondió todo en `CONTRATO_FACTURAS.MD` y en su mensaje posterior.

---

## ✅ Todas las decisiones recibidas

| Tema | Respuesta definitiva |
|---|---|
| Roles | `admin`, `bodeguero`, `cliente`. Matriz completa en `CONTRATO_FACTURAS.MD`. |
| Menú | Solo **Facturas**. Se quitó "Órdenes" porque la orden es la factura. |
| Bodeguero en Tipos/Bodegas | Solo ver (`GET` permitido); el backend devolverá `403` en `POST`/`PUT`/`DELETE`. |
| Bodeguero en Usuarios | Solo ver clientes: `GET /usuarios?rol=cliente` (el backend fuerza el filtro). |
| Bodegas — "quién recibe" | 8 campos: `nombre`, `direccion`, `ciudad`, `telefono` y 4 `responsable_*`. Solo `nombre` obligatorio. |
| Usuario cliente | `tipo_documento` (CC/NIT/CE), `numero_documento`, `telefono`, `direccion` en el mismo `POST`/`PUT`; `rol_id` numérico. |
| Listados y `q` | `{ data, total, page, limit }`. `q` busca por número y nombre del cliente. `estado` un solo valor. |
| Firma | Data URL PNG completa, base64 válido, máx. 500 KB. Campo `firma`, se devuelve en `trazabilidad.firma`. |
| Factura y PDF | Entidad única `/facturas`. PDF con `blob` y `Content-Disposition`. Totales los calcula el backend. |
| Líneas del formulario | `GET /tipos?limit=100`, descripción precargada y editable, cantidades y validaciones confirmadas. |
| Diseño | Sin Figma por ahora: se armó un diseño limpio propio con CSS. |

---

## Mensaje que se envió al líder (respondido)

> Confirmado todo: menú solo con Facturas, bodeguero con permisos de solo lectura en Tipos/Bodegas y solo clientes en Usuarios, filtros del listado, transiciones de estado, firma con data URL PNG de 500 KB, PDF con blob, líneas del formulario y campos nuevos de Bodega y Usuario. Gracias.

---

## Notas para nuestro equipo

- Los permisos se cambian en **un solo lugar**: `src/config/permissions.js`.
- El menú se arma desde `src/config/navigation.js` con `visibleMenuFor(rol)`.
- El front oculta botones; el backend es quien bloquea con `403`.
- Los tests están en verde: `npm test` → **24 archivos, 128 aserciones** (fuerzan mocks en `vite.config.js`).
- `npm run build` compila correctamente.
