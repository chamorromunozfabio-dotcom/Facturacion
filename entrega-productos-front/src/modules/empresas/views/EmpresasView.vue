<script setup>
import { computed } from 'vue'
import { Check, Eye, Pause, Play, ShieldX, Trash2 } from '@lucide/vue'
import AlertMessage from '../../../shared/ui/AlertMessage.vue'
import ConfirmDelete from '../../../shared/ui/ConfirmDelete.vue'
import DataTable from '../../../shared/ui/DataTable.vue'
import StatusBadge from '../../../shared/ui/StatusBadge.vue'
import EmpresaCreateModal from '../components/EmpresaCreateModal.vue'
import EmpresaDetalleModal from '../components/EmpresaDetalleModal.vue'
import EmpresaRechazoModal from '../components/EmpresaRechazoModal.vue'
import { useEmpresas } from '../composables/useEmpresas'

const {
  rows,
  total,
  page,
  limit,
  q,
  estado,
  estadoOptions,
  loading,
  alert,
  rechazoOpen,
  rechazoEmpresa,
  motivoRechazo,
  rechazoError,
  rechazoSaving,
  detalleOpen,
  detalleEmpresa,
  crearOpen,
  crearSaving,
  crearError,
  crearFieldErrors,
  confirmOpen,
  deleting,
  removing,
  aprobar,
  suspender,
  reactivar,
  abrirDetalle,
  closeDetalle,
  abrirCrear,
  closeCrear,
  crearEmpresa,
  askDelete,
  cancelDelete,
  confirmDelete,
  abrirRechazo,
  closeRechazo,
  confirmarRechazo,
} = useEmpresas()

const mensajeEliminar = computed(() => {
  if (!deleting.value) return ''
  const bodegueros = deleting.value.total_bodegueros ?? 0
  const bodegas = deleting.value.total_bodegas ?? 0
  return `Se eliminará "${deleting.value.razon_social}" junto con ${bodegueros} bodegueros y ${bodegas} bodegas. Esta acción no se puede deshacer.`
})

const columns = [
  { key: 'razon_social', label: 'Razón social' },
  { key: 'nit', label: 'NIT' },
  { key: 'correo', label: 'Correo' },
  { key: 'estado', label: 'Estado' },
  { key: 'total_bodegueros', label: 'Bodegueros' },
  { key: 'total_bodegas', label: 'Bodegas' },
  { key: 'total_facturas', label: 'Facturas' },
  { key: 'fecha_registro', label: 'Registro' },
]

function fecha(value) {
  if (!value) return '—'
  const fecha = new Date(value)
  if (Number.isNaN(fecha.getTime())) return String(value)
  return fecha.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <section class="empresas-page">
    <header class="empresas-page__header">
      <div>
        <h1>Empresas</h1>
        <p>Aprueba, rechaza o suspende las empresas que se registran en la plataforma.</p>
      </div>
      <span class="badge">Administración</span>
    </header>

    <AlertMessage
      v-if="alert"
      :type="alert.type"
      :message="alert.message"
      @close="alert = null"
    />

    <nav class="estado-tabs" aria-label="Filtrar empresas por estado">
      <button
        v-for="opcion in estadoOptions"
        :key="opcion.value"
        type="button"
        class="estado-tabs__btn"
        :class="{ activo: estado === opcion.value }"
        :data-test="`estado-${opcion.value || 'todas'}`"
        :aria-pressed="estado === opcion.value"
        @click="estado = opcion.value"
      >
        {{ opcion.label }}
      </button>
    </nav>

    <DataTable
      :columns="columns"
      :rows="rows"
      :total="total"
      :page="page"
      :limit="limit"
      :q="q"
      :loading="loading"
      create-label="Nueva empresa"
      :can-create="true"
      :can-edit="false"
      :can-delete="false"
      @update:q="q = $event"
      @update:page="page = $event"
      @create="abrirCrear"
    >
      <template #cell-estado="{ value }">
        <StatusBadge :estado="value" />
      </template>
      <template #cell-fecha_registro="{ value }">
        {{ fecha(value) }}
      </template>

      <template #actions="{ row }">
        <button
          type="button"
          class="btn btn--small"
          data-test="ver-detalle"
          @click="abrirDetalle(row)"
        >
          <Eye :size="14" aria-hidden="true" /><span>Ver</span>
        </button>
        <button
          v-if="row.estado === 'pendiente'"
          type="button"
          class="btn btn--small btn--primary"
          data-test="aprobar"
          @click="aprobar(row)"
        >
          <Check :size="14" aria-hidden="true" /><span>Aprobar</span>
        </button>
        <button
          v-if="row.estado === 'pendiente'"
          type="button"
          class="btn btn--small btn--danger"
          data-test="rechazar"
          @click="abrirRechazo(row)"
        >
          <ShieldX :size="14" aria-hidden="true" /><span>Rechazar</span>
        </button>
        <button
          v-if="row.estado === 'activa'"
          type="button"
          class="btn btn--small"
          data-test="suspender"
          @click="suspender(row)"
        >
          <Pause :size="14" aria-hidden="true" /><span>Suspender</span>
        </button>
        <button
          v-if="row.estado === 'suspendida' || row.estado === 'rechazada'"
          type="button"
          class="btn btn--small btn--primary"
          data-test="reactivar"
          @click="reactivar(row)"
        >
          <Play :size="14" aria-hidden="true" /><span>Reactivar</span>
        </button>
        <button
          v-if="(row.total_facturas ?? 0) === 0"
          type="button"
          class="btn btn--small btn--danger"
          data-test="eliminar-empresa"
          @click="askDelete(row)"
        >
          <Trash2 :size="14" aria-hidden="true" /><span>Eliminar</span>
        </button>
      </template>
    </DataTable>

    <EmpresaCreateModal
      :open="crearOpen"
      :saving="crearSaving"
      :error="crearError"
      :field-errors="crearFieldErrors"
      @close="closeCrear"
      @submit="crearEmpresa"
    />

    <EmpresaDetalleModal
      :open="detalleOpen"
      :empresa="detalleEmpresa"
      @close="closeDetalle"
      @aprobar="aprobar"
      @rechazar="abrirRechazo"
      @suspender="suspender"
      @reactivar="reactivar"
      @eliminar="askDelete"
    />

    <ConfirmDelete
      :open="confirmOpen"
      title="Eliminar empresa"
      :message="mensajeEliminar"
      :item-label="deleting?.razon_social || ''"
      :loading="removing"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <EmpresaRechazoModal
      :open="rechazoOpen"
      :empresa="rechazoEmpresa"
      v-model:motivo="motivoRechazo"
      :error="rechazoError"
      :saving="rechazoSaving"
      @close="closeRechazo"
      @confirm="confirmarRechazo"
    />
  </section>
</template>

<style scoped>
.empresas-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empresas-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.badge {
  background: #ccfbf1;
  color: #115e59;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

.estado-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.estado-tabs__btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 999px;
  padding: 7px 14px;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.estado-tabs__btn.activo {
  background: #0f766e;
  border-color: #0f766e;
  color: #fff;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn--small {
  padding: 5px 10px;
  font-size: 0.85rem;
}

.btn--primary {
  background: #0f766e;
  border-color: #0f766e;
  color: #fff;
}

.btn--danger {
  color: #b91c1c;
  border-color: #fca5a5;
}
</style>
