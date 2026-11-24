import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDelete from '../src/shared/ui/ConfirmDelete.vue'

function mountConfirm(props = {}) {
  return mount(ConfirmDelete, {
    props: {
      open: true,
      title: 'Eliminar tipo',
      message: '¿Estás seguro de eliminar este registro?',
      itemLabel: 'Alimentos',
      ...props,
    },
  })
}

describe('Test 11 — ConfirmDelete', () => {
  it('no muestra nada cuando open es false', () => {
    const wrapper = mountConfirm({ open: false })

    expect(wrapper.find('[data-test="confirm-delete"]').exists()).toBe(false)
  })

  it('muestra el título, el mensaje y el registro a eliminar', () => {
    const wrapper = mountConfirm()

    expect(wrapper.find('h2').text()).toBe('Eliminar tipo')
    expect(wrapper.text()).toContain('¿Estás seguro de eliminar este registro?')
    expect(wrapper.find('[data-test="item"]').text()).toBe('Alimentos')
  })

  it('emite confirm al aceptar', async () => {
    const wrapper = mountConfirm()

    await wrapper.find('[data-test="confirm"]').trigger('click')

    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('emite cancel al rechazar', async () => {
    const wrapper = mountConfirm()

    await wrapper.find('[data-test="cancel"]').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('deshabilita el botón y cambia el texto mientras carga', () => {
    const wrapper = mountConfirm({ loading: true })

    const button = wrapper.find('[data-test="confirm"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toBe('Eliminando...')
  })
})
