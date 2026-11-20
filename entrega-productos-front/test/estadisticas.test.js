import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { readFileSync } from 'node:fs'

import { CATALOGO_PERMISOS, claveDelNombreBackend, tienePermiso } from '../src/config/permissions'
import { menuItems, visibleMenuFor } from '../src/config/navigation'
import { getResumen } from '../src/api/estadisticas'
import estadisticasApi from '../src/api/estadisticas'
import {
  esSerieBarras,
  formatearValor,
  maximoDe,
  normalizarResumen,
  rangoInvalido,
  rangoPorDefecto,
} from '../src/utils/estadisticas'
import { useEstadisticas } from '../src/composables/useEstadisticas'
import EstadisticasView from '../src/views/EstadisticasView.vue'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

function crearProbe() {
  return defineComponent({
    setup() {
      return { ...useEstadisticas() }
    },
    template: `
      <div>
        <span data-test="cargando">{{ loading }}</span>
        <span data-test="error">{{ error }}</span>
        <span data-test="tarjetas">{{ tarjetas.length }}</span>
        <span data-test="sin-datos">{{ sinDatos }}</span>
        <button data-test="recargar" @click="cargar">Recargar</button>
      </div>
    `,
  })
}

describe('Test 59 — Estadísticas por rol: reglas, permiso, API y panel', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('las reglas de fechas, formato y series son puras', () => {
    expect(rangoPorDefecto(new Date(2026, 10, 20))).toEqual({
      desde: '2026-11-01',
      hasta: '2026-11-30',
    })
    expect(formatearValor(8450000, '$')).toBe('8.450.000 $')
    expect(formatearValor('no-numero')).toBe('0')
    expect(rangoInvalido('2026-11-10', '2026-11-01')).toBe(true)
    expect(rangoInvalido('', '2026-11-01')).toBe(true)
    expect(rangoInvalido('2026-11-01', '2026-11-30')).toBe(false)
    expect(esSerieBarras({ tipo: 'barras', datos: [{ etiqueta: 'A', valor: 1 }] })).toBe(true)
    expect(esSerieBarras({ tipo: 'barras', datos: [] })).toBe(false)
    expect(esSerieBarras({ tipo: 'lineas', datos: [{ valor: 1 }] })).toBe(false)
    expect(maximoDe({ datos: [{ valor: 3 }, { valor: 9 }, { valor: 'x' }] })).toBe(9)
    expect(normalizarResumen(null)).toEqual({
      periodo: {},
      generado_para: '',
      tarjetas: [],
      series: [],
    })
  })

  it('el permiso y el menú están disponibles para los tres roles', () => {
    expect(CATALOGO_PERMISOS).toHaveLength(30)
    expect(claveDelNombreBackend('estadisticas_view')).toBe('estadisticas:view')
    for (const rol of ['admin', 'bodeguero', 'cliente']) {
      expect(tienePermiso([], rol, 'estadisticas', 'view')).toBe(true)
      expect(visibleMenuFor(rol).map((item) => item.label)).toContain('Estadísticas')
    }
    expect(menuItems.find((item) => item.to === '/estadisticas')).toMatchObject({
      label: 'Estadísticas',
      module: 'estadisticas',
    })
  })

  it('la ruta exige el permiso estadisticas:view', () => {
    const codigo = leer('../src/router/index.js')
    expect(codigo).toContain("path: 'estadisticas'")
    expect(codigo).toContain("name: 'estadisticas'")
    expect(codigo).toContain("component: () => import('../views/EstadisticasView.vue')")
    expect(codigo).toContain("permission: 'estadisticas:view'")
  })

  it('un solo endpoint en modo demo y un resumen distinto por rol', async () => {
    localStorage.setItem('user', JSON.stringify({ rol: 'bodeguero' }))
    const bodeguero = await getResumen({ desde: '2026-11-01', hasta: '2026-11-30' })

    expect(bodeguero.periodo).toEqual({ desde: '2026-11-01', hasta: '2026-11-30' })
    expect(bodeguero.generado_para).toBe('bodeguero')
    expect(bodeguero.tarjetas.map((tarjeta) => tarjeta.clave)).not.toContain('bodegas')
    expect(bodeguero.series.every((serie) => serie.tipo === 'barras')).toBe(true)

    localStorage.setItem('user', JSON.stringify({ rol: 'cliente' }))
    const cliente = await getResumen({})
    expect(cliente.generado_para).toBe('cliente')
    expect(cliente.tarjetas.length).toBeGreaterThan(0)
    expect(cliente.series[0].datos.map((dato) => dato.etiqueta)).not.toContain('Emitida')

    localStorage.setItem('user', JSON.stringify({ rol: 'admin' }))
    const admin = await getResumen({})
    expect(admin.generado_para).toBe('admin')
    expect(admin.tarjetas.map((tarjeta) => tarjeta.clave)).toContain('bodegas')
    expect(admin.series.length).toBeGreaterThan(cliente.series.length)
  })

  it('el composable carga al montar y muestra errores sin romper la vista', async () => {
    localStorage.setItem('user', JSON.stringify({ rol: 'admin' }))
    const wrapper = mount(crearProbe())
    await flushPromises()

    expect(wrapper.find('[data-test="cargando"]').text()).toBe('false')
    expect(Number(wrapper.find('[data-test="tarjetas"]').text())).toBeGreaterThan(0)
    expect(wrapper.find('[data-test="sin-datos"]').text()).toBe('false')

    const spy = vi
      .spyOn(estadisticasApi, 'getResumen')
      .mockRejectedValue(new Error('Sin acceso a estadísticas'))
    await wrapper.find('[data-test="recargar"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="error"]').text()).toBe('Sin acceso a estadísticas')
    expect(wrapper.find('[data-test="cargando"]').text()).toBe('false')
    spy.mockRestore()
  })

  it('la vista pinta tarjetas, barras y valida el rango de fechas', async () => {
    localStorage.setItem('user', JSON.stringify({ rol: 'admin' }))
    const wrapper = mount(EstadisticasView)
    await flushPromises()

    expect(wrapper.find('h1').text()).toBe('Estadísticas')
    expect(wrapper.find('[data-test="desde"]').element.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(wrapper.find('[data-test="hasta"]').element.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(wrapper.find('[data-test="generado-para"]').text()).toContain('admin')
    expect(wrapper.findAll('[data-test="stat-card"]').length).toBeGreaterThan(0)
    expect(wrapper.findAll('[data-test="serie-barras"]').length).toBeGreaterThan(0)
    expect(wrapper.find('[data-test="barra-0"] .barras__relleno').attributes('style')).toContain(
      'width:',
    )
    expect(wrapper.find('[data-test="sin-datos"]').exists()).toBe(false)

    await wrapper.find('[data-test="hasta"]').setValue('2020-01-01')
    await flushPromises()

    expect(wrapper.find('[data-test="rango-invalido"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="recargar"]').attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('[data-test="stat-card"]')).toHaveLength(0)
  })

  it('la estructura queda documentada y el contrato quedó escrito para backend', () => {
    for (const archivo of [
      '../src/api/estadisticas.js',
      '../src/utils/estadisticas.js',
      '../src/composables/useEstadisticas.js',
      '../src/components/estadisticas/StatCard.vue',
      '../src/components/estadisticas/BarrasPorEstado.vue',
      '../src/views/EstadisticasView.vue',
    ]) {
      expect(leer(archivo).length).toBeGreaterThan(0)
    }

    const arquitectura = leer('../src/ARQUITECTURA.md')
    expect(arquitectura).toContain('useEstadisticas.js')
    expect(arquitectura).toContain('estadisticas/')

    const mensaje = leer('../../ArchivosMD/MENSAJE_PARA_BACKEND.md')
    expect(mensaje).toContain('estadisticas_view')
    expect(mensaje).toContain('GET /estadisticas/resumen')
  })
})
