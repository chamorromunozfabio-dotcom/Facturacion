<script setup>
import { computed } from 'vue'
import {
  Check,
  KeyRound,
  ReceiptText,
  ShieldCheck,
  Tags,
  Users,
  Warehouse,
} from '@lucide/vue'
import AlertMessage from '../../../shared/ui/AlertMessage.vue'
import PermisosBuscador from '../components/PermisosBuscador.vue'
import PermisosCabecera from '../components/PermisosCabecera.vue'
import PermisosMatriz from '../components/PermisosMatriz.vue'
import PermisosConfirmacion from '../components/PermisosConfirmacion.vue'
import { usePermisos } from '../composables/usePermisos'
import { CATALOGO_PERMISOS } from '../../../shared/config/permissions'

const ICONOS_MODULO = {
  facturas: ReceiptText,
  bodegas: Warehouse,
  usuarios: Users,
  tipos: Tags,
  roles: ShieldCheck,
  permisos: KeyRound,
}

/** La vista es el director: trae los datos y conecta las cuatro piezas. */
const {
  busqueda,
  cargando,
  mensaje,
  usuarioSeleccionadoId,
  usuarioSeleccionado,
  rolDelUsuario,
  plantillaSeleccionada,
  coincidencias,
  resultados,
  modulosConPermisos,
  permisosVisibles,
  tieneCambios,
  resumenPermisos,
  faltanEnBackend,
  todosMarcados,
  opcionesCambiables,
  cambiosPendientes,
  guardando,
  seleccionarUsuario,
  cambiarUsuario,
  togglePermiso,
  aplicarRol,
  desmarcarTodos,
  toggleTodos,
  descartarCambios,
  confirmarCambios,
} = usePermisos()

const modulos = computed(() =>
  modulosConPermisos.value.map((modulo) => ({
    ...modulo,
    icono: ICONOS_MODULO[modulo.clave],
  })),
)
</script>

<template>
  <section class="permisos-page">
    <header class="hero">
      <span class="hero__icon"><ShieldCheck :size="26" aria-hidden="true" /></span>
      <div class="hero__text">
        <h1>Permisos por usuario</h1>
        <p>
          Buscá a una persona, revisá sus funciones y tildá lo que puede hacer. Los cambios se
          guardan cuando confirmes.
        </p>
      </div>
      <span class="hero__badge">Solo administrador</span>
    </header>

    <Transition name="alert">
      <AlertMessage
        v-if="mensaje"
        :type="mensaje.type"
        :message="mensaje.message"
        @close="mensaje = null"
      />
    </Transition>

    <PermisosBuscador
      v-model="busqueda"
      :cargando="cargando"
      :coincidencias="coincidencias"
      :resultados="resultados"
      :seleccionado-id="usuarioSeleccionadoId"
      @select="seleccionarUsuario"
    />

    <Transition name="panel">
      <section v-if="usuarioSeleccionado" class="card card--detalle" data-test="permisos-panel">
        <PermisosCabecera
          :usuario="usuarioSeleccionado"
          :rol="rolDelUsuario"
          :plantilla="plantillaSeleccionada"
          :activos="permisosVisibles.length"
          :total="CATALOGO_PERMISOS.length"
          :faltan="faltanEnBackend"
          @cambiar="cambiarUsuario"
        />

        <div class="paso paso--segundo">
          <span class="paso__numero">2</span>
          <div>
            <h3>Funciones permitidas</h3>
            <p>Tildá lo que {{ usuarioSeleccionado.nombre }} puede hacer en cada área.</p>
          </div>
        </div>

        <PermisosMatriz
          :modulos="modulos"
          :todos-marcados="todosMarcados"
          :guardando="guardando"
          :opciones-length="opcionesCambiables.length"
          @toggle="togglePermiso"
          @toggle-todos="toggleTodos"
          @aplicar-rol="aplicarRol"
          @desmarcar-todos="desmarcarTodos"
        />

        <PermisosConfirmacion
          :cambios="cambiosPendientes.size"
          :guardando="guardando"
          :usuario-nombre="usuarioSeleccionado.nombre"
          :activos="permisosVisibles.length"
          :total="CATALOGO_PERMISOS.length"
          :resumen="resumenPermisos"
          :tiene-cambios="tieneCambios"
          @descartar="descartarCambios"
          @confirmar="confirmarCambios"
        />
      </section>
    </Transition>
  </section>
</template>

<style scoped>
.permisos-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 22px 24px;
  border: 1px solid #ddd6fe;
  border-radius: 16px;
  background: linear-gradient(120deg, #eef2ff 0%, #f5f3ff 55%, #faf5ff 100%);
}

.hero__icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #4f46e5;
  color: #fff;
  box-shadow: 0 6px 16px rgb(79 70 229 / 25%);
}

.hero__text {
  flex: 1 1 320px;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
  color: #312e81;
  letter-spacing: -0.02em;
}

.hero p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

.hero__badge {
  background: #fff;
  border: 1px solid #ddd6fe;
  color: #5b21b6;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 2px 10px rgb(15 23 42 / 4%);
}

.card--detalle {
  border-color: #c7d2fe;
  box-shadow: 0 8px 26px rgb(79 70 229 / 8%);
}

.paso--segundo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
  margin-bottom: 14px;
}

.paso__numero {
  display: grid;
  place-items: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 700;
  font-size: 0.9rem;
}

h3 {
  margin: 0;
  font-size: 1rem;
  color: #1f2937;
}

.paso--segundo p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

.panel-enter-active,
.panel-leave-active,
.alert-enter-active,
.alert-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 640px) {
  .hero,
  .card {
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel-enter-active,
  .panel-leave-active,
  .alert-enter-active,
  .alert-leave-active {
    transition: none;
  }
}
</style>
