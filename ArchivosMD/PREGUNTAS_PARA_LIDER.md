# Preguntas para el líder — estado actual

> Equipo: frontend (Vue) + backend (FastAPI). Entrega: lunes 23-11-2026.
> **Actualizado:** 20-11-2026 — ya no hay preguntas bloqueantes. Las decisiones iniciales se confirmaron en `CONTRATO_FACTURAS.md` y se ajustaron con las respuestas posteriores del backend. Fuente confiable: `indicaciones/info-proyecto.md`.

---

## ✅ Todas las decisiones recibidas

| Tema | Respuesta definitiva |
|---|---|
| Roles | `admin`, `bodeguero`, `cliente`. Matriz vigente en `indicaciones/info-proyecto.md`. |
| Menú | Inicio, Tipos, Bodegas, Usuarios, Permisos, Roles, Facturas y **Estadísticas** (según permisos). Se quitó "Órdenes" porque la orden es la factura. |
| Bodeguero en Tipos/Bodegas | CRUD de los suyos; el backend filtra por dueño (`creado_por_id` / bodega propia). |
| Bodeguero en Usuarios | No tiene menú ni ruta: `/usuarios` responde `403`. |
| Bodegas — "quién recibe" | `nombre` obligatorio, más `codigo`, `departamento`, `correo` y campos `recibe_*`. Los antiguos `responsable_*` ya no se usan. |
| Usuario cliente | `tipo_documento` (CC/NIT/CE/PA), `numero_documento`, `telefono`, `direccion` y `ciudad` en el mismo `POST`/`PUT`; `rol_id` numérico. |
| Listados y `q` | `{ data, total, page, limit }`. `q` busca por número y nombre del cliente. `estado` un solo valor. |
| Firma | Data URL PNG completa, base64 válido, máx. 500 KB. Campo `firma`, se devuelve en `trazabilidad.firma`. |
| Factura y PDF | Entidad única `/facturas`, estados `emitida → entregada → firmada → recibida` (o `rechazada`). PDF `FE-0001.pdf` con `blob` y `Content-Disposition`. Totales los calcula el backend. |
| Líneas del formulario | `GET /tipos?estado=true`, descripción precargada y editable, cantidades y validaciones confirmadas. |
| Estadísticas | `GET /estadisticas/resumen?desde=&hasta=`, permiso `estadisticas_view`. Admin global, bodeguero solo lo que creó, cliente lo suyo sin `emitida`. |
| Diseño | Sin Figma por ahora: diseño limpio propio con CSS, iconos Lucide y animaciones CSS puras. |

---

## Mensaje que se envió al líder (respondido)

> Confirmado el contrato inicial y aplicadas las correcciones posteriores: sin Órdenes, bodeguero con CRUD en sus Tipos/Bodegas, permisos por usuario, estados vigentes de Facturas, firma de 500 KB, PDF por blob y módulo de Estadísticas. Gracias.

---

## Notas para nuestro equipo

- El catálogo fijo de permisos está en `src/config/permissions.js` (30, incluido `estadisticas_view`); no se crean permisos desde la UI.
- El menú se arma desde `src/config/navigation.js` con `visibleMenuFor(rol, permisos)`.
- El menú, los botones y las rutas leen `auth.permisos`; la matriz por rol es solo respaldo. El backend revalida y bloquea con `403`.
- Los tests están en verde: `npm test` → **59 archivos, 316 pruebas** (fuerzan mocks en `vite.config.js`).
- `npm run build` compila correctamente.
