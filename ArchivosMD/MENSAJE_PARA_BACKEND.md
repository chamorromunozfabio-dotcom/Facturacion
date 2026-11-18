# Mensaje para el backend — contrato v2 aplicado

> Listo para copiar y pegar. Fecha: 18-11-2026 (actualizado).
> Estado del frontend: **35 archivos de test / 171 aserciones en verde y build correcto.**

---

> Hola, gracias por `CAMBIOS_PARA_FRONTENDv2.md`. Ya lo revisé todo contra la API en vivo y apliqué los cambios en el frontend. Te confirmo qué quedó de cada lado.

## ✅ Lo que ajusté yo

1. **Bodeguero sin Usuarios.** Quité el menú, la ruta `/usuarios` y el permiso `view` de su matriz. El API ya respondía `403`, ahora el front tampoco lo ofrece.
2. **Selector de clientes.** `FacturaForm` ya no usa `/usuarios?rol=cliente`; usa tu endpoint nuevo `GET /facturas/clientes` (verifiqué 200 para admin/bodeguero y 403 para cliente).
3. **Bodegas con dueño.** Agregué `bodeguero_nombre` como columna para el admin y un selector “Bodeguero dueño” con `GET /usuarios?rol=bodeguero`. El valor se envía como número. El bodeguero no ve ese campo: al crear, el backend lo asigna solo.
4. **Permisos de bodegas.** El bodeguero ya tiene Crear/Editar/Eliminar (sus bodegas). El admin ve y edita todas.
5. **Documentación y tests.** Actualicé README, checklist, integración y contrato interno. Agregué el Test 35; todo en verde.

## ✅ Lo que verifiqué de tu parte

- `DELETE /tipos/{id}` con bodeguero: ya no da `403` (da `404` con id inexistente). Quedó resuelto el punto A.
- `/facturas/clientes` publicado con `{data, total, page, limit}`.
- `/bodegas` con parámetro `bodeguero_id` y campos `bodeguero_id` / `bodeguero_nombre` en la respuesta.
- El bodeguero solo recibe sus bodegas (hoy `data: []`, porque aún no tiene ninguna asignada).
- `/usuarios` da `403` para bodeguero y cliente.
- Los borrados protegidos, errores 422 en español y el PDF `FE-0001.pdf` siguen iguales.

## 📌 Observación sobre los documentos

`CONTRATO_FACTURASv2.md` todavía trae los valores del contrato viejo (`creada`, `aceptada`, `cerrada`, `FAC-000001`, `responsable_nombre`). No lo estamos usando como referencia; si lo vas a dejar como histórico, conviene marcarlo arriba con “versión anterior, ver CAMBIOS_PARA_FRONTENDv2.md” para evitar confusión.

También quedó sin efecto nuestro pedido anterior de filtrar `GET /facturas` por bodega: tu cuadro v2 dice que el bodeguero **ve todas** y solo puede crear desde las suyas. Nos alineamos con eso.

## Cuentas con las que estoy probando

| Rol | Correo | Contraseña |
|---|---|---|
| admin | `admin@entrega.com` | `Admin123*` |
| bodeguero | `bodeguero@gmail.com` | `Bodega123*` |
| cliente | `cliente@gmail.com` | `Cliente123*` |

> Coincido con tu aviso: las cuentas `@entrega.com` del documento v2 ya no son las que están en la BD. Estas son las que responden `200`.

Si ves algo distinto en una prueba manual, me pasás **rol + pasos + mensaje de consola (F12)** y lo ajustamos. ¡Gracias! 🚀
