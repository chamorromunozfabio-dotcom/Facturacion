import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'

const esMovil = vi.hoisted(() => vi.fn())

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: esMovil },
}))

import BotonBase from '../src/shared/ui/BotonBase.vue'
import CampoNative from '../src/shared/ui/CampoNative.vue'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

describe('BotonBase y CampoNative — adaptadores web/móvil', () => {
  it('en navegador el botón sigue siendo un <button> con sus atributos', () => {
    esMovil.mockReturnValue(false)

    const wrapper = mount(BotonBase, {
      attrs: { 'data-test': 'accion', type: 'button', disabled: true },
      slots: { default: 'Acción' },
    })
    const boton = wrapper.find('[data-test="accion"]')

    expect(boton.element.tagName).toBe('BUTTON')
    expect(boton.attributes('disabled')).toBeDefined()
    expect(boton.text()).toBe('Acción')
    expect(wrapper.findComponent({ name: 'IonButton' }).exists()).toBe(false)
  })

  it('en móvil el botón usa IonButton', () => {
    esMovil.mockReturnValue(true)

    const wrapper = mount(BotonBase, {
      attrs: { 'data-test': 'accion', type: 'button' },
      slots: { default: 'Acción' },
    })

    expect(wrapper.findComponent({ name: 'IonButton' }).exists()).toBe(true)
    expect(wrapper.find('[data-test="accion"]').text()).toBe('Acción')
  })

  it('en navegador el campo es un <input> y mantiene v-model', async () => {
    esMovil.mockReturnValue(false)

    const wrapper = mount(CampoNative, {
      props: { modelValue: 'abc' },
      attrs: { 'data-test': 'campo', type: 'text' },
    })
    const campo = wrapper.find('[data-test="campo"]')

    expect(campo.element.tagName).toBe('INPUT')
    expect(campo.element.value).toBe('abc')

    await campo.setValue('2026-11-23')
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-11-23']])
  })

  it('en móvil el campo usa IonInput y también mantiene v-model', async () => {
    esMovil.mockReturnValue(true)

    const wrapper = mount(CampoNative, {
      props: { modelValue: '' },
      attrs: { 'data-test': 'campo', type: 'date' },
    })

    expect(wrapper.findComponent({ name: 'IonInput' }).exists()).toBe(true)

    await wrapper.find('[data-test="campo"]').setValue('2026-11-24')
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-11-24']])
  })

  it('Estadísticas y catálogos usan los adaptadores sin ionicons', () => {
    const contratos = [
      ['../src/shared/ui/DataTable.vue', ['BotonBase', 'CampoNative']],
      ['../src/modules/estadisticas/views/EstadisticasView.vue', ['BotonBase', 'CampoNative']],
      ['../src/shared/ui/FormModal.vue', ['BotonBase']],
      ['../src/shared/ui/ConfirmDelete.vue', ['BotonBase']],
      ['../src/modules/permisos/components/PermisosBuscador.vue', ['BotonBase', 'CampoNative']],
      ['../src/modules/permisos/components/PermisosMatriz.vue', ['BotonBase']],
      ['../src/modules/permisos/components/PermisosCabecera.vue', ['BotonBase']],
      ['../src/modules/permisos/components/PermisosConfirmacion.vue', ['BotonBase']],
      ['../src/modules/layout/layouts/LayoutBase.vue', ['IonMenu', 'IonHeader', 'IonContent']],
    ]

    for (const [ruta, simbolos] of contratos) {
      const codigo = leer(ruta)
      for (const simbolo of simbolos) expect(codigo).toContain(simbolo)
      expect(codigo).not.toContain('ionicons')
    }
  })
})
