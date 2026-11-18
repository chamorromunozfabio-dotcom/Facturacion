# Mensaje para el backend — cambios recibidos, aplicados y nuevos detalles

> Listo para copiar y pegar. Fecha: 18-11-2026 (actualizado).
> Estado del frontend: **34 archivos de test / 166 aserciones en verde y build correcto.**

---

> Hola, gracias por `CAMBIOS_PARA_FRONTEND.md`. Ya revisé todo y apliqué los cambios en el frontend. Te confirmo qué queda de cada lado y te paso tres detalles nuevos que salieron de la revisión de permisos.

## ✅ Lo que ya ajusté yo

1. **Facturas con API real.** Puse `VITE_FACTURAS_MOCKS=false`. El módulo ya no usa datos falsos.
2. **Estados definitivos.** Reemplacé `creada → emitida`, `aceptada → firmada` y `cerrada → recibida` en filtros, botones y colores del badge. `entregada` y `rechazada` quedan igual.
3. **Número de factura.** Ahora uso `FE-0001` y el PDF se descarga como `FE-0001.pdf`.
4. **Bodegas.** Cambié `responsable_nombre/documento/telefono` por `recibe_nombre/recibe_documento/recibe_telefono`, usé `correo` para la bodega y agregué `codigo`, `departamento` y `recibe_cargo`.
5. **Usuarios.** Los datos de cliente (`tipo_documento`, `numero_documento`, `telefono`, `direccion`, `ciudad`) ahora son opcionales para todos los roles; agregué `PA` a los tipos de documento.
6. **Permisos del bodeguero (nuevo).** Siguiendo la lógica de negocio, los **Tipos son los productos de su bodega**: habilité Crear/Editar/Eliminar para `bodeguero`. Verifiqué en vivo que `POST` y `PUT /tipos` ya responden 422/404 (permitido), pero `DELETE /tipos/{id}` da 403.
7. **Facturas por bodega (nuevo).** Cuando `/me` traiga `bodega_id`, el front lo envía como parámetro `bodega_id` en `GET /facturas`. El admin y el cliente no lo envían.
8. **Documentación y tests.** Actualicé README, checklist y el contrato interno. Agregué los Tests 33 y 34; todo en verde.

## ⚠️ Lo que necesito que ajustes del lado del backend

| # | Endpoint | Situación actual | Lo esperado |
|---|---|---|---|
| A | `DELETE /tipos/{id}` con rol `bodeguero` | `403` | Permitirlo (mismo trato que `POST` y `PUT`). Es su catálogo de productos. |
| B | `GET /facturas` con rol `bodeguero` | Devuelve facturas de todas las bodegas | Filtrar por la bodega asociada al usuario del token, igual que ya filtras por `cliente_id` para el cliente. |
| C | `GET /me` | No devuelve `bodega_id` | Incluir `bodega_id` (o `bodega: { id }`) para que el front pueda enviar el parámetro del punto B. Si el filtro del punto B es solo por token, el parámetro del front es un refuerzo, no un requisito. |

Nota: el usuario bodeguero actual (`id=2`) no tiene bodega asignada en `/me`. Si el backend filtra por token, verá cero facturas hasta que se le asocie una bodega. ¿Confirmás si lo asociamos desde tu lado?

## ✅ Lo que confirmo de tu parte

- `/facturas` completo, con acciones y PDF.
- Permisos del bodeguero: CRUD de Tipos (salvo el punto A), solo lectura en Bodegas y Usuarios, y sin acceso a Roles/Permisos.
- Errores 422 en español, incluidos `page` y `limit`.
- Borrados protegidos con `400` y motivo.
- Roles, `PUT /roles/{id}/permisos`, login y CORS sin cambios.

## Cuentas con las que estoy probando

| Rol | Correo | Contraseña |
|---|---|---|
| admin | `admin@entrega.com` | `Admin123*` |
| bodeguero | `bodeguero@gmail.com` | `Bodega123*` |
| cliente | `cliente@gmail.com` | `Cliente123*` |

> Corregí las cuentas del README: las de `@entrega.com` para bodeguero y cliente daban `401`. Mis cuentas demo (`luis@entrega.com`, `juan@cliente.com`) siguen existiendo solo para el modo sin backend; no son las reales.

Si ves algo distinto en una prueba manual, me pasás **rol + pasos + mensaje de consola (F12)** y lo ajustamos. ¡Gracias! 🚀
