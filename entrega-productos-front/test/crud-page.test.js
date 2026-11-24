import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { readFileSync } from 'node:fs'

import AlertMessage from '../src/shared/ui/AlertMessage.vue'
import ConfirmDelete from '../src/shared/ui/ConfirmDelete.vue'
import CrudPage from '../src/shared/ui/CrudPage.vue'
import DataTable from '../src/shared/ui/DataTable.vue'
import FormModal from '../src/shared/ui/FormModal.vue'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

function vistaConSlots() {
  return defineComponent({
    components: { CrudPage },
    setup() {
      return { fila: { id: 1, nombre: 'Pan', estado: true } }
    },
    template: `
      <CrudPage
        titulo="Productos"
        descripcion="Listado compartido"
        badge="Catálogo"
        :alert="{ type: 'success', message: 'Guardado.' }"
        :columns="[{ key: 'nombre', label: 'Nombre' }, { key: 'estado', label: 'Estado' }]"
        :rows="[fila]"
        create-label="Nuevo producto"
        crear-titulo="Nuevo producto"
        editar-titulo="Editar producto"
        crear-submit-label="Crear producto"
        confirm-titulo="Eliminar producto"
        confirm-mensaje="No se puede deshacer."
        :deleting="fila"
        @update:q="sin('q', $event)"
        @update:page="sin('page', $event)"
        @create="sin('create')"
        @edit="sin('edit', $event)"
        @delete="sin('delete', $event)"
        @update:model-value="sin('form', $event)"
        @submit="sin('submit', $event)"
        @close-modal="sin('close-modal')"
        @confirm="sin('confirm')"
        @cancel="sin('cancel')"
        @close-alert="sin('close-alert')"
      >
        <template #notice><p class="aviso">Aviso propio</p></template>
        <template #filter><input data-test="filtro-propio" /></template>
        <template #cell-estado="{ value }"><b data-test="celda-estado">{{ value ? 'Activo' : 'Inactivo' }}</b></template>
      </CrudPage>
    `,
    methods: {
      sin(nombre, valor) {
        this.$emit(nombre, valor)
      },
    },
  })
}

const eventos = (wrapper, nombre) => (wrapper.emitted(nombre) ?? []).map((args) => args[0])

