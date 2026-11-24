# Especificaciones del Módulo de Estadísticas (`GET /estadisticas/resumen`)

> **Propósito:** Definir la lógica de negocio, seguridad, filtros y contrato JSON del módulo de estadísticas para los 4 roles del sistema (`admin`, `empresa`, `bodeguero`, `cliente`), asegurando que cada perfil visualice únicamente métricas relevantes para su nivel operativo.
> **Destinatarios:** Equipo Backend (FastAPI + SQLAlchemy 2 + MySQL 8.4) y Frontend / OpenCode (Vue 3.5 + Vitest + Capacitor).

---

## 1. Reglas de Seguridad y Filtrado en Backend

1. **Aislamiento estricto por token JWT:**
   * El backend extrae `user_id` del token, consulta en MySQL su `rol` y `empresa_id` (o `bodega_id`) actualizados y fuerza el alcance de las consultas SQL.
   * **Nunca confiar en los query params para seguridad:**
     * Si entra **`bodeguero`**: ignorar `empresa_id` o `bodega_id` de la URL y forzar `WHERE facturas.bodega_id = usuario_actual.bodega_id`.
     * Si entra **`empresa`**: forzar `WHERE facturas.empresa_id = usuario_actual.empresa_id`. Si envía `bodega_id`, validar que pertenezca a su empresa (si no, responder `403 Forbidden`).
     * Si entra **`cliente`**: forzar `WHERE facturas.cliente_id = usuario_actual.id`.
     * Si entra **`admin`**: acceso global sin restricción; puede filtrar opcionalmente por `empresa_id`.
2. **Rango de fechas por defecto:**
   * Si no se envían `fecha_inicio` y `fecha_fin`, el backend asume por defecto los **últimos 30 días** (o el mes calendario en curso) y devuelve el rango aplicado dentro de la respuesta.

---

## 2. Matriz de Métricas y Filtros por Rol

| Rol | Objetivo de negocio | KPIs (Tarjetas superiores) | Desglose Principal (Tabla / Gráfico) | Filtros permitidos en la UI |
| :--- | :--- | :--- | :--- | :--- |
| **`admin`** | Salud de la plataforma SaaS, adopción de empresas y volumen global. | 1. `empresas_activas`: Empresas activas.<br>2. `empresas_pendientes`: Solicitudes pendientes de aprobación (`alerta: true` si > 0).<br>3. `clientes_globales`: Total clientes registrados.<br>4. `tasa_entrega_global`: % facturas completadas (`firmada` + `recibida`) sobre total. | **Top Empresas por Volumen:**<br>Columnas: `Empresa`, `Bodegas`, `Facturas`, `Rechazadas`, `Efectividad (%)`. | • Rango de fechas (`fecha_inicio`, `fecha_fin`)<br>• Empresa (`empresa_id`: todas o una puntual)<br>• Estado de empresa (`activa`, `pendiente`, `suspendida`) |
| **`empresa`** | Control gerencial de sus bodegas, efectividad de entrega y detección de fallas. | 1. `total_facturas`: Total facturas de la empresa en el periodo.<br>2. `pendientes_cierre`: Facturas en `emitida` o `entregada` sin firmar.<br>3. `tasa_aceptacion`: % facturas `firmada`/`recibida`.<br>4. `tasa_rechazo`: % facturas `rechazada` (`alerta: true` si > 10%). | **Rendimiento por Bodega:**<br>Columnas: `Bodega`, `Emitidas`, `Completadas`, `Rechazadas`, `Efectividad (%)`.<br>*(Secundario: Top motivos de rechazo).* | • Rango de fechas (`fecha_inicio`, `fecha_fin`)<br>• Bodega (`bodega_id`: todas sus bodegas o una puntual)<br>• Bodeguero (`bodeguero_id`)<br>• Tipo de producto (`tipo_id`) |
| **`bodeguero`** | Operación diaria de su sucursal, despachos pendientes y alertas de rechazo. | 1. `por_despachar`: Facturas en estado `emitida` en su bodega.<br>2. `sin_firma`: Facturas en estado `entregada` esperando firma.<br>3. `completadas`: Facturas `firmada`/`recibida` en el periodo.<br>4. `rechazadas`: Facturas `rechazada` en su bodega. | **Actividad por Tipo de Producto:**<br>Columnas: `Tipo Producto`, `Emitidas`, `Completadas`, `Rechazadas`.<br>*(Secundario: Últimas facturas rechazadas con su `motivo_rechazo`).* | • Presets rápidos (`Hoy`, `7 días`, `30 días`) + rango de fechas<br>• Tipo de producto (`tipo_id`)<br>• Estado (`todas`, `pendientes`, `completadas`, `rechazadas`) |
| **`cliente`** | Trazabilidad personal de entregas recibidas y control de rechazos. | 1. `pendientes_accion`: Facturas propias en `emitida` o `entregada` (por firmar/aceptar).<br>2. `recibidas_total`: Total facturas aceptadas/firmadas.<br>3. `rechazadas_total`: Total facturas rechazadas.<br>4. `empresas_proveedoras`: Cantidad de empresas distintas que le han facturado. | **Resumen por Empresa Proveedora:**<br>Columnas: `Empresa`, `Total Facturas`, `Aceptadas`, `Rechazadas`. | • Rango de fechas (`fecha_inicio`, `fecha_fin`)<br>• Empresa proveedora (`empresa_id`, solo de las que le han facturado)<br>• Estado (`todas`, `pendientes`, `aceptadas`, `rechazadas`) |

