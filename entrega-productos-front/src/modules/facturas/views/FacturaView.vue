<script setup>
import { IonButton, IonList } from "@ionic/vue";
import {
  Check,
  Eye,
  FileDown,
  PackageCheck,
  Pencil,
  Trash2,
  Truck,
  X,
} from "@lucide/vue";
import AlertMessage from "../../../shared/ui/AlertMessage.vue";
import ConfirmDelete from "../../../shared/ui/ConfirmDelete.vue";
import DataTable from "../../../shared/ui/DataTable.vue";
import EmpresaSelect from "../../empresas/components/EmpresaSelect.vue";
import FacturaForm from "../components/FacturaForm.vue";
import FacturaDetailModal from "../components/FacturaDetailModal.vue";
import FacturaFiltros from "../components/FacturaFiltros.vue";
import FacturaFirmaModal from "../components/FacturaFirmaModal.vue";
import FacturaRechazoModal from "../components/FacturaRechazoModal.vue";
import StatusBadge from "../../../shared/ui/StatusBadge.vue";
import { useFacturas } from "../composables/useFacturas";

/** La vista solo arma la pantalla: la lógica vive en useFacturas. */
const {
  canCreate,
  canEdit,
  canDelete,
  canEntregar,
  canRecibir,
  canAceptar,
  canRechazar,
  canPdf,
  descripcion,
  estadoOptions,
  columns,
  esAdmin,
  esCliente,
  empresaId,
  empresaOpciones,
  filasVisibles,
  total,
  page,
  limit,
  q,
  estadoFilter,
  loading,
  alert,
  entregar,
  recibir,
  detailOpen,
  detalle,
  detailLoading,
  openDetail,
  closeDetail,
  firmaFactura,
  firmaOpen,
  firma,
  firmaError,
  firmaSaving,
  openAceptar,
  confirmarAceptar,
  closeFirma,
  rechazoFactura,
  rechazoOpen,
  motivo,
  rechazoError,
  rechazoSaving,
  openRechazar,
  confirmarRechazo,
  closeRechazo,
  descargar,
  catalogos,
  clienteQuery,
  formOpen,
  editingId,
  formModel,
  formErrors,
  saving,
  openCreate,
  openEdit,
  save,
  closeForm,
  confirmOpen,
  deleting,
  removing,
  askDelete,
  confirmDelete,
  closeConfirm,
} = useFacturas();
</script>

