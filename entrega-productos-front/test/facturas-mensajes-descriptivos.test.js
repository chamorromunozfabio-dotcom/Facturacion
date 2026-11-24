import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  entregar: vi.fn(),
  aceptar: vi.fn(),
  rechazar: vi.fn(),
  recibir: vi.fn(),
  descargarPdf: vi.fn(),
}))

vi.mock('../src/modules/facturas/api/facturas', async () => {
  const actual = await vi.importActual('../src/modules/facturas/api/facturas')
  return { ...actual, default: api }
})
vi.mock('../src/modules/catalogos/api/usuarios', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/modules/catalogos/api/bodegas', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/modules/catalogos/api/tipos', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/shared/api/axios', () => ({
  default: {},
  getErrorMessage: vi.fn((error) => error?.message || 'Error'),
  isDuplicateError: vi.fn(() => false),
}))

import FacturaForm from '../src/modules/facturas/components/FacturaForm.vue'
import FacturaView from '../src/modules/facturas/views/FacturaView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

const mountForm = () =>
  mount(FacturaForm, {
    props: {
      open: true,
      clientes: [{ id: 3, nombre: 'Juan Pérez' }],
      bodegas: [{ id: 1, nombre: 'Bodega Central' }],
      tipos: [{ id: 5, nombre: 'Alimentos' }],
    },
  })

async function completarFormulario(wrapper) {
  await wrapper.find('[data-test="field-cliente_id"]').setValue('3')
  await wrapper.find('[data-test="field-bodega_id"]').setValue('1')
  await wrapper.find('[data-test="field-forma_pago"]').setValue('credito')
  await wrapper.find('[data-test="field-medio_pago"]').setValue('efectivo')
  await wrapper.find('[data-test="field-fecha_vencimiento"]').setValue('2026-12-31')
  await wrapper.find('[data-test="linea-tipo_id-0"]').setValue('5')
  await wrapper.find('[data-test="linea-descripcion-0"]').setValue('Arroz 500 g')
  await wrapper.find('[data-test="linea-unidad_medida-0"]').setValue('UND')
  await wrapper.find('[data-test="linea-cantidad-0"]').setValue('10')
  await wrapper.find('[data-test="linea-precio_unitario-0"]').setValue('3500')
  await wrapper.find('[data-test="linea-descuento_porcentaje-0"]').setValue('0')
  await wrapper.find('[data-test="linea-iva_porcentaje-0"]').setValue('19')
}

describe('Test 37 — Facturas: mensajes descriptivos y alerta visible', () => {
  it('muestra un aviso corto junto a cada dato que falta en la cabecera', async () => {
    const wrapper = mountForm()

    expect(wrapper.find('[data-test="field-fecha_vencimiento"]').exists()).toBe(false)

    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-cliente_id"]').text()).toBe('Elige el cliente.')
    expect(wrapper.find('[data-test="error-bodega_id"]').text()).toBe('Elige la bodega.')
    expect(wrapper.find('[data-test="error-forma_pago"]').text()).toBe('Elige la forma de pago.')
    expect(wrapper.find('[data-test="error-medio_pago"]').text()).toBe('Elige el medio de pago.')
    expect(wrapper.find('[data-test="form-error"]').exists()).toBe(false)
  })

  it('muestra un aviso corto en cada campo del producto', async () => {
    const wrapper = mountForm()

    await wrapper.find('form').trigger('submit')

    const mensajes = {
      tipo: 'Elige el producto.',
      descripcion: 'Escribe la descripción.',
      unidad_medida: 'Escribe la unidad.',
      cantidad: 'Escribe la cantidad.',
      precio_unitario: 'Escribe el precio.',
      descuento_porcentaje: 'Escribe el descuento.',
      iva_porcentaje: 'Elige el IVA.',
    }

    for (const [campo, mensaje] of Object.entries(mensajes)) {
      const texto = wrapper.find(`[data-test="error-linea-0-${campo}"]`).text()
      expect(texto).toBe(mensaje)
      expect(texto.length).toBeLessThan(30)
    }
  })

  it('el mensaje cambia si el dato está escrito pero es inválido', async () => {
    const wrapper = mountForm()

    await wrapper.find('[data-test="linea-cantidad-0"]').setValue('0')
    await wrapper.find('[data-test="linea-precio_unitario-0"]').setValue('-5')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-linea-0-cantidad"]').text()).toBe('Cantidad mayor que 0.')
    expect(wrapper.find('[data-test="error-linea-0-precio_unitario"]').text()).toBe(
      'Precio mayor o igual que 0.',
    )
  })

  it('limpia el aviso en cuanto el campo se llena correctamente', async () => {
    const wrapper = mountForm()

    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('[data-test="error-cliente_id"]').exists()).toBe(true)

    await wrapper.find('[data-test="field-cliente_id"]').setValue('3')
    expect(wrapper.find('[data-test="error-cliente_id"]').exists()).toBe(false)
  })

  it('permite guardar con observaciones vacía porque es el único dato opcional', async () => {
    const wrapper = mountForm()

    await completarFormulario(wrapper)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="form-error"]').exists()).toBe(false)
    const payload = wrapper.emitted('submit')[0][0]
    expect(payload.observaciones).toBeNull()
    expect(payload.detalle[0].unidad_medida).toBe('UND')
  })

  it('muestra la alerta flotante por encima del modal', async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    api.list.mockRejectedValue(new Error('Fallo de red'))

    const wrapper = mount(FacturaView)
    await flushPromises()

    const flotante = wrapper.find('[data-test="alert-flotante"]')
    expect(flotante.exists()).toBe(true)
    expect(flotante.find('[role="alert"]').text()).toContain('Fallo de red')

    const codigo = readFileSync(resolve(process.cwd(), 'src/modules/facturas/views/FacturaView.vue'), 'utf8')
    expect(codigo).toContain('alert-flotante')
    expect(codigo).toContain('z-index: 100')
  })
})
