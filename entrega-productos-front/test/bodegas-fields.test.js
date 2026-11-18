import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('../src/api/bodegas', () => ({ default: api }))

import BodegasView from '../src/views/BodegasView.vue'
import { useAuthStore } from '../src/stores/auth'

const row = {
  id: 1,
  nombre: 'Bodega Central',
  direccion: 'Calle Principal 123',
  ciudad: 'Bogotá',
  telefono: '3001234567',
  recibe_nombre: 'María Rodríguez',
  recibe_documento: '1020304050',
  recibe_telefono: '3109876543',
  correo: 'bodega@entrega.com',
}

describe('Test 18 — Campos nuevos de Bodega', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    vi.clearAllMocks()
    api.list.mockResolvedValue({ data: [row], total: 1, page: 1, limit: 10 })
    api.create.mockResolvedValue({ id: 2, nombre: 'Bodega Norte' })
  })

  it('muestra las columnas sugeridas por el líder', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()

    const headers = wrapper.findAll('th').map((th) => th.text())
    expect(headers).toContain('Ciudad')
    expect(headers).toContain('Responsable')
    expect(headers).toContain('Teléfono')
    expect(wrapper.text()).toContain('Bogotá')
    expect(wrapper.text()).toContain('María Rodríguez')
  })

  it('el formulario incluye los campos del contrato definitivo', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    for (const key of [
      'nombre',
      'codigo',
      'direccion',
      'ciudad',
      'departamento',
      'telefono',
      'correo',
      'recibe_nombre',
      'recibe_documento',
      'recibe_cargo',
      'recibe_telefono',
    ]) {
      expect(wrapper.find(`[data-test="field-${key}"]`).exists()).toBe(true)
    }
  })

  it('rechaza un teléfono con letras', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    await wrapper.find('[data-test="field-nombre"]').setValue('Bodega Norte')
    await wrapper.find('[data-test="field-telefono"]').setValue('abc')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error"]').text()).toBe(
      'Usa entre 7 y 20 caracteres: dígitos, espacios, + o -.',
    )
    expect(api.create).not.toHaveBeenCalled()
  })

  it('rechaza un correo de la bodega inválido', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    await wrapper.find('[data-test="field-nombre"]').setValue('Bodega Norte')
    await wrapper.find('[data-test="field-correo"]').setValue('no-es-correo')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error"]').text()).toBe(
      'Correo de la bodega no tiene un formato válido.',
    )
  })

  it('limita el documento de quien recibe a 20 caracteres', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    await wrapper.find('[data-test="field-nombre"]').setValue('Bodega Norte')
    await wrapper
      .find('[data-test="field-recibe_documento"]')
      .setValue('123456789012345678901')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error"]').text()).toBe(
      'Documento de quien recibe no puede superar los 20 caracteres.',
    )
  })

  it('acepta un teléfono válido y guarda los campos opcionales', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    await wrapper.find('[data-test="field-nombre"]').setValue('Bodega Sur')
    await wrapper.find('[data-test="field-ciudad"]').setValue('Cali')
    await wrapper.find('[data-test="field-telefono"]').setValue('+57 300 123 4567')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith({
      nombre: 'Bodega Sur',
      ciudad: 'Cali',
      telefono: '+57 300 123 4567',
    })
  })
})
