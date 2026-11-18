# Checklist de prueba manual — Entrega de Productos (frontend)

Para el lunes. Tildá cada ítem mientras probás. Si algo falla, anotá **rol + pasos + mensaje de consola (F12)** y me avisás.

## 0. Preparación

- [ ] `npm install` dentro de `entrega-productos-front`.
- [ ] `.env` con `VITE_USE_MOCKS=true`, `VITE_API_URL=/api` y `VITE_BACKEND_URL=http://192.168.20.49:8000`.
- [ ] `npm run dev` y abrir `http://localhost:5173/` (o la IP de red que muestra Vite).

> En el login de modo demo hay botones **Admin / Bodeguero / Cliente** que llenan las credenciales solos.
>
> | Rol | Correo | Contraseña |
> |---|---|---|
> | admin | `admin@entrega.com` | `Admin123*` |
> | bodeguero | `luis@entrega.com` | `Bodega123*` |
> | cliente | `juan@cliente.com` | `Cliente123*` |
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
- [ ] Bodega muestra columnas Nombre, Ciudad, Responsable, Teléfono.
- [ ] Admin: crear usuario con `rol_id` 1/2/3.
- [ ] Al elegir **cliente** aparecen tipo/número de documento, teléfono y dirección (obligatorios).
- [ ] Al elegir admin o bodeguero esos campos NO aparecen.
- [ ] Bodeguero: solo ver en ambos módulos; en Usuarios solo ve clientes.

## 5. Facturas

### Admin / bodeguero

- [ ] Crear factura con 1 o más líneas; el total se calcula solo.
- [ ] El estado sale en badge con color: gris/ámbar/verde/rojo/azul.
- [ ] En `creada`: Editar, Eliminar y Entregar.
- [ ] En `entregada`: **no** aparecen Aceptar ni Rechazar.
- [ ] En `aceptada`: aparece Recibir → pasa a `cerrada`.
- [ ] En `rechazada` / `cerrada`: no hay acciones que cambien el estado, pero sí PDF.
- [ ] Buscar por número (`FAC-000001`) y por nombre del cliente.
- [ ] Filtro de estado acepta un solo valor exacto.
- [ ] Descargar PDF → archivo `FAC-000001.pdf`.
- [ ] El bodeguero **no** ve Aceptar/Rechazar.

### Cliente

- [ ] Solo ve Inicio y Facturas.
- [ ] En `entregada`: Aceptar (con firma) y Rechazar (con motivo).
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

## 7. Cuando el backend publique los CRUD

- [ ] Avisarme con el mensaje de `ArchivosMD/MENSAJE_PARA_BACKEND.md`.
- [ ] Configurar `.env` con `VITE_USE_MOCKS=false`.
- [ ] Reiniciar `npm run dev` (importante: Vite no recarga variables de entorno en caliente).
- [ ] Login real: `admin@entrega.com` / `Admin123*`.
- [ ] Probar `/tipos?q=ALI&page=1&limit=10`.
- [ ] Probar `/bodegas`, `/usuarios` y `/facturas` en ese orden.
- [ ] Verificar que el backend devuelve `403` a bodeguero en POST/PUT/DELETE de Tipos y Bodegas.
- [ ] Verificar que los 422 de `page`/`limit` estén traducidos.
- [ ] **No tocar CORS del backend**: seguimos llamando a `/api` (proxy de Vite).

---

**Estado actual:** 31 archivos de test / 154 aserciones en verde + build correcto.
**Rama:** `main` limpia y pusheada.
