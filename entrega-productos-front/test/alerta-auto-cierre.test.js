import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AlertMessage from '../src/shared/ui/AlertMessage.vue'

describe('Test 48 — Los avisos se cierran solos', () => {
  afterEach(() => vi.useRealTimers())

  it('se cierra a los 5 segundos por defecto', () => {
    vi.useFakeTimers()
    const wrapper = mount(AlertMessage, { props: { message: 'Registro guardado' } })

    expect(wrapper.emitted('close')).toBeUndefined()

    vi.advanceTimersByTime(4999)
    expect(wrapper.emitted('close')).toBeUndefined()

    vi.advanceTimersByTime(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('permite dejar un aviso fijo con duration 0', () => {
    vi.useFakeTimers()
    const wrapper = mount(AlertMessage, {
      props: { message: 'Revisa este dato', type: 'error', duration: 0 },
    })

    vi.advanceTimersByTime(60000)

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('reinicia el tiempo al cambiar el mensaje', async () => {
    vi.useFakeTimers()
    const wrapper = mount(AlertMessage, {
      props: { message: 'Guardando', duration: 1000 },
    })

    vi.advanceTimersByTime(700)
    await wrapper.setProps({ message: 'Guardado' })
    vi.advanceTimersByTime(700)

    expect(wrapper.emitted('close')).toBeUndefined()

    vi.advanceTimersByTime(300)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('el cierre manual cancela el temporizador', async () => {
    vi.useFakeTimers()
    const wrapper = mount(AlertMessage, { props: { message: 'Listo' } })

    await wrapper.find('[data-test="close"]').trigger('click')
    vi.advanceTimersByTime(10000)

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