---

## 3. Contrato HTTP y JSON Unificado

### 3.1 Petición (Request)
```http
GET /estadisticas/resumen?fecha_inicio=2026-11-01&fecha_fin=2026-11-30&bodega_id=2&tipo_id=1
Authorization: Bearer <token>
```
*(Todos los query params son opcionales).*

### 3.2 Respuesta (Response `200 OK`)
El backend devuelve siempre esta estructura estandarizada para evitar lógica de cálculo pesada en el frontend:

```json
{
  "generado_para": "empresa",
  "periodo": {
    "fecha_inicio": "2026-11-01",
    "fecha_fin": "2026-11-30"
  },
  "filtros_disponibles": {
    "empresas": [],
    "bodegas": [
      { "id": 1, "nombre": "Bodega Norte" },
      { "id": 2, "nombre": "Bodega Centro" }
    ],
    "bodegueros": [
      { "id": 5, "nombre": "Pedro Gómez" }
    ],
    "tipos": [
      { "id": 1, "nombre": "Electrónica" }
    ]
  },
  "kpis": [
    {
      "clave": "total_facturas",
      "titulo": "Facturas del periodo",
      "valor": 148,
      "formato": "numero",
      "alerta": false
    },
    {
      "clave": "pendientes_cierre",
      "titulo": "Pendientes de firma",
      "valor": 12,
      "formato": "numero",
      "alerta": true
    },
    {
      "clave": "tasa_aceptacion",
      "titulo": "Tasa de aceptación",
      "valor": 94.5,
      "formato": "porcentaje",
      "alerta": false
    },
    {
      "clave": "tasa_rechazo",
      "titulo": "Tasa de rechazo",
      "valor": 5.5,
      "formato": "porcentaje",
      "alerta": false
    }
  ],
  "desglose_principal": {
    "titulo": "Rendimiento por Bodega",
    "columnas": ["Bodega", "Emitidas", "Completadas", "Rechazadas", "Efectividad"],
    "filas": [
      {
        "nombre": "Bodega Norte",
        "emitidas": 90,
        "completadas": 86,
        "rechazadas": 4,
        "efectividad": "95.5%"
      },
      {
        "nombre": "Bodega Centro",
        "emitidas": 58,
        "completadas": 54,
        "rechazadas": 4,
        "efectividad": "93.1%"
      }
    ]
  },
  "serie_temporal": [
    { "fecha": "2026-11-01", "completadas": 14, "rechazadas": 1 },
    { "fecha": "2026-11-02", "completadas": 19, "rechazadas": 0 }
  ],
  "alertas_detalle": [
    {
      "numero_factura": "FAC-0042",
      "motivo_rechazo": "Caja golpeada al momento de la entrega",
      "fecha": "2026-11-23"
    }
  ]
}
```

