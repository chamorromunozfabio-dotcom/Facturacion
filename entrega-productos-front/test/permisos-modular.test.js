import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'

import PermisosBuscador from '../src/components/permisos/PermisosBuscador.vue'
import PermisosCabecera from '../src/components/permisos/PermisosCabecera.vue'
import PermisosMatriz from '../src/components/permisos/PermisosMatriz.vue'
import PermisosConfirmacion from '../src/components/permisos/PermisosConfirmacion.vue'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

describe('Test 51 — Permisos modular: piezas pequeñas y contrato estable', () => {
  it('la vista delega en piezas y ya no contiene la lógica completa', () => {
    const vista = leer('../src/views/PermisosView.vue')

    expect(vista).toContain('usePermisos')
    expect(vista).toContain('PermisosBuscador')
    expect(vista).toContain('PermisosMatriz')
    expect(vista).not.toContain('async function confirmarCambios')
    expect(vista.split('\n').length).toBeLessThan(320)
  })

  it('el composable concentra la carga, los cambios y la confirmación', () => {
    const codigo = leer('../src/composables/usePermisos.js')

    for (const nombre of [
      'cargarPagina',
      'seleccionarUsuario',
      'togglePermiso',
      'aplicarRol',
      'confirmarCambios',
    ]) {
      expect(codigo).toContain(nombre)
    }
  })

  it('el buscador emite el usuario elegido y el texto limpio', async () => {
    const usuarios = [{ id: 9, nombre: 'Ana', correo: 'ana@x.com', rol: 'admin' }]
    const wrapper = mount(PermisosBuscador, {
      props: {
        modelValue: 'ana',
        cargando: false,
        coincidencias: usuarios,
        resultados: usuarios,
        seleccionadoId: null,
      },
    })

    expect(wrapper.find('[data-test="usuario-9"]').text()).toContain('Ana')

    await wrapper.find('[data-test="usuario-9"]').trigger('click')
    expect(wrapper.emitted('select')[0][0]).toMatchObject({ id: 9 })

    await wrapper.find('.buscador__limpiar').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe('')
  })

  it('la matriz respeta el estado visible y emite cada acción masiva', async () => {
    const wrapper = mount(PermisosMatriz, {
      props: {
        modulos: [
          {
            clave: 'facturas',
            etiqueta: 'Facturación',
            icono: 'span',
            opciones: [
              {
                clave: 'facturas:view',
                etiqueta: 'Facturación — Ver',
                accionEtiqueta: 'Ver',
                idBackend: 1,
                visible: true,
              },
              {
                clave: 'facturas:create',
                etiqueta: 'Facturación — Crear',
                accionEtiqueta: 'Crear',
                idBackend: 2,
                visible: false,
              },
            ],
          },
        ],
        todosMarcados: false,
        guardando: false,
        opcionesLength: 2,
      },
    })

    expect(wrapper.find('[data-test="check-facturas:view"]').element.checked).toBe(true)
    expect(wrapper.find('[data-test="check-facturas:create"]').element.checked).toBe(false)
    expect(wrapper.find('[data-test="modulo-facturas"]').text()).toContain('1/2')

    await wrapper.find('[data-test="check-facturas:create"]').setValue(true)
    expect(wrapper.emitted('toggle')[0][0]).toMatchObject({ clave: 'facturas:create' })

    await wrapper.find('[data-test="aplicar-rol"]').trigger('click')
    await wrapper.find('[data-test="desmarcar-todos"]').trigger('click')
    await wrapper.find('[data-test="check-todos"]').setValue(true)

    expect(wrapper.emitted('aplicar-rol')).toHaveLength(1)
    expect(wrapper.emitted('desmarcar-todos')).toHaveLength(1)
    expect(wrapper.emitted('toggle-todos')).toHaveLength(1)
  })

  it('la confirmación muestra el resumen y emite descartar/confirmar', async () => {
    const wrapper = mount(PermisosConfirmacion, {
      props: {
        cambios: 2,
        guardando: false,
        usuarioNombre: 'Ana',
        activos: 5,
        total: 20,
        resumen: 'Facturación — Ver',
        tieneCambios: true,
      },
    })

    expect(wrapper.find('[data-test="confirmar-bar"]').text()).toContain('2 cambios listos')
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain('Facturación — Ver')

    await wrapper.find('[data-test="descartar-permisos"]').trigger('click')
    await wrapper.find('[data-test="confirmar-permisos"]').trigger('click')

    expect(wrapper.emitted('descartar')).toHaveLength(1)
    expect(wrapper.emitted('confirmar')).toHaveLength(1)
  })

  it('la cabecera muestra el rol y permite cambiar de usuario', async () => {
    const wrapper = mount(PermisosCabecera, {
      props: {
        usuario: { id: 1, nombre: 'Ana', correo: 'ana@x.com' },
        rol: { id: 1, nombre: 'admin' },
        plantilla: ['a', 'b', 'c', 'd'],
        activos: 2,
        total: 20,
        faltan: 0,
      },
    })

    expect(wrapper.find('[data-test="assignment-affected"]').text()).toContain('Ana')
    expect(wrapper.find('[data-test="plantilla-rol"]').text()).toContain('4 permisos predefinidos')
    expect(wrapper.find('[data-test="permisos-pendientes"]').exists()).toBe(false)

    await wrapper.find('.btn--suave').trigger('click')
    expect(wrapper.emitted('cambiar')).toHaveLength(1)
  })
})
