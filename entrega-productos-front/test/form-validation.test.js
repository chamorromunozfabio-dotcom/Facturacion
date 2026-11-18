import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormModal from '../src/components/FormModal.vue'
import { isDuplicateError } from '../src/api/axios'

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
  it('rechaza más caracteres de los permitidos', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="field-nombre"]').setValue('Demasiado largo')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error"]').text()).toBe(
      'Nombre no puede superar los 5 caracteres.',
    )
    expect(wrapper.emitted('submit')).toBeUndefined()
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
