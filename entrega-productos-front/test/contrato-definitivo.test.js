import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const FIRMA = 'data:image/png;base64,YWJj'

const bodegas = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

const usuarios = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('../src/api/bodegas', () => ({ default: bodegas }))
vi.mock('../src/api/usuarios', () => ({ default: usuarios }))

import { resolveApiModes } from '../src/config/apiModes'
import facturasApi from '../src/api/facturas'
import BodegasView from '../src/views/BodegasView.vue'
import UsuariosView from '../src/views/UsuariosView.vue'
import StatusBadge from '../src/components/StatusBadge.vue'
import { useAuthStore } from '../src/stores/auth'

describe('Test 33 — Contrato definitivo del backend', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    bodegas.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
    usuarios.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
    bodegas.create.mockResolvedValue({ id: 2, nombre: 'Bodega Sur' })
    usuarios.create.mockResolvedValue({ id: 4, nombre: 'Nuevo' })
  })

  it('la API real de facturas ya no necesita mocks', () => {
    expect(resolveApiModes({ VITE_USE_MOCKS: 'false', VITE_FACTURAS_MOCKS: 'false' })).toEqual({
      authMocks: false,
      catalogsMocks: false,
      facturasMocks: false,
    })
  })

  it('usa los estados definitivos emitida, firmada y recibida', async () => {
    expect((await facturasApi.entregar(2)).estado).toBe('entregada')
    expect((await facturasApi.aceptar(3, FIRMA)).estado).toBe('firmada')
    expect((await facturasApi.rechazar(4, 'Cantidad incorrecta')).estado).toBe('rechazada')
    expect((await facturasApi.recibir(5)).estado).toBe('recibida')

    for (const estado of ['emitida', 'entregada', 'firmada', 'rechazada', 'recibida']) {
      const badge = mount(StatusBadge, { props: { estado } })
      expect(badge.classes()).toContain(`status-badge--${estado}`)
      expect(badge.text()).toBe(estado)
    }
  })

  it('usa el formato de número FE-0001 y el PDF con ese nombre', async () => {
    const listado = await facturasApi.list({ q: 'FE-0001', page: 1, limit: 10 })
    expect(listado.data[0].numero).toBe('FE-0001')
    expect(await facturasApi.descargarPdf(1, 'FE-0001')).toBe('FE-0001.pdf')
  })

  it('Bodegas envía recibe_* y los campos nuevos', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    for (const key of [
      'codigo',
      'correo',
      'recibe_nombre',
      'recibe_documento',
      'recibe_cargo',
      'recibe_telefono',
    ]) {
      expect(wrapper.find(`[data-test="field-${key}"]`).exists()).toBe(true)
    }
    expect(wrapper.find('[data-test="field-responsable_nombre"]').exists()).toBe(false)

    await wrapper.find('[data-test="field-nombre"]').setValue('Bodega Sur')
    await wrapper.find('[data-test="field-codigo"]').setValue('SUR-01')
    await wrapper.find('[data-test="field-correo"]').setValue('sur@entrega.com')
    await wrapper.find('[data-test="field-recibe_nombre"]').setValue('Ana Recibe')
    await wrapper.find('[data-test="field-recibe_cargo"]').setValue('Supervisora')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(bodegas.create).toHaveBeenCalledWith({
      nombre: 'Bodega Sur',
      codigo: 'SUR-01',
      correo: 'sur@entrega.com',
      recibe_nombre: 'Ana Recibe',
      recibe_cargo: 'Supervisora',
    })
  })

  it('Usuarios acepta PA y deja opcionales los datos del cliente', async () => {
    const wrapper = mount(UsuariosView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="field-rol_id"]').setValue('3')

    expect(wrapper.find('[data-test="field-ciudad"]').exists()).toBe(true)
    const tipos = wrapper.findAll('[data-test="field-tipo_documento"] option').map((o) => o.text())
    expect(tipos).toContain('PA')

    await wrapper.find('[data-test="field-nombre"]').setValue('Pedro')
    await wrapper.find('[data-test="field-correo"]').setValue('pedro@cliente.com')
    await wrapper.find('[data-test="field-contrasena"]').setValue('Clave123*')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(usuarios.create).toHaveBeenCalledWith({
      nombre: 'Pedro',
      correo: 'pedro@cliente.com',
      contrasena: 'Clave123*',
      rol_id: 3,
    })
  })
})
