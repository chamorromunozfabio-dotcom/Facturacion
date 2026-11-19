import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormModal from '../src/components/FormModal.vue'

const fields = [
  { key: 'nombre', label: 'Nombre', required: true },
  { key: 'direccion', label: 'Dirección' },
]

function mountModal(props = {}) {
  return mount(FormModal, {
    props: {
      open: true,
      title: 'Nuevo tipo',
      fields,
      modelValue: { nombre: '', direccion: '' },
      ...props,
    },
  })
}

describe('Test 10 — FormModal', () => {
  it('no muestra nada cuando open es false', () => {
    const wrapper = mountModal({ open: false })

    expect(wrapper.find('[data-test="modal"]').exists()).toBe(false)
  })

  it('muestra el título y los campos definidos', () => {
    const wrapper = mountModal()

    expect(wrapper.find('h2').text()).toBe('Nuevo tipo')
    expect(wrapper.find('[data-test="field-nombre"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-direccion"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nombre *')
  })

  it('emite update:modelValue al escribir', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="field-nombre"]').setValue('Alimentos')

    expect(wrapper.emitted('update:modelValue')[0][0]).toMatchObject({ nombre: 'Alimentos' })
  })

  it('no envía y muestra un aviso corto por cada campo obligatorio', async () => {
    const wrapper = mountModal()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-nombre"]').text()).toBe('Escribe nombre.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('quita el aviso en cuanto el campo se llena', async () => {
    const wrapper = mountModal()

    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('[data-test="error-nombre"]').exists()).toBe(true)

    await wrapper.find('[data-test="field-nombre"]').setValue('Alimentos')
    expect(wrapper.find('[data-test="error-nombre"]').exists()).toBe(false)
  })

  it('emite submit con los valores cargados', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="field-nombre"]').setValue('Alimentos')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')[0][0]).toMatchObject({
      nombre: 'Alimentos',
      direccion: '',
    })
  })

  it('emite close al cancelar', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="cancel"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
