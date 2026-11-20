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
> | bodeguero (API real) | `bodeguero@gmail.com` | `Bodega123*` |
> | cliente (API real) | `cliente@gmail.com` | `Cliente123*` |
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
| admin | Inicio, Tipos, Bodegas, Usuarios, Permisos, Roles, Facturas, Estadísticas (8) |
| bodeguero | Inicio, Tipos, Bodegas, Facturas, Estadísticas (5) |
| cliente | Inicio, Facturas, Estadísticas (3) |

- [ ] El texto del Inicio se ajusta al rol y menciona **Estadísticas** (admin habla de cifras globales; bodeguero y cliente, de las suyas).
- [ ] No aparece “Órdenes” en ningún rol.
- [ ] `/ordenes` y `/factura` redirigen a `/facturas`.
- [ ] Color de acento: admin violeta, bodeguero verde, cliente ámbar.
- [ ] Al cambiar de vista hay una transición suave.
- [ ] A **1024 px o menos** el menú se abre con el botón hamburguesa (drawer); por encima de 1024 px queda fijo en pantalla.
- [ ] El `<meta name="theme-color">` de `index.html` combina con la barra del navegador en el celular.

## 3. Tipos (admin)

- [ ] `Nuevo` abre el modal con animación; el foco queda dentro; **Escape** lo cierra.
- [ ] Crear “Alimentos” → aparece en la tabla y sale alerta verde.
- [ ] Buscar `ali` → encuentra “Alimentos” (parcial y sin mayúsculas).
- [ ] Editar el nombre → alerta “Tipo actualizado.”
- [ ] Eliminar → pide confirmación; `Cancelar` no borra, `Eliminar` sí.
- [ ] Como **bodeguero**: ve el listado y SÍ ve Crear/Editar/Eliminar (son sus productos).

## 4. Bodegas y Usuarios

- [ ] Admin: crear, buscar, editar y eliminar bodega (solo `nombre` obligatorio).
- [ ] El formulario ofrece `codigo`, `departamento`, `correo` y los campos `recibe_*`.
- [ ] Bodega muestra columnas Nombre, Ciudad, Responsable, Teléfono.
- [ ] Admin: crear usuario con `rol_id` 1/2/3.
- [ ] Al elegir **cliente** aparecen tipo/número de documento, teléfono, dirección y ciudad (todos opcionales; `PA` disponible).
- [ ] Al elegir admin o bodeguero esos campos NO aparecen.
- [ ] Bodeguero: Crear/Editar/Eliminar en Tipos y en sus Bodegas; **no ve el menú Usuarios**.
- [ ] Admin: en Bodegas aparece el selector “Bodeguero dueño” y puede asignarlo.
- [ ] Al crear una bodega como bodeguero, no aparece el selector de dueño (el backend lo asigna).

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
- [ ] Admin: en **Permisos**, elegir un usuario → aparece “Editando los permisos de … (rol …)” con sus checks actuales (`GET /usuarios/{id}/permisos`).
- [ ] Admin: marcar un permiso y tocar **Guardar permisos** → sale “Permisos de "Nombre" actualizados.” y se deshabilita el botón.
- [ ] Admin: cambiar a otro usuario → carga **sus** permisos, no los del anterior.
- [ ] Admin: desmarcar todos y guardar → el usuario queda sin permisos (se envía `permisos_ids: []`).
- [ ] Confirmar en `GET /usuarios/{id}/permisos` y en `GET /me` del usuario que la lista cambió; cambiar su `rol_id` NO debe cambiar sus permisos.
- [ ] Bodeguero: no ve el menú Permisos y la ruta `/permisos` lo devuelve al inicio.

## 8. Integración real (todo contra la API)

- [ ] Login real con `admin@entrega.com` / `Admin123*` (bodeguero: `bodeguero@gmail.com` / `Bodega123*`; cliente: `cliente@gmail.com` / `Cliente123*`).
- [ ] Recargar la página → `GET /me` mantiene la sesión.
- [ ] Tipos: crear “Alimentos”, buscar `ali`, editar y eliminar contra la API.
- [ ] Bodegas: crear con `codigo`, `departamento`, `correo` y `recibe_*` (ya no `responsable_*`).
- [ ] Usuarios: crear cliente con datos opcionales (incluye `PA` y `ciudad`).
- [ ] Como bodeguero: Crear/Editar/Eliminar en Tipos y en sus bodegas; `/usuarios` da 403; el selector de clientes sale de `/facturas/clientes`.
- [ ] Facturas: crear `FE-0001` en `emitida`, entregar, aceptar con firma → `firmada`, recibir → `recibida` y descargar `FE-0001.pdf`.
- [ ] **No tocar CORS del backend**: seguimos llamando a `/api` (proxy de Vite).

