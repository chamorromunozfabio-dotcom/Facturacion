<script setup>
import { computed } from "vue";
import { AlertCircle, RotateCcw } from "@lucide/vue";
import AlertMessage from "../../../shared/ui/AlertMessage.vue";
import BotonBase from "../../../shared/ui/BotonBase.vue";
import CampoNative from "../../../shared/ui/CampoNative.vue";
import StatCard from "../components/StatCard.vue";
import BarrasPorEstado from "../components/BarrasPorEstado.vue";
import SerieTiempo from "../components/SerieTiempo.vue";
import { useEstadisticas } from "../composables/useEstadisticas";

const {
  descripcion,
  contextoRol,
  desde,
  hasta,
  empresaId,
  bodegaId,
  bodegueroId,
  tipoId,
  estado,
  invalido,
  loading,
  error,
  tarjetas,
  filtrosDisponibles,
  desglosePrincipal,
  serieTemporal,
  alertasDetalle,
  barras,
  lineas,
  hayFiltrosActivos,
  sinDatos,
  cargar,
  aplicarPreset,
  limpiarFiltros,
} = useEstadisticas();

const maxTemporal = computed(() =>
  Math.max(
    1,
    ...serieTemporal.value.map(
      (punto) => Number(punto.completadas || 0) + Number(punto.rechazadas || 0),
    ),
  ),
);

const esRangoMensual = computed(() => {
  if (!desde.value || !hasta.value) return false;
  const dias = Math.round((new Date(hasta.value) - new Date(desde.value)) / 86400000) + 1;
  return dias > 62;
});

function etiquetaTemporal(fecha) {
  const texto = String(fecha ?? "");
  return esRangoMensual.value ? texto.slice(0, 7) : texto.slice(-2);
}

const columnasDesglose = computed(() => {
  if (!desglosePrincipal.value) return [];
  const primera = desglosePrincipal.value.filas?.[0];
  if (!primera)
    return desglosePrincipal.value.columnas.map((label, idx) => ({
      key: String(idx),
      label,
    }));
  const keys = Object.keys(primera);
  return desglosePrincipal.value.columnas.map((label, idx) => ({
    key: keys[idx] ?? String(idx),
    label,
  }));
});
</script>

