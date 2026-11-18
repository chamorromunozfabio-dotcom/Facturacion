# Checklist de prueba manual — Entrega de Productos (frontend)

Para el lunes. Tildá cada ítem mientras probás. Si algo falla, anotá **rol + pasos + mensaje de consola (F12)** y me avisás.

## 0. Preparación

- [ ] `npm install` dentro de `entrega-productos-front`.
- [ ] `.env` con `VITE_API_URL=/api`, `VITE_BACKEND_URL=http://192.168.20.49:8000`, `VITE_USE_MOCKS=false` y `VITE_FACTURAS_MOCKS=false` (todo contra la API real).
- [ ] Reiniciar `npm run dev` después de cambiar `.env` (Vite no recarga variables en caliente).
- [ ] Abrir `http://localhost:5173/` (o la IP de red que muestra Vite).

> En el login de modo demo hay botones **Admin / Bodeguero / Cliente** que llenan las credenciales solos.
>
> | Rol | Correo | Contraseña |
> |---|---|---|
> | admin | `admin@entrega.com` | `Admin123*` |
> | bodeguero | `luis@entrega.com` | `Bodega123*` |
> | cliente (demo) | `juan@cliente.com` | `Cliente123*` |
> | cliente (API real) | `cliente@entrega.com` | `Cliente123*` |
>
> Cualquier otro correo sigue entrando como admin demo. El rol se conserva al recargar (F5).

## 1. Login y sesión

- [ ] Con campos vacíos, **Ingresar** queda deshabilitado y dice qué completar.
- [ ] Correo mal escrito o contraseña corta → mensaje debajo de cada campo y botón sigue deshabilitado.
- [ ] Ingresar con credenciales válidas → aparece el nombre y el rol correspondiente.
- [ ] Recargar la página → la sesión sigue activa.
- [ ] Cerrar sesión → vuelve a `/login` y `localStorage` queda limpio.
- [ ] Sin sesión, intentar abrir `/facturas` → redirige al login.

## 2. Menú por rol

| Rol | Módulos que debe ver |
|---|---|
| admin | Inicio, Tipos, Bodegas, Usuarios, Permisos, Roles, Facturas (7) |
| bodeguero | Inicio, Tipos, Bodegas, Usuarios, Facturas (5) |
| cliente | Inicio, Facturas (2) |

- [ ] No aparece “Órdenes” en ningún rol.
- [ ] `/ordenes` y `/factura` redirigen a `/facturas`.
- [ ] Color de acento: admin violeta, bodeguero verde, cliente ámbar.
- [ ] Al cambiar de vista hay una transición suave.
- [ ] En ventana angosta el menú se vuelve horizontal y sigue siendo usable.

## 3. Tipos (admin)

- [ ] `Nuevo` abre el modal con animación; el foco queda dentro; **Escape** lo cierra.
- [ ] Crear “Alimentos” → aparece en la tabla y sale alerta verde.
- [ ] Buscar `ali` → encuentra “Alimentos” (parcial y sin mayúsculas).
- [ ] Editar el nombre → alerta “Tipo actualizado.”
- [ ] Eliminar → pide confirmación; `Cancelar` no borra, `Eliminar` sí.
- [ ] Como **bodeguero**: ve el listado pero NO ve Crear/Editar/Eliminar.

## 4. Bodegas y Usuarios

- [ ] Admin: crear, buscar, editar y eliminar bodega (solo `nombre` obligatorio).
- [ ] El formulario ofrece `codigo`, `departamento`, `correo` y los campos `recibe_*`.
- [ ] Bodega muestra columnas Nombre, Ciudad, Responsable, Teléfono.
- [ ] Admin: crear usuario con `rol_id` 1/2/3.
- [ ] Al elegir **cliente** aparecen tipo/número de documento, teléfono, dirección y ciudad (todos opcionales; `PA` disponible).
- [ ] Al elegir admin o bodeguero esos campos NO aparecen.
- [ ] Bodeguero: solo ver en ambos módulos; en Usuarios solo ve clientes.

## 5. Facturas

### Admin / bodeguero

- [ ] Crear factura con 1 o más líneas; el total se calcula solo y el número sale `FE-0001`.
- [ ] El estado sale en badge con color: gris `emitida`, ámbar `entregada`, verde `firmada`, rojo `rechazada`, azul `recibida`.
- [ ] En `emitida`: Editar, Eliminar y Entregar.
- [ ] En `entregada`: **no** aparecen Aceptar ni Rechazar (para admin/bodeguero).
- [ ] En `firmada`: aparece Recibir → pasa a `recibida`.
- [ ] En `rechazada` / `recibida`: no hay acciones que cambien el estado, pero sí PDF.
- [ ] Buscar por número (`FE-0001`) y por nombre del cliente.
- [ ] Filtro de estado acepta un solo valor exacto.
- [ ] Descargar PDF → archivo `FE-0001.pdf`.
- [ ] El bodeguero **no** ve Aceptar/Rechazar.

### Cliente

- [ ] Solo ve Inicio y Facturas.
- [ ] En `entregada`: Aceptar (con firma) → `firmada`, y Rechazar (con motivo) → `rechazada`.
- [ ] Dibujar la firma → se ve la vista previa; `Limpiar` la borra.
- [ ] Aceptar sin firma → error “imagen PNG”.
- [ ] Rechazar sin motivo → error.
- [ ] No ve botones Crear/Editar/Eliminar/Entregar.

## 6. Diseño y accesibilidad

- [ ] Iconos en menú, botones y badges (nada de emoji sueltos).
- [ ] Modales y alertas entran/salen con animación.
- [ ] Escape cierra los modales y el foco entra al abrir.
- [ ] Si el sistema tiene activado “reducir movimiento”, no hay animaciones.
- [ ] El canvas de firma tiene etiqueta accesible.

## 7. Roles y Permisos (ahora son CRUD reales)

- [ ] Admin: crear un rol “supervisor” → aparece en la tabla y sale “Rol creado.”
- [ ] Admin: editar y eliminar un rol con confirmación.
- [ ] Admin: crear un permiso “editar_factura” → sale “Permiso creado.”
- [ ] Bodeguero: no ve botones Crear/Editar/Eliminar en Roles ni Permisos.

## 8. Integración real (todo contra la API)

- [ ] Login real con `admin@entrega.com` / `Admin123*` (bodeguero: `bodeguero@entrega.com` / `Bodega123*`; cliente: `cliente@entrega.com` / `Cliente123*`).
- [ ] Recargar la página → `GET /me` mantiene la sesión.
- [ ] Tipos: crear “Alimentos”, buscar `ali`, editar y eliminar contra la API.
- [ ] Bodegas: crear con `codigo`, `departamento`, `correo` y `recibe_*` (ya no `responsable_*`).
- [ ] Usuarios: crear cliente con datos opcionales (incluye `PA` y `ciudad`).
- [ ] Como bodeguero: no puede escribir Tipos/Bodegas y solo ve clientes en Usuarios.
- [ ] Facturas: crear `FE-0001` en `emitida`, entregar, aceptar con firma → `firmada`, recibir → `recibida` y descargar `FE-0001.pdf`.
- [ ] **No tocar CORS del backend**: seguimos llamando a `/api` (proxy de Vite).

---

**Estado actual:** 33 archivos de test / 162 aserciones en verde + build correcto.
**Rama:** pendiente de merge del Test 33.
