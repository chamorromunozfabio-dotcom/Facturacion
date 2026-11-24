import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('../src/modules/catalogos/api/bodegas', () => ({ default: api }))

import BodegasView from '../src/modules/catalogos/views/BodegasView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

const row = {
  id: 1,
  nombre: 'Bodega Central',
  codigo: 'BC-01',
  direccion: 'Calle Principal 123',
  ciudad: 'Bogotá',
  departamento: 'Cundinamarca',
  telefono: '3001234567',
  correo: 'bodega@entrega.com',
  recibe_nombre: 'María Rodríguez',
  recibe_documento: '1020304050',
  recibe_cargo: 'Jefe de bodega',
  recibe_telefono: '3109876543',
}

const datos = {
  nombre: 'Bodega Norte',
  codigo: 'BN-01',
  direccion: 'Carrera 10 20',
  ciudad: 'Bogotá',
  departamento: 'Cundinamarca',
  telefono: '3001234567',
  correo: 'norte@entrega.com',
  recibe_nombre: 'Carlos Pérez',
  recibe_documento: '1020304051',
  recibe_cargo: 'Jefe de bodega',
  recibe_telefono: '3109876544',
}

async function llenar(wrapper, valores = datos) {
  for (const [key, value] of Object.entries(valores)) {
    await wrapper.find(`[data-test="field-${key}"]`).setValue(value)
  }
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

  it('rechaza un teléfono con letras con un aviso junto al campo', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    await llenar(wrapper, { ...datos, telefono: 'abc' })
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-telefono"]').text()).toBe(
      'Usa entre 7 y 20 caracteres: dígitos, espacios, + o -.',
    )
    expect(api.create).not.toHaveBeenCalled()
  })

  it('rechaza un correo de la bodega inválido', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    await llenar(wrapper, { ...datos, correo: 'no-es-correo' })
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-correo"]').text()).toBe('Dato no válido.')
  })

  it('limita el documento de quien recibe a 30 caracteres', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    await llenar(wrapper, {
      ...datos,
      recibe_documento: '1234567890123456789012345678901',
    })
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-recibe_documento"]').text()).toBe(
      'Máximo 30 caracteres.',
    )
  })

  it('envía los 11 datos obligatorios', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    await llenar(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith(datos)
  })
})
