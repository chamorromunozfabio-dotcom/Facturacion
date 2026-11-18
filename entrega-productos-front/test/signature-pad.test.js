import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SignaturePad from '../src/components/SignaturePad.vue'

const contextMock = {
  lineWidth: 0,
  lineCap: '',
  lineJoin: '',
  strokeStyle: '',
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
}

/** jsdom no implementa canvas: simulamos el contexto 2D. */
function mockCanvas(dataUrl = 'data:image/png;base64,YWJj') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => contextMock)
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => dataUrl)
}

const mountPad = (props = {}) => mount(SignaturePad, { props })

describe('Test 20 — SignaturePad (firma con canvas)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCanvas()
  })

  it('empieza vacío y muestra la ayuda', () => {
    const wrapper = mountPad()

    expect(wrapper.find('[data-test="signature-canvas"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Firma con el mouse')
    expect(wrapper.find('[data-test="signature-preview"]').exists()).toBe(false)
  })

  it('dibuja y emite la data URL completa al soltar', async () => {
    const wrapper = mountPad()
    const canvas = wrapper.find('[data-test="signature-canvas"]')

    await canvas.trigger('pointerdown', { clientX: 10, clientY: 20 })
    await canvas.trigger('pointermove', { clientX: 40, clientY: 50 })
    await canvas.trigger('pointerup', { clientX: 40, clientY: 50 })

    expect(contextMock.beginPath).toHaveBeenCalled()
    expect(contextMock.moveTo).toHaveBeenCalledWith(10, 20)
    expect(contextMock.lineTo).toHaveBeenCalledWith(40, 50)
    expect(contextMock.stroke).toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe('data:image/png;base64,YWJj')
  })

  it('muestra la firma como vista previa', async () => {
    const wrapper = mountPad({ modelValue: 'data:image/png;base64,YWJj' })

    expect(wrapper.find('[data-test="signature-preview"]').attributes('src')).toBe(
      'data:image/png;base64,YWJj',
    )
  })

  it('Limpiar borra el canvas y emite cadena vacía', async () => {
    const wrapper = mountPad({ modelValue: 'data:image/png;base64,YWJj' })

    await wrapper.find('[data-test="signature-clear"]').trigger('click')

    expect(contextMock.clearRect).toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe('')
  })

  it('rechaza una firma mayor al límite de 500 KB', async () => {
    mockCanvas('data:image/png;base64,' + 'A'.repeat(600 * 1024))
    const wrapper = mountPad()
    const canvas = wrapper.find('[data-test="signature-canvas"]')

    await canvas.trigger('pointerdown', { clientX: 1, clientY: 1 })
    await canvas.trigger('pointerup', { clientX: 2, clientY: 2 })

    expect(wrapper.find('[data-test="signature-error"]').text()).toBe(
      'La firma es demasiado grande (máximo 500 KB).',
    )
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
