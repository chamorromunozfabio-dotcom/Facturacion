import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import { readFileSync } from 'node:fs'

import { useCrud } from '../src/composables/useCrud'
import { changedFields, errorMessage, paramsLista, quitarVacios } from '../src/utils/crud'
import { useAuthStore } from '../src/stores/auth'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

/** Sonda mínima para probar el esqueleto sin depender del markup de una vista. */
function crearProbe(config) {
  return defineComponent({
    setup() {
      return { ...useCrud(config) }
    },
    template: `
      <div>
        <button data-test="probe-create" @click="openCreate">nuevo</button>
        <button data-test="probe-editar" @click="openEdit(rows[0])">editar</button>
        <button data-test="probe-guardar" @click="save({ nombre: 'Nuevo' })">guardar</button>
        <button data-test="probe-borrar" @click="askDelete(rows[0])">borrar</button>
        <button data-test="probe-confirmar" @click="confirmDelete">confirmar</button>
        <span data-test="probe-filas">{{ rows.length }}</span>
        <span data-test="probe-total">{{ total }}</span>
        <span data-test="probe-alerta">{{ alert && alert.message }}</span>
        <span data-test="probe-modal">{{ modalOpen }}</span>
        <span data-test="probe-edicion">{{ editing && editing.id }}</span>
        <span data-test="probe-form">{{ form.nombre }}</span>
      </div>
    `,
  })
}

const mensajes = {
  creado: (clean) => `Creado: ${clean.nombre}.`,
  actualizado: 'Actualizado.',
  eliminado: 'Eliminado.',
  sinCambios: 'Sin cambios.',
  fallbackGuardar: 'No se pudo guardar.',
}

