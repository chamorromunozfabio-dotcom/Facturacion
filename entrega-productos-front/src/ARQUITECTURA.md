# Mapa del frontend

Esta guía responde una pregunta simple: **¿dónde pongo esto y dónde lo busco?**

## Regla rápida

| Si es... | Va en... | Ejemplo |
|---|---|---|
| Una pantalla con ruta | `views/` | `FacturaView.vue`, `PermisosView.vue` |
| Una pieza de una sola pantalla | `components/<modulo>/` | `components/facturas/FacturaLineas.vue` |
| Una pieza usada en varias pantallas | `components/ui/` | `DataTable.vue`, `AlertMessage.vue` |
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
│  ├─ ui/                       ← genéricos: DataTable, AlertMessage, FormModal, ...
│  ├─ facturas/                 ← formulario, detalle, buscador de tipos y modales
│  ├─ permisos/                 ← buscador, cabecera, matriz y confirmación
│  ├─ layout/                   ← SidebarMenu y TopBar
│  └─ (raíz)                    ← solo re-exports de compatibilidad
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

## Compatibilidad

Los archivos en la raíz de `components/` ya no contienen implementación: solo re-exportan el componente real desde `ui/` o `facturas/`. Están ahí para no romper imports antiguos.

Código nuevo: importá siempre desde `components/ui/` o `components/<modulo>/`. Los re-exports de la raíz se pueden quitar cuando ya no queden imports que los usen.
