<script setup>
import { computed } from 'vue'

const props = defineProps({
  factura: { type: Object, required: true },
})

const money = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))

const emisor = computed(() => props.factura.emisor ?? {})
const adquiriente = computed(() => props.factura.adquiriente ?? {})
const bodega = computed(() => props.factura.bodega ?? {})
const totales = computed(() => props.factura.totales ?? {})
const trazabilidad = computed(() => props.factura.trazabilidad ?? {})
const electronica = computed(() => props.factura.validacion_electronica ?? {})
const software = computed(() => props.factura.software ?? {})
</script>

<template>
  <article v-if="factura" data-test="factura-detail" class="detail">
    <header class="detail__header">
      <div>
        <h2 data-test="detail-numero">{{ factura.numero }}</h2>
        <p>Emisión: {{ factura.fecha_emision }}</p>
      </div>
      <span data-test="detail-estado" class="badge" :class="`badge--${factura.estado}`">
        {{ factura.estado }}
      </span>
    </header>

    <div class="detail__grid">
      <section>
        <h3>Emisor</h3>
        <p>{{ emisor.razon_social }} — {{ emisor.nit }}</p>
        <p>{{ emisor.direccion }}</p>
        <p>{{ emisor.telefono }} · {{ emisor.correo }}</p>
      </section>

      <section>
        <h3>Adquiriente</h3>
        <p data-test="detail-cliente">{{ adquiriente.nombre }}</p>
        <p>{{ adquiriente.tipo_documento }} {{ adquiriente.numero_documento }}</p>
        <p>{{ adquiriente.direccion }}</p>
        <p>{{ adquiriente.telefono }} · {{ adquiriente.correo }}</p>
      </section>

      <section>
        <h3>Bodega</h3>
        <p>{{ bodega.nombre }}</p>
        <p>Responsable: {{ bodega.responsable_nombre }}</p>
      </section>

      <section>
        <h3>Pago</h3>
        <p>{{ factura.forma_pago }} · {{ factura.medio_pago }}</p>
        <p v-if="factura.fecha_vencimiento">Vence: {{ factura.fecha_vencimiento }}</p>
        <p>{{ factura.moneda }}</p>
      </section>
    </div>

    <section class="detail__section">
      <h3>Detalle de productos</h3>
      <div class="detail__scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Descripción</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Dto.</th>
              <th>IVA</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="linea in factura.detalle ?? []" :key="linea.linea" data-test="detail-linea">
              <td>{{ linea.linea }}</td>
              <td>{{ linea.descripcion }}</td>
              <td>{{ linea.cantidad }}</td>
              <td>{{ money(linea.precio_unitario) }}</td>
              <td>{{ linea.descuento_porcentaje }}%</td>
              <td>{{ linea.iva_porcentaje }}%</td>
              <td>{{ money(linea.total_linea) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="detail__section">
      <h3>Totales</h3>
      <ul class="totales">
        <li>Subtotal: {{ money(totales.subtotal) }}</li>
        <li>Descuento: {{ money(totales.total_descuento) }}</li>
        <li>Base gravable: {{ money(totales.base_gravable) }}</li>
        <li>IVA: {{ money(totales.total_iva) }}</li>
        <li><strong>Total: {{ money(totales.total) }}</strong></li>
      </ul>
    </section>

    <section v-if="factura.observaciones" class="detail__section">
      <h3>Observaciones</h3>
      <p>{{ factura.observaciones }}</p>
    </section>

    <section v-if="electronica.cufe || electronica.qr" class="detail__section">
      <h3>Validación electrónica</h3>
      <p>CUFE: {{ electronica.cufe }}</p>
      <p>Fecha: {{ electronica.fecha_validacion }}</p>
    </section>

    <section class="detail__section">
      <h3>Software</h3>
      <p>{{ software.nombre }} v{{ software.version }} — {{ software.fabricante }}</p>
    </section>

    <section data-test="trazabilidad" class="detail__section">
      <h3>Trazabilidad</h3>
      <p>Creada por: {{ trazabilidad.creada_por }}</p>
      <p>Entrega: {{ trazabilidad.fecha_entrega || '—' }}</p>
      <p>Respuesta: {{ trazabilidad.fecha_respuesta || '—' }}</p>
      <p>Recepción: {{ trazabilidad.fecha_recepcion || '—' }}</p>
      <p v-if="trazabilidad.motivo_rechazo" data-test="motivo-rechazo">
        Motivo de rechazo: {{ trazabilidad.motivo_rechazo }}
      </p>
      <div v-if="trazabilidad.firma" class="firma">
        <p>Firma del cliente:</p>
        <img data-test="detail-firma" :src="trazabilidad.firma" alt="Firma del cliente" />
      </div>
    </section>
  </article>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 12px;
}

h2 {
  margin: 0;
  font-size: 1.4rem;
}

h3 {
  margin: 0 0 6px;
  font-size: 0.95rem;
  color: #374151;
}

p {
  margin: 2px 0;
  font-size: 0.9rem;
  color: #4b5563;
}

.detail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail__section {
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}

.detail__scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

th,
td {
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid #e5e7eb;
}

.totales {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  font-size: 0.9rem;
}

.badge {
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #e5e7eb;
  text-transform: capitalize;
}

.badge--entregada { background: #fef3c7; color: #92400e; }
.badge--aceptada { background: #dcfce7; color: #166534; }
.badge--rechazada { background: #fee2e2; color: #991b1b; }
.badge--cerrada { background: #dbeafe; color: #1e40af; }

.firma img {
  max-height: 90px;
  max-width: 260px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
}
</style>