<template>
  <section class="facturas-page">
    <header class="facturas-page__header">
      <div>
        <h1>Facturas</h1>
        <p>{{ descripcion }}</p>
      </div>
      <span class="badge">Documentos</span>
    </header>

    <div class="alert-flotante" data-test="alert-flotante">
      <Transition name="alert">
        <AlertMessage
          v-if="alert"
          :type="alert.type"
          :message="alert.message"
          @close="alert = null"
        />
      </Transition>
    </div>

    <div class="facturas-page__bloque">
      <div class="facturas-page__filtros">
        <EmpresaSelect
          v-if="esAdmin"
          v-model="empresaId"
          :empresas="empresaOpciones"
        />
        <FacturaFiltros v-model="estadoFilter" :options="estadoOptions" />
      </div>

      <DataTable
        :columns="columns"
        :rows="filasVisibles"
        :total="total"
        :page="page"
        :limit="limit"
        :q="q"
        :loading="loading"
        create-label="Nueva factura"
        :can-create="canCreate"
        :can-edit="false"
        :can-delete="false"
        @update:q="q = $event"
        @update:page="page = $event"
        @create="openCreate"
      >
        <template #cell-estado="{ value }">
          <StatusBadge :estado="value" />
        </template>

        <template #actions="{ row }">
          <IonList lines="none" class="acciones">
            <IonButton
              data-test="ver"
              type="button"
              class="btn btn--small"
              @click="openDetail(row)"
            >
              <Eye :size="14" aria-hidden="true" /><span>Ver</span>
            </IonButton>
            <IonButton
              v-if="canEdit && row.estado === 'emitida'"
              data-test="edit"
              type="button"
              class="btn btn--small"
              @click="openEdit(row)"
              ><Pencil :size="14" aria-hidden="true" /><span
                >Editar</span
              ></IonButton
            >
            <IonButton
              v-if="canDelete && row.estado === 'emitida'"
              data-test="delete"
              type="button"
              class="btn btn--small btn--danger"
              @click="askDelete(row)"
              ><Trash2 :size="14" aria-hidden="true" /><span
                >Eliminar</span
              ></IonButton
            >
            <IonButton
              v-if="canEntregar && row.estado === 'emitida'"
              data-test="entregar"
              type="button"
              class="btn btn--small"
              @click="entregar(row)"
              ><Truck :size="14" aria-hidden="true" /><span
                >Entregar</span
              ></IonButton
            >
            <IonButton
              v-if="canAceptar && row.estado === 'entregada'"
              data-test="aceptar"
              type="button"
              class="btn btn--small btn--primary"
              @click="openAceptar(row)"
              ><Check :size="14" aria-hidden="true" /><span
                >Aceptar</span
              ></IonButton
            >
            <IonButton
              v-if="canRechazar && row.estado === 'entregada'"
              data-test="rechazar"
              type="button"
              class="btn btn--small btn--danger"
              @click="openRechazar(row)"
              ><X :size="14" aria-hidden="true" /><span
                >Rechazar</span
              ></IonButton
            >
            <IonButton
              v-if="canRecibir && row.estado === 'firmada'"
              data-test="recibir"
              type="button"
              class="btn btn--small"
              @click="recibir(row)"
              ><PackageCheck :size="14" aria-hidden="true" /><span
                >Recibir</span
              ></IonButton
            >
            <IonButton
              v-if="canPdf"
              data-test="pdf"
              type="button"
              class="btn btn--small"
              @click="descargar(row)"
              ><FileDown :size="14" aria-hidden="true" /><span
                >PDF</span
              ></IonButton
            >
          </IonList>
        </template>
      </DataTable>
    </div>

    <FacturaForm
      :open="formOpen"
      :titulo="editingId ? 'Editar factura' : 'Nueva factura'"
      :model-value="formModel"
      :clientes="catalogos.clientes"
      :cliente-query="clienteQuery"
      :bodegas="catalogos.bodegas"
      :tipos="catalogos.tipos"
      :submit-label="editingId ? 'Guardar cambios' : 'Crear factura'"
      :loading="saving"
      :server-errors="formErrors"
      @submit="save"
      @close="closeForm"
      @buscar-cliente="clienteQuery = $event"
    />

    <FacturaDetailModal
      :open="detailOpen"
      :loading="detailLoading"
      :factura="detalle"
      :mostrar-empresa="esAdmin || esCliente"
      @close="closeDetail"
    />

    <FacturaFirmaModal
      :open="firmaOpen"
      :factura="firmaFactura"
      v-model:firma="firma"
      :error="firmaError"
      :saving="firmaSaving"
      @close="closeFirma"
      @confirm="confirmarAceptar"
    />

    <FacturaRechazoModal
      :open="rechazoOpen"
      :factura="rechazoFactura"
      v-model:motivo="motivo"
      :error="rechazoError"
      :saving="rechazoSaving"
      @close="closeRechazo"
      @confirm="confirmarRechazo"
    />

    <ConfirmDelete
      :open="confirmOpen"
      title="Eliminar factura"
      message="La factura se eliminará de forma permanente. Esta acción no se puede deshacer."
      :item-label="deleting?.numero || ''"
      :loading="removing"
      @confirm="confirmDelete"
      @cancel="closeConfirm"
    />
  </section>
</template>

<style scoped>
.facturas-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.facturas-page__header {
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
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Sin IonCard: la vista conserva el aspecto del resto de los menús. */
.facturas-page__bloque {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.facturas-page__filtros {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* La alerta flota por encima de los modales (z-index 50). */
.alert-flotante {
  position: fixed;
  top: 16px;
  right: 16px;
  left: 16px;
  z-index: 100;
  max-width: 480px;
  margin-inline: auto;
  pointer-events: none;
}
.alert-flotante :deep(.alert) {
  pointer-events: auto;
  margin-bottom: 0;
  box-shadow: 0 10px 30px rgb(0 0 0 / 15%);
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
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}
.btn--danger {
  color: #b91c1c;
  border-color: #fca5a5;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* `border: 0` evita el doble marco: Ionic pinta el suyo en shadow DOM. */
ion-button.btn {
  border: 0;
  --background: #fff;
  --color: #374151;
  --border-color: #d1d5db;
  --border-width: 1px;
  --border-style: solid;
  --border-radius: 8px;
  --box-shadow: none;
  text-transform: none;
}

ion-button.btn--primary {
  --background: #4f46e5;
  --color: #fff;
  --border-color: #4f46e5;
}

ion-button.btn--danger {
  --color: #b91c1c;
  --border-color: #fca5a5;
}

.alert-enter-active,
.alert-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* En pantallas chicas el aviso va dentro del flujo y no tapa el menú. */
@media (max-width: 768px) {
  .alert-flotante {
    position: static;
    max-width: none;
    margin-inline: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .alert-enter-active,
  .alert-leave-active {
    transition: none;
  }
}
</style>
