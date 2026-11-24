import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }))
vi.mock('../src/modules/catalogos/api/bodegas', () => ({ default: api }))

import BodegasView from '../src/modules/catalogos/views/BodegasView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

const completo = {
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

const claves = Object.keys(completo)

async function abrir() {
  const wrapper = mount(BodegasView)
  await flushPromises()
  await wrapper.find('[data-test="create"]').trigger('click')
  return wrapper
}

async function llenar(wrapper, valores = completo) {
  for (const [key, value] of Object.entries(valores)) {
    await wrapper.find(`[data-test="field-${key}"]`).setValue(value)
  }
}

describe('Test 39 — Bodegas con todos los datos obligatorios', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    vi.clearAllMocks()
    api.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
    api.create.mockResolvedValue({ id: 9, ...completo })
  })

  it('muestra un aviso corto por cada dato que falta, sin resumen general', async () => {
    const wrapper = await abrir()

    await wrapper.find('form').trigger('submit')

    for (const key of claves) {
      expect(wrapper.find(`[data-test="error-${key}"]`).exists()).toBe(true)
      expect(wrapper.find(`[data-test="error-${key}"]`).text().length).toBeLessThan(50)
    }
    expect(wrapper.text()).not.toContain('Completa los campos obligatorios')
    expect(api.create).not.toHaveBeenCalled()
  })

  it('quita el aviso en cuanto se empieza a llenar el campo', async () => {
    const wrapper = await abrir()
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('[data-test="error-codigo"]').exists()).toBe(true)

    await wrapper.find('[data-test="field-codigo"]').setValue('BN-01')

    expect(wrapper.find('[data-test="error-codigo"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="error-direccion"]').exists()).toBe(true)
  })

  it('acepta los 11 datos y envía el código en mayúsculas', async () => {
    const wrapper = await abrir()
    await llenar(wrapper, { ...completo, codigo: 'bn-01' })

    await wrapper.find('form').trigger('submit')

    expect(api.create).toHaveBeenCalledWith(completo)
  })

  it('valida el tipo de correo y corta el largo del cargo al escribir', async () => {
    const wrapper = await abrir()
    await llenar(wrapper, {
      ...completo,
      correo: 'correo-invalido',
      recibe_cargo: 'x'.repeat(101),
    })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-correo"]').text()).toBe(
      'Escribe un correo válido, como nombre@empresa.com.',
    )
    // Los 101 caracteres se cortaron a 100 al escribir: no queda error por largo.
    expect(wrapper.find('[data-test="field-recibe_cargo"]').element.value).toHaveLength(100)
    expect(wrapper.find('[data-test="error-recibe_cargo"]').exists()).toBe(false)
  })

  it('no borra datos al editar: envía el campo con texto vacío para que el backend avise', async () => {
    api.list.mockResolvedValue({ data: [{ id: 9, ...completo }], total: 1, page: 1, limit: 10 })
    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="edit"]').trigger('click')

    await wrapper.find('[data-test="field-telefono"]').setValue('')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-telefono"]').text()).toBe('Escribe teléfono.')
    expect(api.update).not.toHaveBeenCalled()
  })
})
