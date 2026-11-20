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
  esSerieLinea,
  formatearValor,
  maximoDe,
  normalizarResumen,
  rangoInvalido,
  rangoPorDefecto,
} from '../src/utils/estadisticas'
import { getErrorMessage } from '../src/api/axios'
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
    expect(esSerieLinea({ tipo: 'linea', datos: [{ etiqueta: '2026-11-01', valor: 0 }] })).toBe(true)
    expect(esSerieLinea({ tipo: 'linea', datos: [] })).toBe(false)
    expect(esSerieLinea({ tipo: 'barras', datos: [{ valor: 1 }] })).toBe(false)
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
    expect(bodeguero.tarjetas.map((tarjeta) => tarjeta.clave)).toEqual([
      'facturas',
      'facturado',
      'pendientes',
      'rechazadas',
      'bodegas',
      'tipos',
    ])
    expect(bodeguero.series.map((serie) => serie.clave)).toEqual([
      'por_estado',
      'por_fecha',
      'por_bodega',
      'top_productos',
    ])
    expect(bodeguero.series.find((serie) => serie.clave === 'por_fecha').tipo).toBe('linea')

    localStorage.setItem('user', JSON.stringify({ rol: 'cliente' }))
    const cliente = await getResumen({})
    expect(cliente.generado_para).toBe('cliente')
    expect(cliente.tarjetas.map((tarjeta) => tarjeta.clave)).not.toContain('bodegas')
    expect(cliente.tarjetas.map((tarjeta) => tarjeta.clave)).toContain('facturado')
    expect(cliente.series.map((serie) => serie.clave)).toEqual(['por_estado', 'por_fecha'])
    expect(cliente.series[0].datos.map((dato) => dato.etiqueta)).not.toContain('Emitida')

    localStorage.setItem('user', JSON.stringify({ rol: 'admin' }))
    const admin = await getResumen({})
    expect(admin.generado_para).toBe('admin')
    expect(admin.tarjetas.map((tarjeta) => tarjeta.clave)).toContain('bodegas_activas')
    expect(admin.tarjetas.map((tarjeta) => tarjeta.clave)).toContain('usuarios_activos')
    expect(cliente.tarjetas.map((tarjeta) => tarjeta.clave)).not.toContain('usuarios_activos')
    expect(bodeguero.tarjetas.map((tarjeta) => tarjeta.clave)).not.toContain('usuarios_activos')
    // El admin ve las cifras globales: suma todos los creadores, no solo el suyo.
    expect(admin.tarjetas.find((tarjeta) => tarjeta.clave === 'facturas').valor).toBeGreaterThan(
      bodeguero.tarjetas.find((tarjeta) => tarjeta.clave === 'facturas').valor,
    )
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
    expect(wrapper.find('[data-test="generado-para"]').exists()).toBe(false)
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

  it('pinta la serie por_fecha (linea) del backend real y respeta su contrato', async () => {
    const respuestaReal = {
      periodo: { desde: '2026-11-01', hasta: '2026-11-30' },
      generado_para: 'admin',
      tarjetas: [
        { clave: 'facturas', etiqueta: 'Facturas', valor: 8, sufijo: '' },
        { clave: 'facturado', etiqueta: 'Facturado', valor: 14796540, sufijo: '$' },
        { clave: 'pendientes', etiqueta: 'Pendientes de firma', valor: 0, sufijo: '' },
        { clave: 'rechazadas', etiqueta: 'Rechazadas', valor: 1, sufijo: '' },
        { clave: 'usuarios_activos', etiqueta: 'Usuarios activos', valor: 6, sufijo: '' },
        { clave: 'bodegas_activas', etiqueta: 'Bodegas activas', valor: 2, sufijo: '' },
      ],
      series: [
        {
          clave: 'por_estado',
          titulo: 'Facturas por estado',
          tipo: 'barras',
          datos: [
            { etiqueta: 'Emitida', valor: 0 },
            { etiqueta: 'Entregada', valor: 0 },
            { etiqueta: 'Firmada', valor: 0 },
            { etiqueta: 'Rechazada', valor: 1 },
            { etiqueta: 'Recibida', valor: 7 },
          ],
        },
        {
          clave: 'por_fecha',
          titulo: 'Facturas en el periodo',
          tipo: 'linea',
          datos: [
            { etiqueta: '2026-11-01', valor: 0 },
            { etiqueta: '2026-11-02', valor: 2 },
          ],
        },
        {
          clave: 'por_bodega',
          titulo: 'Facturado por bodega',
          tipo: 'barras',
          datos: [{ etiqueta: 'Plaza satelite', valor: 13142790 }],
        },
        {
          clave: 'top_productos',
          titulo: 'Productos más vendidos',
          tipo: 'barras',
          datos: [{ etiqueta: 'Papa', valor: 120 }],
        },
      ],
    }

    const spy = vi.spyOn(estadisticasApi, 'getResumen').mockResolvedValue(respuestaReal)
    const wrapper = mount(EstadisticasView)
    await flushPromises()

    expect(wrapper.findAll('[data-test="stat-card"]')).toHaveLength(6)
    expect(wrapper.findAll('[data-test="serie-barras"]')).toHaveLength(3)
    expect(wrapper.findAll('[data-test="serie-linea"]')).toHaveLength(1)
    expect(wrapper.find('[data-test="punto-1"] .serie-tiempo__etiqueta').text()).toBe('02')
    expect(wrapper.find('[data-test="punto-1"] .serie-tiempo__barra').attributes('aria-label')).toBe(
      '2026-11-02: 2',
    )
    expect(wrapper.find('[data-test="sin-datos"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-test="stat-card"]')[1].text()).toContain('14.796.540 $')
    expect(wrapper.find('[data-test="generado-para"]').exists()).toBe(false)
    spy.mockRestore()

    const respuestaCliente = {
      ...respuestaReal,
      generado_para: 'cliente',
      tarjetas: respuestaReal.tarjetas.slice(0, 4),
      series: respuestaReal.series.filter((serie) =>
        ['por_estado', 'por_fecha'].includes(serie.clave),
      ),
    }
    const spyCliente = vi.spyOn(estadisticasApi, 'getResumen').mockResolvedValue(respuestaCliente)
    const cliente = mount(EstadisticasView)
    await flushPromises()

    expect(cliente.findAll('[data-test="serie-barras"]')).toHaveLength(1)
    expect(cliente.findAll('[data-test="serie-linea"]')).toHaveLength(1)
    expect(cliente.find('[data-test="generado-para"]').exists()).toBe(false)
    spyCliente.mockRestore()

    expect(
      getErrorMessage({
        response: { data: { detail: 'hasta: debe ser igual o posterior a desde' } },
      }),
    ).toBe('hasta: debe ser igual o posterior a desde')
  })

  it('la estructura queda documentada y el contrato quedó escrito para backend', () => {
    for (const archivo of [
      '../src/api/estadisticas.js',
      '../src/utils/estadisticas.js',
      '../src/composables/useEstadisticas.js',
      '../src/components/estadisticas/StatCard.vue',
      '../src/components/estadisticas/BarrasPorEstado.vue',
      '../src/components/estadisticas/SerieTiempo.vue',
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
