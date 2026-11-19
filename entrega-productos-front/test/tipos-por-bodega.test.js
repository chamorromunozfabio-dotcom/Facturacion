import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const tiposApi = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
const bodegasApi = vi.hoisted(() => ({ list: vi.fn() }))

vi.mock('../src/api/tipos', () => ({ default: tiposApi }))
vi.mock('../src/api/bodegas', () => ({ default: bodegasApi }))

import FacturaForm from '../src/components/FacturaForm.vue'
import TiposView from '../src/views/TiposView.vue'
import { useAuthStore } from '../src/stores/auth'

const BODEGAS = [
  { id: 1, nombre: 'Bodega Central' },
  { id: 2, nombre: 'Bodega Norte' },
]
const TIPOS = [
  { id: 1, nombre: 'Arroz', bodega_id: 1, bodega_nombre: 'Bodega Central' },
  { id: 2, nombre: 'Aceite', bodega_id: 1, bodega_nombre: 'Bodega Central' },
  { id: 3, nombre: 'Limpieza', bodega_id: 2, bodega_nombre: 'Bodega Norte' },
]

async function opciones(wrapper, index = 0) {
  await wrapper.find(`[data-test="linea-tipo_id-${index}"]`).trigger('focus')
  return wrapper.findAll(`[data-test="linea-tipo_id-${index}-opcion"]`).map((op) => op.text())
}

describe('Test 45 — Tipos por bodega y buscador en facturas', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    bodegasApi.list.mockResolvedValue({
      data: BODEGAS,
      total: BODEGAS.length,
      page: 1,
      limit: 100,
    })
    tiposApi.list.mockResolvedValue({
      data: TIPOS,
      total: TIPOS.length,
      page: 1,
      limit: 10,
    })
    tiposApi.create.mockImplementation(async (payload) => ({ id: 9, ...payload }))
  })

  it('el bodeguero crea el tipo en su bodega sin tener que elegirla', async () => {
    useAuthStore().saveSession('token-123', {
      nombre: 'Luis',
      rol: 'bodeguero',
      permisos: [
        { nombre: 'tipos_view' },
        { nombre: 'tipos_create' },
        { nombre: 'tipos_edit' },
        { nombre: 'tipos_delete' },
      ],
    })
    bodegasApi.list.mockResolvedValue({
      data: [{ id: 7, nombre: 'Bodega de Luis' }],
      total: 1,
      page: 1,
      limit: 100,
    })
    const wrapper = mount(TiposView)
    await flushPromises()

    expect(wrapper.find('[data-test="bodega-filter"]').exists()).toBe(false)
    await wrapper.find('[data-test="create"]').trigger('click')
    expect(wrapper.find('[data-test="field-bodega_id"]').exists()).toBe(false)

    await wrapper.find('[data-test="field-nombre"]').setValue('Arroz')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(tiposApi.create).toHaveBeenCalledWith({ nombre: 'Arroz', bodega_id: 7 })
    expect(tiposApi.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10, bodega_id: 7 })
  })

  it('el admin elige la bodega y recarga solo los tipos de esa bodega', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    const wrapper = mount(TiposView)
    await flushPromises()

    expect(tiposApi.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })
    await wrapper.find('[data-test="bodega-filter"]').setValue('1')
    await flushPromises()
    expect(tiposApi.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10, bodega_id: 1 })

    await wrapper.find('[data-test="bodega-filter"]').setValue('2')
    await flushPromises()
    expect(tiposApi.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10, bodega_id: 2 })
  })

  it('el buscador filtra por nombre aunque haya muchos tipos y precarga la descripción', async () => {
    const muchos = [
      ...TIPOS,
      ...Array.from({ length: 40 }, (_, i) => ({
        id: 100 + i,
        nombre: `Producto ${i}`,
        bodega_id: 1,
      })),
    ]
    const wrapper = mount(FacturaForm, {
      props: {
        open: true,
        clientes: [{ id: 3, nombre: 'Juan' }],
        bodegas: BODEGAS,
        tipos: muchos,
      },
    })
    await wrapper.find('[data-test="field-bodega_id"]').setValue('1')

    await wrapper.find('[data-test="linea-tipo_id-0"]').setValue('arr')
    expect(await opciones(wrapper)).toEqual(['Arroz'])

    await wrapper.find('[data-test="linea-tipo_id-0-opcion"]').trigger('mousedown')
    expect(wrapper.find('[data-test="linea-descripcion-0"]').element.value).toBe('Arroz')
  })

  it('al cambiar de bodega se limpia el tipo elegido y aparecen otros productos', async () => {
    const wrapper = mount(FacturaForm, {
      props: {
        open: true,
        clientes: [{ id: 3, nombre: 'Juan' }],
        bodegas: BODEGAS,
        tipos: TIPOS,
      },
    })
    await wrapper.find('[data-test="field-bodega_id"]').setValue('1')
    await wrapper.find('[data-test="linea-tipo_id-0"]').setValue('1')
    expect(wrapper.find('[data-test="linea-descripcion-0"]').element.value).toBe('Arroz')
    expect(await opciones(wrapper)).not.toContain('Limpieza')

    await wrapper.find('[data-test="field-bodega_id"]').setValue('2')

    expect(wrapper.find('[data-test="linea-tipo_id-0"]').element.value).toBe('')
    expect(await opciones(wrapper)).toEqual(['Limpieza'])
  })

  it('los tipos generales se pueden usar en la factura junto a los de la bodega', async () => {
    const wrapper = mount(FacturaForm, {
      props: {
        open: true,
        clientes: [{ id: 3, nombre: 'Juan' }],
        bodegas: BODEGAS,
        tipos: [
          { id: 50, nombre: 'General' },
          ...TIPOS,
        ],
      },
    })
    await wrapper.find('[data-test="field-bodega_id"]').setValue('1')

    const visibles = await opciones(wrapper)
    expect(visibles).toContain('General')
    expect(visibles).toContain('Arroz')
    expect(visibles).not.toContain('Limpieza')
  })

  it('si el backend todavía no envía bodega_id, se muestran todos los tipos', async () => {
    const wrapper = mount(FacturaForm, {
      props: {
        open: true,
        clientes: [{ id: 3, nombre: 'Juan' }],
        bodegas: BODEGAS,
        tipos: [
          { id: 1, nombre: 'Alimentos' },
          { id: 2, nombre: 'Bebidas' },
        ],
      },
    })
    await wrapper.find('[data-test="field-bodega_id"]').setValue('1')

    expect(await opciones(wrapper)).toEqual(['Alimentos', 'Bebidas'])
  })
})
