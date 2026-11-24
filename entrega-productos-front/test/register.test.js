import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  registrar: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
  RouterLink: {
    props: ['to'],
    setup(_, { slots }) {
      return () => slots.default?.()
    },
  },
}))

vi.mock('../src/modules/auth/api/register', () => ({
  registrar: mocks.registrar,
}))

import RegisterView from '../src/modules/auth/views/RegisterView.vue'

async function llenarCliente(wrapper) {
  await wrapper.find('[data-test="field-nombre"]').setValue('Juan Pérez')
  await wrapper.find('[data-test="field-numero_documento"]').setValue('1020304050')
  await wrapper.find('[data-test="field-telefono"]').setValue('3001234567')
  await wrapper.find('[data-test="field-correo"]').setValue('juan@cliente.com')
  await wrapper.find('[data-test="field-contrasena"]').setValue('Cliente123*')
  await wrapper.find('[data-test="field-confirmar"]').setValue('Cliente123*')
}

async function llenarEmpresa(wrapper) {
  await wrapper.find('[data-test="field-razon_social"]').setValue('Distribuidora Andina S.A.S.')
  await wrapper.find('[data-test="field-nit"]').setValue('900123456-1')
  await wrapper.find('[data-test="field-telefono"]').setValue('3001234567')
  await wrapper.find('[data-test="field-direccion"]').setValue('Calle 10 # 20-30')
  await wrapper.find('[data-test="field-representante"]').setValue('Ana Torres')
  await wrapper.find('[data-test="field-correo"]').setValue('empresa@entrega.com')
  await wrapper.find('[data-test="field-contrasena"]').setValue('Empresa123*')
  await wrapper.find('[data-test="field-confirmar"]').setValue('Empresa123*')
}

describe('Test 69 — Registro público de cliente y empresa', () => {
  beforeEach(() => {
    mocks.push.mockClear()
    mocks.registrar.mockReset()
    mocks.registrar.mockResolvedValue({ message: 'Cuenta creada. Ya puedes iniciar sesión.' })
  })

  it('arranca en cliente, muestra sus campos y el botón deshabilitado', () => {
    const wrapper = mount(RegisterView)

    expect(wrapper.find('[data-test="field-nombre"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-numero_documento"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-razon_social"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="registrar"]').attributes('disabled')).toBeDefined()
  })

  it('el selector cambia entre cliente y empresa', async () => {
    const wrapper = mount(RegisterView)

    await wrapper.find('[data-test="tipo-empresa"]').trigger('click')

    expect(wrapper.find('[data-test="field-razon_social"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-nit"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-direccion"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-representante"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-nombre"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="field-numero_documento"]').exists()).toBe(false)

    await wrapper.find('[data-test="tipo-cliente"]').trigger('click')

    expect(wrapper.find('[data-test="field-nombre"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-razon_social"]').exists()).toBe(false)
  })

  it('filtra letras y bloquea teclas no numéricas en documento y teléfono', async () => {
    const wrapper = mount(RegisterView)
    const documento = wrapper.find('[data-test="field-numero_documento"]')

    await documento.setValue('12a3-4')
    expect(documento.element.value).toBe('1234')

    const evento = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
    documento.element.dispatchEvent(evento)
    expect(evento.defaultPrevented).toBe(true)

    await wrapper.find('[data-test="field-telefono"]').setValue('300-123')
    expect(wrapper.find('[data-test="field-telefono"]').element.value).toBe('300123')
  })

  it('el NIT solo acepta números y guiones', async () => {
    const wrapper = mount(RegisterView)
    await wrapper.find('[data-test="tipo-empresa"]').trigger('click')

    const nit = wrapper.find('[data-test="field-nit"]')
    await nit.setValue('900abc-123-1')

    expect(nit.element.value).toBe('900-123-1')
  })

  it('habilita el botón solo con el formulario completo y envía los datos del cliente', async () => {
    const wrapper = mount(RegisterView)
    await llenarCliente(wrapper)

    expect(wrapper.find('[data-test="registrar"]').attributes('disabled')).toBeUndefined()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mocks.registrar).toHaveBeenCalledWith({
      tipo: 'cliente',
      correo: 'juan@cliente.com',
      contrasena: 'Cliente123*',
      nombre: 'Juan Pérez',
      tipo_documento: 'CC',
      numero_documento: '1020304050',
      telefono: '3001234567',
    })
    expect(wrapper.find('[data-test="registro-exito"]').exists()).toBe(true)
  })

  it('la empresa queda pendiente de aprobación y no redirige sola', async () => {
    mocks.registrar.mockResolvedValue({
      message: 'Empresa registrada. Queda pendiente de aprobación.',
      estado: 'pendiente',
      empresa: { id: 9, razon_social: 'Distribuidora Andina S.A.S.', estado: 'pendiente' },
    })

    const wrapper = mount(RegisterView)
    await wrapper.find('[data-test="tipo-empresa"]').trigger('click')
    await llenarEmpresa(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mocks.registrar).toHaveBeenCalledWith({
      tipo: 'empresa',
      correo: 'empresa@entrega.com',
      contrasena: 'Empresa123*',
      razon_social: 'Distribuidora Andina S.A.S.',
      nit: '900123456-1',
      telefono: '3001234567',
      direccion: 'Calle 10 # 20-30',
      representante: 'Ana Torres',
    })
    expect(wrapper.find('[data-test="empresa-pendiente"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="empresa-pendiente"]').text()).toContain(
      'Pendiente de aprobación',
    )
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('muestra el error de cada campo que devuelve el backend (422)', async () => {
    mocks.registrar.mockRejectedValue({
      response: {
        data: {
          detail: [{ loc: ['body', 'correo'], msg: 'El correo ya está registrado.' }],
        },
      },
    })

    const wrapper = mount(RegisterView)
    await llenarCliente(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[data-test="error-correo"]').text()).toBe(
      'El correo ya está registrado.',
    )
  })

  it('muestra el mensaje general si el backend rechaza el registro', async () => {
    mocks.registrar.mockRejectedValue(new Error('Ya existe una cuenta con ese correo.'))

    const wrapper = mount(RegisterView)
    await llenarCliente(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[data-test="register-error"]').text()).toBe(
      'Ya existe una cuenta con ese correo.',
    )
  })
})
