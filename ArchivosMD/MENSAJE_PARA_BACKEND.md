# Mensaje para el backend — cambios recibidos y aplicados

> Listo para copiar y pegar. Fecha: 18-11-2026 (actualizado).
> Estado del frontend: **33 archivos de test / 162 aserciones en verde y build correcto.**

---

> Hola, gracias por `CAMBIOS_PARA_FRONTEND.md`. Ya revisé todo y apliqué los cambios en el frontend. Te confirmo qué queda de cada lado para que no haya confusión.

## ✅ Lo que ya ajusté yo

1. **Facturas con API real.** Puse `VITE_FACTURAS_MOCKS=false`. El módulo ya no usa datos falsos.
2. **Estados definitivos.** Reemplacé `creada → emitida`, `aceptada → firmada` y `cerrada → recibida` en filtros, botones y colores del badge. `entregada` y `rechazada` quedan igual.
3. **Número de factura.** Ahora uso `FE-0001` y el PDF se descarga como `FE-0001.pdf`.
4. **Bodegas.** Cambié `responsable_nombre/documento/telefono` por `recibe_nombre/recibe_documento/recibe_telefono`, usé `correo` para la bodega y agregué `codigo`, `departamento` y `recibe_cargo`.
5. **Usuarios.** Los datos de cliente (`tipo_documento`, `numero_documento`, `telefono`, `direccion`, `ciudad`) ahora son opcionales para todos los roles; agregué `PA` a los tipos de documento.
6. **Documentación y tests.** Actualicé README, checklist y el contrato interno. Agregué el Test 33 con 5 aserciones nuevas; todo en verde.

## ✅ Lo que confirmo de tu parte

- `/facturas` completo, con acciones y PDF.
- Permisos del bodeguero: solo lectura en Tipos/Bodegas y solo clientes en Usuarios.
- Errores 422 en español, incluidos `page` y `limit`.
- Borrados protegidos con `400` y motivo.
- Roles, `PUT /roles/{id}/permisos`, login y CORS sin cambios.

## Cuentas con las que estoy probando

| Rol | Correo | Contraseña |
|---|---|---|
| admin | `admin@entrega.com` | `Admin123*` |
| bodeguero | `bodeguero@entrega.com` | `Bodega123*` |
| cliente | `cliente@entrega.com` | `Cliente123*` |

> Mis cuentas demo (`luis@entrega.com`, `juan@cliente.com`) siguen existiendo solo para el modo sin backend; no son las reales.

Si ves algo distinto en una prueba manual, me pasás **rol + pasos + mensaje de consola (F12)** y lo ajustamos. ¡Gracias! 🚀
