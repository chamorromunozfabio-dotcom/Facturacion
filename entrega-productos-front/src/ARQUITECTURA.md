# Mapa del frontend

Esta guía responde una pregunta simple: **¿dónde pongo esto y dónde lo busco?**

## Regla rápida

| Si es... | Va en... | Ejemplo |
|---|---|---|
| Una pantalla con ruta | `views/` | `FacturaView.vue`, `PermisosView.vue` |
| Una pieza de una sola pantalla | `components/<modulo>/` | `components/facturas/FacturaLineas.vue` |
| Una pieza usada en varias pantallas | `components/ui/` (cuando se migre) | `DataTable.vue`, `AlertMessage.vue` |
| Estado, efectos o carga de datos | `composables/` | `useFacturas.js`, `usePermisos.js` |
| Cálculos o validaciones sin Vue | `utils/` | `facturaCampos.js`, `facturas.js` |
| Llamadas al backend | `api/` | `api/facturas.js`, `api/axios.js` |
| Catálogos fijos y menú | `config/` | `permissions.js`, `navigation.js` |
| Sesión global | `stores/` | `stores/auth.js` |

## Estructura actual

```text
src/
├─ ARQUITECTURA.md              ← este mapa
├─ views/                       ← pantallas conectadas al router
├─ components/
│  ├─ facturas/                 ← filtro, encabezado, líneas y modales de factura
│  ├─ permisos/                 ← buscador, cabecera, matriz y confirmación
│  ├─ layout/                   ← SidebarMenu y TopBar
│  └─ (raíz)                    ← genéricos pendientes de mover a ui/
├─ composables/
│  ├─ useFacturas.js            ← lógica de FacturaView
│  ├─ useFacturaForm.js         ← lógica del formulario de factura
│  ├─ usePermisos.js            ← lógica de PermisosView
│  └─ useModalA11y.js           ← foco y Escape para diálogos
├─ utils/
│  ├─ facturas.js               ← estados, columnas y mapeos puros
│  ├─ facturaCampos.js          ← validación y mensajes del formulario
│  └─ permisos.js               ← texto e iniciales
├─ api/                         ← endpoints reales y mocks
├─ config/                      ← permisos y navegación por rol
└─ stores/                      ← auth
```

## Cómo leer una pantalla

1. Abrí `views/<Nombre>View.vue`: ahí están el encabezado, las piezas que usa y los eventos.
2. Si la lógica no está ahí, buscá `use<Modulo>` en `composables/`.
3. Si es una regla sin efectos (validar, formatear, traducir), buscá `<modulo>.js` en `utils/`.
4. Si es una llamada al backend, buscá `api/<modulo>.js`.
5. Si es un permiso o una opción del menú, buscá `config/`.

## Convención de nombres

- Composable: `use<Modulo>.js` → `useFacturas.js`.
- Pieza de pantalla: `<Modulo><Parte>.vue` → `FacturaFirmaModal.vue`.
- Utilidad pura: `<modulo>.js` o `<modulo>Campos.js` → `facturas.js`, `facturaCampos.js`.
- `data-test`: se mantiene igual aunque el markup se mueva de archivo.

## Pendiente opcional

Los componentes genéricos que hoy están en la raíz de `components/` (`DataTable.vue`, `AlertMessage.vue`, `FormModal.vue`, `TipoSearch.vue`, etc.) pueden moverse a `components/ui/`. Se hace en una entrega aparte porque varios tests los importan por ruta directa; con re-exports se puede hacer sin romperlos.