---

## 4. Instrucciones de Implementación por Capa

### 4.1 Para Backend (FastAPI + SQLAlchemy 2)
1. **Endpoint `GET /estadisticas/resumen`:**
   * Construir las consultas agregadas usando `func.count`, `func.sum` y `case` de SQLAlchemy 2 directamente sobre MySQL 8.4 (evitar traer todas las filas a memoria en Python).
   * Poblar `filtros_disponibles` únicamente con las opciones válidas para el usuario autenticado (ej. para `empresa`, solo sus bodegas, sus bodegueros y sus tipos; para `cliente`, solo las empresas que le han emitido facturas).
   * Poblar `alertas_detalle` con las últimas 5 facturas en estado `rechazada` (incluyendo su `motivo_rechazo`) visibles para ese rol (`empresa` o `bodeguero`).

### 4.2 Para Frontend / OpenCode (Vue 3.5 + CSS Puro + Vitest)
1. **Composable `src/modules/estadisticas/composables/useEstadisticas.js`:**
   * Gestionar estado reactivo de filtros (`fecha_inicio`, `fecha_fin`, `empresa_id`, `bodega_id`, `bodeguero_id`, `tipo_id`, `estado`).
   * Ejecutar petición a `GET /estadisticas/resumen` al montar y cada vez que cambie un filtro (con botón *"Limpiar filtros"*).
   * Definir textos descriptivos por rol:
     * `admin`: *"Métricas globales de empresas, clientes y operación de la plataforma."*
     * `empresa`: *"Rendimiento consolidado de tus bodegas, entregas y motivos de rechazo."*
     * `bodeguero`: *"Control diario de despachos, firmas pendientes y actividad de tu bodega."*
     * `cliente`: *"Historial personal de facturas recibidas, pendientes y rechazos."*
2. **Vista `EstadisticasView.vue` (CSS puro + `@lucide/vue`):**
   * **Barra de filtros adaptativa:** Renderizar dinámicamente los `<select>` únicamente si `filtros_disponibles.<lista>.length > 0` (así el `bodeguero` no ve selectores vacíos de empresas o bodegas, y el `admin` sí ve el selector de empresas).
   * **Accesos rápidos de fecha:** Botones tipo píldora (`Hoy`, `7 días`, `30 días`) además de los inputs `type="date"`.
   * **Grid de KPIs:** 4 tarjetas responsivas; si `kpi.alerta === true`, resaltar borde/badge con color de advertencia.
   * **Tabla de `desglose_principal` y gráfico de barras en CSS puro** para `serie_temporal` (sin librerías externas pesadas, respetando el estilo ligero del proyecto).
   * **Sección de alertas de rechazo:** Si `alertas_detalle.length > 0`, mostrar tarjeta con los últimos motivos de rechazo reportados.
3. **Mocks y Tests (`Vitest`):**
   * Actualizar `src/shared/api/mocks.js` con respuestas simuladas completas (`kpis`, `filtros_disponibles`, `desglose_principal`, `serie_temporal`) para los 4 roles (`admin`, `empresa`, `bodeguero`, `cliente`).
   * Actualizar `test/estadisticas.test.js` verificando que:
     * Cada rol renderiza sus KPIs y descripción correspondiente.
     * Los selectores de filtro se muestran u ocultan según `filtros_disponibles`.
     * Cambiar un filtro dispara una nueva consulta con los query params correctos.
   * Ejecutar `npm test` y garantizar que todas las pruebas pasen en verde.