## 9. Verificación después de los refactors (entregas 6 a 8)

Estos cambios fueron internos: **no deben notarse en la pantalla**. Si algo de esta lista falla, es una regresión.

- [ ] Ingresar sigue enviando `POST /login` con `{ "correo": "...", "contrasena": "..." }` (sin `usuario`, `username`, `password` ni form-data).
- [ ] El login muestra igual el logo, los mensajes de validación, el aviso de sesión vencida y los botones de cuentas demo (si `VITE_USE_MOCKS=true`).
- [ ] En Roles, Bodegas, Tipos y Usuarios: crear, buscar, editar, eliminar, paginar y los mensajes de éxito/duplicado/sin cambios funcionan igual.
- [ ] Los botones siguen diciendo **“Nuevo producto”**, **“Nueva bodega”**, **“Nuevo rol”**, **“Nuevo usuario”**; el formulario de Tipos sigue diciendo **“Producto *”**.
- [ ] El menú “Tipos” y el título “Tipos de producto” se mantienen.
- [ ] Los permisos del menú, botones y rutas siguen leyéndose de `auth.permisos` (recargar la página tras cambiarlos en backend).
- [ ] Las animaciones de modales y alertas siguen funcionando; los avisos se cierran solos a los 5 s (salvo `duration: 0`).

### Revisión visual (jsdom no la cubre)

- [ ] **320 px:** sin desbordes horizontales; tarjeta de login y tablas scrolleables.
- [ ] **375 px:** drawer hamburguesa, botones y campos touched sin solaparse.
- [ ] **768 px:** misma maquetación con drawer; la alerta flotante de facturas pasa a `position: static`.
- [ ] **1024 px:** comprobar el corte exacto entre drawer y menú fijo.
- [ ] Confirmar en DevTools que no hay errores en consola ni estilos perdidos al navegar entre las 4 vistas CRUD y el login.

## 10. Módulo nuevo: Estadísticas por usuario autenticado

Novedad visible: hay una opción **Estadísticas** en el menú y una ruta `/estadisticas`. El backend **ya publicó** el permiso `estadisticas_view` (en la plantilla de los 3 roles y asignado a los usuarios actuales) y el endpoint `GET /estadisticas/resumen`. En modo demo (`VITE_USE_MOCKS=true`) el panel funciona con datos falsos con la misma forma que la respuesta real.

- [ ] Con `VITE_USE_MOCKS=true`: entrar como admin, bodeguero y cliente; en los tres casos el menú muestra **Estadísticas** y el panel abre sin errores.
- [ ] La descripción bajo el título cambia por rol: admin → “Analiza las cifras globales de todos los usuarios y el rendimiento general.”; bodeguero → “Consulta las cifras de las facturas que creaste y de tus bodegas.”; cliente → “Consulta las cifras y la evolución de tus facturas.”
- [ ] El panel muestra tarjetas, barras y la serie temporal `por_fecha` con CSS puro (sin librerías de gráficos, PrimeVue ni Tailwind).
- [ ] En admin se ven 4 gráficos (`por_estado`, `por_fecha`, `por_bodega`, `top_productos`); en cliente solo 2 (`por_estado`, `por_fecha`).
- [ ] La serie temporal se puede recorrer horizontalmente en el celular y marca cada día (o cada mes si el periodo es largo).
- [ ] El rango de fechas arranca en el mes corriente; al cambiar “Desde” o “Hasta” se recarga automáticamente.
- [ ] Si “Desde” > “Hasta”: aparece el aviso, el botón **Actualizar** queda deshabilitado y no se llama a la API.
- [ ] Si el backend devuelve 403 (sin `estadisticas_view`), el guard devuelve al inicio y el menú no muestra la opción al recargar.
- [ ] Con `VITE_USE_MOCKS=false`: las cifras cuadran con el listado de facturas de cada usuario (admin **todas las facturas, bodegas, usuarios activos y top de productos**; bodeguero las que creó; cliente las de su `cliente_id` sin contar `emitida`).
- [ ] El permiso `estadisticas_view` aparece en la matriz de Permisos y **ya no figura como pendiente de backend**.

---

**Estado actual:** 57 archivos de test / 312 pruebas en verde + build correcto.
**Rama:** `main`, con el módulo de estadísticas integrado con el endpoint ya publicado.
