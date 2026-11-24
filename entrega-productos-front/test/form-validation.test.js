import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormModal from '../src/shared/ui/FormModal.vue'
import { isDuplicateError } from '../src/shared/api/axios'

const fields = [{ key: 'nombre', label: 'Nombre', required: true, maxLength: 5 }]

function mountModal() {
  return mount(FormModal, {
    props: {
      open: true,
      title: 'Nuevo tipo',
      fields,
      modelValue: { nombre: '' },
    },
  })
}

describe('Test 15 — Validación según contrato del backend', () => {
  it('corta el texto en el máximo mientras se escribe', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="field-nombre"]').setValue('Demasiado largo')

    expect(wrapper.find('[data-test="field-nombre"]').element.value).toBe('Demas')

    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')[0][0]).toEqual({ nombre: 'Demas' })
  })

  it('descarta letras y corta el largo en campos de solo dígitos, y muestra la pista', async () => {
    const wrapper = mount(FormModal, {
      props: {
        open: true,
        title: 'Nuevo tipo',
        fields: [
          {
            key: 'telefono',
            label: 'Teléfono',
            digitsOnly: true,
            maxLength: 15,
            hint: 'Solo números, entre 7 y 15.',
          },
        ],
        modelValue: { telefono: '' },
      },
    })

    expect(wrapper.find('[data-test="hint-telefono"]').text()).toBe('Solo números, entre 7 y 15.')

    await wrapper.find('[data-test="field-telefono"]').setValue('300-12345678901234567')

    expect(wrapper.find('[data-test="field-telefono"]').element.value).toBe('300123456789012')

    // La letra se bloquea ANTES de aparecer; el dígito y Backspace pasan.
    const input = wrapper.find('[data-test="field-telefono"]')
    const letra = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
    input.element.dispatchEvent(letra)
    expect(letra.defaultPrevented).toBe(true)

    const digito = new KeyboardEvent('keydown', { key: '3', cancelable: true })
    input.element.dispatchEvent(digito)
    expect(digito.defaultPrevented).toBe(false)

    const retroceso = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true })
    input.element.dispatchEvent(retroceso)
    expect(retroceso.defaultPrevented).toBe(false)
  })

  it('quita los espacios al inicio y al final antes de enviar', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="field-nombre"]').setValue('  Alim  ')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')[0][0]).toEqual({ nombre: 'Alim' })
  })

  it('acepta un nombre de exactamente el máximo', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="field-nombre"]').setValue('Alima')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')[0][0]).toEqual({ nombre: 'Alima' })
  })

  it('deshabilita el botón mientras haya campos vacíos y lo habilita al completar', async () => {
    const wrapper = mountModal()

    expect(wrapper.find('[data-test="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="form-hint"]').text()).toBe(
      'Completa los campos marcados para guardar.',
    )

    await wrapper.find('[data-test="field-nombre"]').setValue('Ali')

    expect(wrapper.find('[data-test="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('avisa debajo del campo apenas queda vacío, sin enviar', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="field-nombre"]').setValue('Ali')
    expect(wrapper.find('[data-test="error-nombre"]').exists()).toBe(false)

    await wrapper.find('[data-test="field-nombre"]').setValue('')

    expect(wrapper.find('[data-test="error-nombre"]').text()).toBe('Escribe nombre.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('rechaza textos más cortos que el mínimo de caracteres', async () => {
    const wrapper = mount(FormModal, {
      props: {
        open: true,
        title: 'Nuevo tipo',
        fields: [{ key: 'nombre', label: 'Nombre', required: true, minLength: 3 }],
        modelValue: { nombre: '' },
      },
    })

    await wrapper.find('[data-test="field-nombre"]').setValue('ab')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-nombre"]').text()).toBe('Mínimo 3 caracteres.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('detecta nombre repetido en 400 y 409', () => {
    const detail = 'Ya existe un tipo con ese nombre'
    const badRequest = { response: { status: 400, data: { detail } } }
    const conflict = { response: { status: 409, data: { detail } } }
    const validation = { response: { status: 422, data: { detail } } }

    expect(isDuplicateError(badRequest)).toBe(true)
    expect(isDuplicateError(conflict)).toBe(true)
    expect(isDuplicateError(validation)).toBe(false)
  })
})