describe('Test 56 — CRUD compartido: utilidades, composable y vistas delegadas', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    vi.clearAllMocks()
  })

  it('las reglas puras van en utils/crud.js', () => {
    expect(changedFields({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual({ b: 2 })

    const normalizar = (key, valor) => (key === 'bodega_id' ? String(valor ?? '') : valor)
    expect(changedFields({ bodega_id: '1' }, { bodega_id: 1 }, normalizar)).toEqual({})

    expect(quitarVacios({ a: 'x', b: '', c: null, d: 0 })).toEqual({ a: 'x', d: 0 })
    expect(paramsLista({ q: 'pan', page: 2, limit: 5, extra: { rol: 'cliente' } })).toEqual({
      q: 'pan',
      page: 2,
      limit: 5,
      rol: 'cliente',
    })

    const duplicado = { response: { status: 409, data: { detail: 'Ya existe' } } }
    expect(errorMessage(duplicado, 'Fallback', 'Valor duplicado.')).toBe('Valor duplicado.')
    expect(errorMessage(new Error('sin conexión'), 'Fallback', 'Valor duplicado.')).toBe(
      'sin conexión',
    )
  })

  it('useCrud hace carga, alta, edición y baja con una sola implementación', async () => {
    const api = {
      list: vi.fn().mockResolvedValue({ data: [{ id: 1, nombre: 'Uno' }], total: 1 }),
      create: vi.fn().mockResolvedValue({ id: 2, nombre: 'Nuevo' }),
      update: vi.fn().mockResolvedValue({ id: 1, nombre: 'Nuevo' }),
      remove: vi.fn().mockResolvedValue({ detail: 'OK' }),
    }
    const wrapper = mount(
      crearProbe({
        modulo: 'roles',
        api,
        columns: [],
        fields: [],
        createLabel: 'Nuevo rol',
        emptyForm: () => ({ nombre: '' }),
        formFromRow: (row) => ({ nombre: row.nombre }),
        mensajes,
      }),
    )
    await flushPromises()

    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })
    expect(wrapper.find('[data-test="probe-filas"]').text()).toBe('1')
    expect(wrapper.find('[data-test="probe-total"]').text()).toBe('1')

    await wrapper.find('[data-test="probe-create"]').trigger('click')
    expect(wrapper.find('[data-test="probe-modal"]').text()).toBe('true')
    expect(wrapper.find('[data-test="probe-form"]').text()).toBe('')

    await wrapper.find('[data-test="probe-guardar"]').trigger('click')
    await flushPromises()
    expect(api.create).toHaveBeenCalledWith({ nombre: 'Nuevo' })
    expect(wrapper.find('[data-test="probe-filas"]').text()).toBe('2')
    expect(wrapper.find('[data-test="probe-alerta"]').text()).toContain('Creado: Nuevo.')
    expect(wrapper.find('[data-test="probe-modal"]').text()).toBe('false')

    await wrapper.find('[data-test="probe-borrar"]').trigger('click')
    await wrapper.find('[data-test="probe-confirmar"]').trigger('click')
    await flushPromises()
    // La fila nueva quedó primero, así que se borra su id (2).
    expect(api.remove).toHaveBeenCalledWith(2)
    expect(wrapper.find('[data-test="probe-filas"]').text()).toBe('1')
    expect(wrapper.find('[data-test="probe-alerta"]').text()).toContain('Eliminado.')
  })

  it('respeta los ganchos de cada módulo y no actualiza si no hay cambios', async () => {
    const guardoDespues = vi.fn()
    const api = {
      list: vi.fn().mockResolvedValue({ data: [{ id: 1, nombre: 'Uno' }], total: 1 }),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: 1, nombre: 'NUEVO' }),
      remove: vi.fn(),
    }
    const wrapper = mount(
      crearProbe({
        modulo: 'tipos',
        api,
        columns: [],
        fields: [],
        createLabel: 'Nuevo producto',
        emptyForm: () => ({ nombre: '' }),
        formFromRow: (row) => ({ nombre: row.nombre }),
        cleanPayload: (payload) => ({ ...payload, nombre: payload.nombre.trim().toUpperCase() }),
        paramsExtra: () => ({ bodega_id: 7 }),
        duplicateMessage: 'Ya existe en esta bodega.',
        mensajes,
        despuesDeGuardar: guardoDespues,
      }),
    )
    await flushPromises()
    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10, bodega_id: 7 })

    await wrapper.find('[data-test="probe-editar"]').trigger('click')
    await wrapper.find('[data-test="probe-guardar"]').trigger('click')
    await flushPromises()
    expect(api.update).toHaveBeenCalledWith(1, { nombre: 'NUEVO' })
    expect(guardoDespues).toHaveBeenCalledWith({ nombre: 'NUEVO' })

    await wrapper.find('[data-test="probe-editar"]').trigger('click')
    api.update.mockClear()
    await wrapper.find('[data-test="probe-guardar"]').trigger('click')
    await flushPromises()
    expect(api.update).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="probe-alerta"]').text()).toContain('Sin cambios.')
  })

  it('las cuatro vistas delegan y conservan sus reglas particulares', () => {
    const vistas = ['RolesView', 'BodegasView', 'TiposView', 'UsuariosView']
    const repetidos = [
      'let searchTimer',
      'const rows = ref([])',
      'const modalOpen = ref(false)',
      'watch(page, () => load())',
      'async function confirmDelete()',
    ]

    for (const nombre of vistas) {
      const codigo = leer(`../src/views/${nombre}.vue`)
      expect(codigo).toContain('useCrud')
      for (const fragmento of repetidos) expect(codigo).not.toContain(fragmento)
      expect(codigo.split('\n').length).toBeLessThan(330)
    }

    expect(leer('../src/views/BodegasView.vue')).toContain('loadBodegueros')
    expect(leer('../src/views/TiposView.vue')).toContain('data-test="bodega-filter"')
    expect(leer('../src/views/UsuariosView.vue')).toContain('data-test="role-filter"')
    expect(leer('../src/views/RolesView.vue')).toContain('cell-estado')

    const composable = leer('../src/composables/useCrud.js')
    for (const fragmento of [
      'async function load()',
      'async function save(payload)',
      'async function confirmDelete()',
      'watch(page, () => load())',
      'setTimeout(',
    ]) {
      expect(composable).toContain(fragmento)
    }

    const mapa = leer('../src/ARQUITECTURA.md')
    expect(mapa).toContain('useCrud.js')
    expect(mapa).toContain('crud.js')
  })
})