<template>
  <section class="estadisticas-page">
    <header class="estadisticas-header">
      <div>
        <h1>Estadísticas</h1>
        <p class="subtitle">{{ descripcion }}</p>
      </div>
      <span class="rol-badge" data-test="rol-badge">{{
        contextoRol.badge
      }}</span>
    </header>

    <div class="filtros-bloque">
      <div class="presets" role="group" aria-label="Rangos rápidos">
        <button
          type="button"
          class="pill"
          data-test="preset-hoy"
          @click="aplicarPreset(0)"
        >
          Hoy
        </button>
        <button
          type="button"
          class="pill"
          data-test="preset-7"
          @click="aplicarPreset(6)"
        >
          7 días
        </button>
        <button
          type="button"
          class="pill"
          data-test="preset-30"
          @click="aplicarPreset(29)"
        >
          30 días
        </button>
      </div>

      <div class="filtros">
        <label>
          Desde
          <CampoNative v-model="desde" data-test="desde" type="date" />
        </label>
        <label>
          Hasta
          <CampoNative v-model="hasta" data-test="hasta" type="date" />
        </label>

        <label
          v-if="filtrosDisponibles.empresas.length"
          data-test="filtro-empresa-wrap"
        >
          Empresa
          <select v-model="empresaId" data-test="filtro-empresa">
            <option value="">Todas</option>
            <option
              v-for="item in filtrosDisponibles.empresas"
              :key="item.id"
              :value="item.id"
            >
              {{ item.razon_social || item.nombre }}
            </option>
          </select>
        </label>

        <label
          v-if="filtrosDisponibles.bodegas.length"
          data-test="filtro-bodega-wrap"
        >
          Bodega
          <select v-model="bodegaId" data-test="filtro-bodega">
            <option value="">Todas</option>
            <option
              v-for="item in filtrosDisponibles.bodegas"
              :key="item.id"
              :value="item.id"
            >
              {{ item.nombre }}
            </option>
          </select>
        </label>

        <label
          v-if="filtrosDisponibles.bodegueros.length"
          data-test="filtro-bodeguero-wrap"
        >
          Bodeguero
          <select v-model="bodegueroId" data-test="filtro-bodeguero">
            <option value="">Todos</option>
            <option
              v-for="item in filtrosDisponibles.bodegueros"
              :key="item.id"
              :value="item.id"
            >
              {{ item.nombre }}
            </option>
          </select>
        </label>

        <label
          v-if="filtrosDisponibles.tipos.length"
          data-test="filtro-tipo-wrap"
        >
          Tipo de producto
          <select v-model="tipoId" data-test="filtro-tipo">
            <option value="">Todos</option>
            <option
              v-for="item in filtrosDisponibles.tipos"
              :key="item.id"
              :value="item.id"
            >
              {{ item.nombre }}
            </option>
          </select>
        </label>

        <label
          v-if="filtrosDisponibles.estados.length"
          data-test="filtro-estado-wrap"
        >
          Estado
          <select v-model="estado" data-test="filtro-estado">
            <option value="">Todos</option>
            <option
              v-for="item in filtrosDisponibles.estados"
              :key="item.value ?? item"
              :value="item.value ?? item"
            >
              {{ item.label ?? item }}
            </option>
          </select>
        </label>

        <BotonBase
          type="button"
          data-test="recargar"
          :disabled="invalido || loading"
          @click="cargar"
        >
          {{ loading ? "Cargando..." : "Actualizar" }}
        </BotonBase>

        <button
          v-if="hayFiltrosActivos"
          type="button"
          class="btn-limpiar"
          data-test="limpiar-filtros"
          @click="limpiarFiltros"
        >
          <RotateCcw :size="14" aria-hidden="true" />
          Limpiar filtros
        </button>
      </div>
    </div>

    <p v-if="invalido" class="aviso" data-test="rango-invalido">
      La fecha “desde” no puede ser mayor que “hasta”.
    </p>

    <AlertMessage
      v-if="error"
      :message="error"
      type="error"
      @close="error = ''"
    />

    <template v-if="!invalido">
      <p v-if="sinDatos" class="aviso" data-test="sin-datos">
        No hay datos para el período seleccionado.
      </p>

      <div v-if="tarjetas.length" class="grid">
        <StatCard
          v-for="tarjeta in tarjetas"
          :key="tarjeta.clave"
          v-bind="tarjeta"
        />
      </div>

      <section
        v-if="desglosePrincipal?.filas?.length"
        class="panel"
        data-test="desglose-principal"
      >
        <h2>{{ desglosePrincipal.titulo }}</h2>
        <div class="tabla-wrap">
          <table class="tabla">
            <thead>
              <tr>
                <th v-for="col in columnasDesglose" :key="col.key">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(fila, idx) in desglosePrincipal.filas" :key="idx">
                <td v-for="col in columnasDesglose" :key="col.key">
                  {{ fila[col.key] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        v-if="serieTemporal.length"
        class="panel"
        data-test="serie-temporal"
      >
        <h2>{{ contextoRol.tendencia }}</h2>
        <div class="temporal">
          <div
            v-for="punto in serieTemporal"
            :key="punto.fecha"
            class="temporal__col"
          >
            <div class="temporal__barra-wrap">
              <div
                class="temporal__barra temporal__barra--ok"
                :style="{
                  height: `${Math.round((Number(punto.completadas || 0) / maxTemporal) * 100)}%`,
                }"
                :title="`Completadas: ${punto.completadas}`"
              ></div>
              <div
                v-if="Number(punto.rechazadas || 0) > 0"
                class="temporal__barra temporal__barra--err"
                :style="{
                  height: `${Math.round((Number(punto.rechazadas || 0) / maxTemporal) * 100)}%`,
                }"
                :title="`Rechazadas: ${punto.rechazadas}`"
              ></div>
            </div>
            <span class="temporal__fecha">{{
              etiquetaTemporal(punto.fecha)
            }}</span>
          </div>
        </div>
      </section>

      <section
        v-if="alertasDetalle.length"
        class="panel panel--alerta"
        data-test="alertas-detalle"
      >
        <h2>
          <AlertCircle :size="17" aria-hidden="true" />
          Últimos motivos de rechazo
        </h2>
        <ul class="alertas-lista">
          <li v-for="(alerta, idx) in alertasDetalle" :key="idx">
            <strong>{{ alerta.numero_factura }}</strong>
            <span>{{ alerta.motivo_rechazo }}</span>
            <small>{{ alerta.fecha }}</small>
          </li>
        </ul>
      </section>

      <div v-if="barras.length" class="series" data-test="series-barras">
        <BarrasPorEstado
          v-for="serie in barras"
          :key="serie.clave"
          :titulo="serie.titulo"
          :datos="serie.datos"
        />
      </div>

      <div
        v-if="lineas.length"
        class="series series--tiempo"
        data-test="series-linea"
      >
        <SerieTiempo
          v-for="serie in lineas"
          :key="serie.clave"
          :titulo="serie.titulo"
          :datos="serie.datos"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.estadisticas-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.rol-badge {
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 0.8rem;
  font-weight: 600;
}
h1 {
  margin: 0 0 6px;
  font-size: 1.6rem;
}
h2 {
  margin: 0 0 12px;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 6px;
}
.subtitle {
  margin: 0 0 18px;
  color: #6b7280;
}
.filtros-bloque {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pill {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.pill:hover {
  background: #f3f4f6;
}
.filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}
input,
select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff;
}
button:not(.pill):not(.btn-limpiar) {
  background: #2563eb;
  color: #fff;
  border: 0;
  border-radius: 8px;
  padding: 9px 16px;
  font-weight: 600;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-limpiar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  cursor: pointer;
}
.aviso {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  border-radius: 8px;
  padding: 10px;
  font-size: 0.85rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}
.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.panel--alerta {
  border-color: #fecaca;
  background: #fef2f2;
}
.tabla-wrap {
  overflow-x: auto;
}
.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.tabla th,
.tabla td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid #f3f4f6;
}
.tabla th {
  color: #6b7280;
  font-weight: 600;
  font-size: 0.8rem;
}
.temporal {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 120px;
  padding-top: 8px;
  overflow-x: auto;
}
.temporal__col {
  flex: 1 0 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
}
.temporal__barra-wrap {
  flex: 1;
  width: 100%;
  max-width: 22px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
  background: #f3f4f6;
  border-radius: 6px;
  overflow: hidden;
}
.temporal__barra--ok {
  background: #2563eb;
  width: 100%;
}
.temporal__barra--err {
  background: #ef4444;
  width: 100%;
}
.temporal__fecha {
  font-size: 0.72rem;
  color: #6b7280;
}
.alertas-lista {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.alertas-lista li {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  font-size: 0.88rem;
}
.alertas-lista small {
  color: #6b7280;
  margin-left: auto;
}
.series {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}
.series--tiempo {
  margin-top: 14px;
}
@media (max-width: 480px) {
  .filtros {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
