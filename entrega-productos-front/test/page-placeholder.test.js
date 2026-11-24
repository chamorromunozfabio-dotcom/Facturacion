import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PagePlaceholder from '../src/shared/ui/PagePlaceholder.vue'

describe('Test 6 — componente PagePlaceholder', () => {
  it('muestra el título y el badge del día', () => {
    const wrapper = mount(PagePlaceholder, {
      props: { title: 'Tipos de producto', day: 'Día 3' },
    })

    expect(wrapper.find('h1').text()).toBe('Tipos de producto')
    expect(wrapper.find('.badge').text()).toBe('Día 3')
  })

  it('no muestra el badge si no se pasa day', () => {
    const wrapper = mount(PagePlaceholder, { props: { title: 'Bodegas' } })

    expect(wrapper.find('.badge').exists()).toBe(false)
  })

  it('usa el texto por defecto si no hay description', () => {
    const wrapper = mount(PagePlaceholder, { props: { title: 'Usuarios' } })

    expect(wrapper.find('.placeholder__text').text()).toBe(
      'Esta pantalla ya tiene su ruta lista. Falta conectarla a la API.',
    )
  })

  it('muestra la descripción recibida', () => {
    const wrapper = mount(PagePlaceholder, {
      props: { title: 'Órdenes', description: 'Listado de órdenes.' },
    })

    expect(wrapper.find('.placeholder__text').text()).toBe('Listado de órdenes.')
  })

  it('muestra las 3 notas pendientes del líder', () => {
    const wrapper = mount(PagePlaceholder, { props: { title: 'Factura' } })

    expect(wrapper.findAll('li')).toHaveLength(3)
    expect(wrapper.text()).toContain('Pendiente de confirmar con el líder:')
  })
})