describe('Test 57 — CrudPage: plantilla y eventos compartidos', () => {
  it('renderiza cabecera, alerta, tabla, modal y confirmación desde props', () => {
    const wrapper = mount(CrudPage, {
      props: {
        titulo: 'Roles',
        descripcion: 'Crea roles.',
        badge: 'Accesos',
        alert: { type: 'success', message: 'Rol creado.' },
        columns: [{ key: 'nombre', label: 'Nombre' }],
        rows: [{ id: 1, nombre: 'admin' }],
        createLabel: 'Nuevo rol',
        modalOpen: true,
        confirmOpen: true,
        fields: [{ key: 'nombre', label: 'Nombre' }],
        form: { nombre: 'admin' },
        crearTitulo: 'Nuevo rol',
        editarTitulo: 'Editar rol',
        crearSubmitLabel: 'Crear rol',
        confirmTitulo: 'Eliminar rol',
        confirmMensaje: 'No se puede deshacer.',
        deleting: { nombre: 'admin' },
      },
    })

    expect(wrapper.find('h1').text()).toBe('Roles')
    expect(wrapper.text()).toContain('Crea roles.')
    expect(wrapper.find('.badge').text()).toBe('Accesos')
    expect(wrapper.find('[role="alert"]').text()).toContain('Rol creado.')
    expect(wrapper.find('[data-test="create"]').text()).toContain('Nuevo rol')
    expect(wrapper.find('[data-test="search"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-nombre"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Eliminar rol')
    expect(wrapper.text()).toContain('No se puede deshacer.')
    expect(wrapper.find('[data-test="modal"]').exists()).toBe(true)
  })

  it('reenvía los eventos con sus argumentos', async () => {
    const wrapper = mount(vistaConSlots())
    const payload = { nombre: 'Leche' }
    const fila = { id: 2, nombre: 'Leche' }

    await wrapper.findComponent(DataTable).vm.$emit('update:q', 'leche')
    await wrapper.findComponent(DataTable).vm.$emit('update:page', 3)
    await wrapper.findComponent(DataTable).vm.$emit('create')
    await wrapper.findComponent(DataTable).vm.$emit('edit', fila)
    await wrapper.findComponent(DataTable).vm.$emit('delete', fila)
    await wrapper.findComponent(FormModal).vm.$emit('update:model-value', payload)
    await wrapper.findComponent(FormModal).vm.$emit('submit', payload)
    await wrapper.findComponent(FormModal).vm.$emit('close')
    await wrapper.findComponent(ConfirmDelete).vm.$emit('confirm')
    await wrapper.findComponent(ConfirmDelete).vm.$emit('cancel')
    await wrapper.findComponent(AlertMessage).vm.$emit('close')

    expect(eventos(wrapper, 'q')).toEqual(['leche'])
    expect(eventos(wrapper, 'page')).toEqual([3])
    expect(wrapper.emitted('create')).toHaveLength(1)
    expect(eventos(wrapper, 'edit')).toEqual([fila])
    expect(eventos(wrapper, 'delete')).toEqual([fila])
    expect(eventos(wrapper, 'form')).toEqual([payload])
    expect(eventos(wrapper, 'submit')).toEqual([payload])
    expect(wrapper.emitted('close-modal')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('close-alert')).toHaveLength(1)
  })

  it('reenvía notice, filter y los slots de celda', () => {
    const wrapper = mount(vistaConSlots())

    expect(wrapper.find('.aviso').text()).toBe('Aviso propio')
    expect(wrapper.find('[data-test="filtro-propio"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="celda-estado"]').text()).toBe('Activo')
    expect(wrapper.findAll('td')[1].text()).toBe('Activo')
  })

  it('las cuatro vistas delegan la plantilla y conservan sus particularidades', () => {
    const vistas = ['RolesView', 'BodegasView', 'TiposView', 'UsuariosView']
    for (const nombre of vistas) {
      const codigo = leer(`../src/modules/catalogos/views/${nombre}.vue`)
      expect(codigo).toContain('CrudPage')
      for (const viejo of [
        'AlertMessage',
        'ConfirmDelete',
        'DataTable',
        'FormModal',
        '<section class="crud-page">',
        '.crud-page {',
      ]) {
        expect(codigo).not.toContain(viejo)
      }
      expect(codigo.split('\n').length).toBeLessThan(270)
    }

    const pagina = leer('../src/shared/ui/CrudPage.vue')
    for (const fragmento of [
      '<slot name="notice" />',
      '<slot name="filter" />',
      'tableSlots',
      "emit('submit', $event)",
      '<Transition name="alert">',
      '.crud-page {',
    ]) {
      expect(pagina).toContain(fragmento)
    }

    expect(leer('../src/modules/catalogos/views/RolesView.vue')).toContain('#cell-estado')
    expect(leer('../src/modules/catalogos/views/BodegasView.vue')).toContain(
      'descripcion="Administra las bodegas y sus datos de contacto."',
    )
    expect(leer('../src/modules/catalogos/views/TiposView.vue')).toContain('data-test="bodega-filter"')
    expect(leer('../src/modules/catalogos/views/UsuariosView.vue')).toContain('data-test="role-filter"')

    // Solo queda la descripción bajo el título: sin carteles explicativos extra.
    const avisosViejos = [
      'Cada bodega tiene su catálogo',
      'Estás viendo los productos de tu bodega',
      'Puedes asignar el bodeguero dueño',
      'Solo ves y gestionas las bodegas',
      'Estás viendo solo usuarios con rol',
    ]
    for (const nombre of vistas) {
      const codigo = leer(`../src/modules/catalogos/views/${nombre}.vue`)
      expect(codigo).toContain('descripcion="')
      expect(codigo).not.toContain('class="notice"')
      for (const aviso of avisosViejos) expect(codigo).not.toContain(aviso)
    }

    const mapa = leer('../src/ARQUITECTURA.md')
    expect(mapa).toContain('CrudPage.vue')
  })
})
