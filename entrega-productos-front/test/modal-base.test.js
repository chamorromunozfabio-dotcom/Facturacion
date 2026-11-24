import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'

const esMovil = vi.hoisted(() => vi.fn())

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: esMovil },
}))

import ModalBase from '../src/shared/ui/ModalBase.vue'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')
const montados = []

const montar = (open, props = {}) => {
  const wrapper = mount(ModalBase, {
    attachTo: document.body,
    props: { open, testId: 'dialogo', label: 'Diálogo de prueba', ...props },
    slots: { default: '<p data-test="contenido">contenido</p>' },
  })
  montados.push(wrapper)
  return wrapper
}

afterEach(() => {
  while (montados.length) montados.pop().unmount()
})

describe('ModalBase — diálogos web y móvil', () => {
  it('en navegador conserva el modal HTML con backdrop', () => {
    esMovil.mockReturnValue(false)

    const wrapper = montar(true)

    expect(wrapper.find('.modal').exists()).toBe(true)
    expect(wrapper.find('.modal__backdrop').exists()).toBe(true)
    expect(wrapper.find('[data-test="dialogo"]').attributes('role')).toBe('dialog')
    expect(wrapper.find('[data-test="contenido"]').exists()).toBe(true)
  })

  it('en navegador no renderiza el panel cuando está cerrado', () => {
    esMovil.mockReturnValue(false)

    expect(montar(false).find('[data-test="dialogo"]').exists()).toBe(false)
  })

  it('en móvil usa IonModal sin el backdrop propio', () => {
    esMovil.mockReturnValue(true)

    const wrapper = montar(true)

    expect(wrapper.findComponent({ name: 'IonModal' }).exists()).toBe(true)
    expect(wrapper.find('[data-test="dialogo"]').exists()).toBe(true)
    expect(wrapper.find('.modal__backdrop').exists()).toBe(false)
  })

  it('acepta role y ancho personalizados para la confirmación de borrado', () => {
    esMovil.mockReturnValue(false)

    const panel = montar(true, { role: 'alertdialog', maxWidth: '400px' }).find(
      '[data-test="dialogo"]',
    )

    expect(panel.attributes('role')).toBe('alertdialog')
    expect(panel.element.style.maxWidth).toBe('400px')
  })

  it('mueve el foco al panel al abrirse en navegador', async () => {
    esMovil.mockReturnValue(false)

    const wrapper = montar(true)
    await flushPromises()

    expect(document.activeElement).toBe(wrapper.find('[data-test="dialogo"]').element)
  })

  it('los seis diálogos delegan en ModalBase y conservan su contrato', () => {
    const contratos = [
      ['../src/modules/facturas/components/FacturaDetailModal.vue', 'detail-modal'],
      ['../src/modules/facturas/components/FacturaFirmaModal.vue', 'firma-modal'],
      ['../src/modules/facturas/components/FacturaRechazoModal.vue', 'rechazo-modal'],
      ['../src/modules/facturas/components/FacturaForm.vue', 'factura-form'],
      ['../src/shared/ui/FormModal.vue', 'modal'],
      ['../src/shared/ui/ConfirmDelete.vue', 'confirm-delete'],
    ]

    for (const [ruta, testId] of contratos) {
      const codigo = leer(ruta)
      expect(codigo).toContain('ModalBase')
      expect(codigo).toContain(`test-id="${testId}"`)
      expect(codigo).toContain('useModalA11y')
      expect(codigo).not.toContain('<Transition')
    }

    expect(leer('../src/shared/ui/ConfirmDelete.vue')).toContain('role="alertdialog"')
    expect(leer('../src/shared/ui/ConfirmDelete.vue')).toContain("@close=\"emit('cancel')\"")
  })
})
