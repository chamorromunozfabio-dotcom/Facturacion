import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import FormModal from '../src/components/FormModal.vue'
import ConfirmDelete from '../src/components/ConfirmDelete.vue'
import FacturaForm from '../src/components/FacturaForm.vue'
import SignaturePad from '../src/components/SignaturePad.vue'

const montados = []

const mountVisible = (component, options = {}) => {
  const wrapper = mount(component, { attachTo: document.body, ...options })
  montados.push(wrapper)
  return wrapper
}

const presionarEscape = () => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
}

describe('Test 29 — Accesibilidad de modales y firma', () => {
  afterEach(() => {
    while (montados.length) montados.pop().unmount()
  })

  it('los botones de cierre tienen nombre accesible', () => {
    const formModal = mountVisible(FormModal, { props: { open: true, title: 'Nuevo tipo' } })
    const confirm = mountVisible(ConfirmDelete, { props: { open: true } })
    const firmaForm = mountVisible(FacturaForm, {
      props: { open: true, clientes: [], bodegas: [], tipos: [] },
    })
    const canvas = mountVisible(SignaturePad)

    expect(formModal.find('[data-test="close-x"]').attributes('aria-label')).toBe('Cerrar ventana')
    expect(confirm.find('[role="alertdialog"]').attributes('aria-label')).toBe(
      'Confirmar eliminación',
    )
    expect(firmaForm.find('[data-test="close-x"]').attributes('aria-label')).toBe(
      'Cerrar formulario',
    )
    expect(canvas.find('canvas').attributes('aria-label')).toContain('firma')
  })

  it('Escape cierra cada modal avisando al padre', () => {
    const formModal = mountVisible(FormModal, { props: { open: true, title: 'Nuevo tipo' } })
    const confirm = mountVisible(ConfirmDelete, { props: { open: true } })
    const firmaForm = mountVisible(FacturaForm, {
      props: { open: true, clientes: [], bodegas: [], tipos: [] },
    })

    presionarEscape()

    expect(formModal.emitted('close')).toHaveLength(1)
    expect(confirm.emitted('cancel')).toHaveLength(1)
    expect(firmaForm.emitted('close')).toHaveLength(1)
  })

  it('el foco entra al panel cuando se abre el modal', async () => {
    const formModal = mountVisible(FormModal, { props: { open: true, title: 'Nuevo tipo' } })
    await flushPromises()

    expect(document.activeElement).toBe(formModal.find('[role="dialog"]').element)
    expect(formModal.find('[role="dialog"]').attributes('tabindex')).toBe('-1')
  })
})
