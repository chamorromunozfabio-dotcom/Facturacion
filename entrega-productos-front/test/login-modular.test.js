import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { readFileSync } from 'node:fs'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  login: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('../src/modules/auth/store/auth', () => ({
  useAuthStore: () => ({ login: mocks.login }),
  getErrorMessage: (error) => error?.message || 'Error',
}))

import { useLogin } from '../src/modules/auth/composables/useLogin'
import {
  avisoBoton,
  mensajeValidacion,
  puedeEnviar,
  validarContrasena,
  validarCredenciales,
} from '../src/modules/auth/utils/login'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

function crearProbe() {
  return defineComponent({
    setup() {
      return { ...useLogin() }
    },
    template: `
      <div>
        <input data-test="correo" v-model="credentials.correo" />
        <input data-test="clave" v-model="credentials.contrasena" />
        <button data-test="enviar" @click="submit">Enviar</button>
        <button data-test="cuenta" @click="usarCuenta({ correo: 'demo@entrega.com', contrasena: 'Clave123*' })">Cuenta</button>
        <span data-test="error">{{ error }}</span>
        <span data-test="aviso">{{ avisoBoton }}</span>
        <span data-test="sesion">{{ avisoSesionVencida }}</span>
        <span data-test="cargando">{{ loading }}</span>
      </div>
    `,
  })
}

describe('Test 58 — Login modular: reglas puras, composable y formulario', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('las reglas de validación viven en utils/login.js', () => {
    expect(validarCredenciales({})).toEqual({
      correo: 'El correo es obligatorio.',
      contrasena: 'La contraseña es obligatoria.',
    })
    expect(validarCredenciales({ correo: 'ana@@x', contrasena: 'corta' })).toEqual({
      correo: 'Ingresa un correo válido (ejemplo: nombre@correo.com).',
      contrasena: 'La contraseña debe tener al menos 8 caracteres.',
    })
    expect(validarContrasena('12345678')).toBe('')
    const conErrores = validarCredenciales({})
    const sinErrores = validarCredenciales({ correo: 'ana@x.com', contrasena: 'Clave123*' })
    expect(puedeEnviar(conErrores, false)).toBe(false)
    expect(puedeEnviar(sinErrores, true)).toBe(false)
    expect(puedeEnviar(sinErrores, false)).toBe(true)

    const errores = { correo: '', contrasena: '' }
    expect(avisoBoton({ correo: '', contrasena: '' }, errores, false, false)).toBe(
      'Completa correo y contraseña para continuar.',
    )
    expect(avisoBoton({ correo: 'ana@x.com', contrasena: 'corta' }, errores, false, false)).toBe(
      'Corrige los campos marcados para continuar.',
    )
    expect(avisoBoton({ correo: 'ana@x.com', contrasena: '12345678' }, errores, true, false)).toBe('')
    expect(mensajeValidacion({ correo: '', contrasena: '' })).toBe('Ingresa correo y contraseña.')
    expect(mensajeValidacion({ correo: 'ana@x.com', contrasena: 'corta' })).toBe(
      'Corrige los campos marcados para continuar.',
    )
  })

  it('submit envía solo correo y contrasena y redirige', async () => {
    mocks.login.mockResolvedValue({ access_token: 'token' })
    const wrapper = mount(crearProbe())

    await wrapper.find('[data-test="correo"]').setValue('admin@entrega.com')
    await wrapper.find('[data-test="clave"]').setValue('Admin123*')
    await wrapper.find('[data-test="enviar"]').trigger('click')
    await flushPromises()

    expect(mocks.login).toHaveBeenCalledWith({ correo: 'admin@entrega.com', contrasena: 'Admin123*' })
    expect(mocks.push).toHaveBeenCalledWith('/')
    expect(wrapper.find('[data-test="cargando"]').text()).toBe('false')
  })

  it('un error de credenciales se muestra sin redirigir', async () => {
    mocks.login.mockRejectedValue(new Error('Correo o contraseña incorrectos'))
    const wrapper = mount(crearProbe())

    await wrapper.find('[data-test="correo"]').setValue('ana@entrega.com')
    await wrapper.find('[data-test="clave"]').setValue('Clave123*')
    await wrapper.find('[data-test="enviar"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="error"]').text()).toBe('Correo o contraseña incorrectos')
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('cuentas demo y aviso de sesión vencida siguen funcionando', async () => {
    localStorage.setItem('sesion_vencida', '1')
    const wrapper = mount(crearProbe())
    expect(wrapper.find('[data-test="sesion"]').text()).toBe('true')
    expect(localStorage.getItem('sesion_vencida')).toBeNull()

    await wrapper.find('[data-test="cuenta"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="correo"]').element.value).toBe('demo@entrega.com')
    expect(wrapper.find('[data-test="clave"]').element.value).toBe('Clave123*')
    expect(wrapper.find('[data-test="aviso"]').text()).toBe('')
  })

  it('la vista delega y el formulario conserva markup, textos y CSS', () => {
    const vista = leer('../src/modules/auth/views/LoginView.vue')
    expect(vista).toContain('LoginForm')
    expect(vista).not.toContain('useLogin')
    expect(vista).not.toContain('<style')

    const composable = leer('../src/modules/auth/composables/useLogin.js')
    expect(composable).toContain('useLogin')
    expect(composable).toContain('validarCredenciales')
    expect(composable).not.toContain('<template>')

    const utils = leer('../src/modules/auth/utils/login.js')
    expect(utils).toContain('export function validarCredenciales')
    expect(utils).toContain('export function mensajeValidacion')

    const form = leer('../src/modules/auth/components/LoginForm.vue')
    const ionic = `import { IonButton, IonContent, IonInput, IonPage } from '@ionic/vue'`
    for (const fragmento of [
      'data-test="sesion-vencida"',
      'Modo demo activo',
      'MENSAJE_SESION_VENCIDA',
      '@submit.prevent="submit"',
      '@media (max-width: 480px)',
      'padding: 22px 18px',
      ionic,
      '<IonPage>',
      '<IonInput',
      '@ion-blur="touched.correo = true"',
      '<IonButton',
      'data-test="cuenta"',
    ]) {
      expect(form).toContain(fragmento)
    }

    expect(leer('../src/main.js')).toContain('IonicVue')
    expect(leer('../src/App.vue')).toContain('IonApp')
    expect(leer('../test/setup-ionic.js')).toContain("vi.mock('@ionic/vue'")
    expect(leer('../src/ARQUITECTURA.md')).toContain('useLogin.js')
  })
})
