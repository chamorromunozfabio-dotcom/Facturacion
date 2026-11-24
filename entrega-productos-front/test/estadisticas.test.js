import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'

import { CATALOGO_PERMISOS, claveDelNombreBackend, tienePermiso } from '../src/shared/config/permissions'
import { menuItems, visibleMenuFor } from '../src/shared/config/navigation'
import { getResumen } from '../src/modules/estadisticas/api/estadisticas'
import estadisticasApi from '../src/modules/estadisticas/api/estadisticas'
import {
  esSerieBarras,
  esSerieLinea,
  formatearValor,
  maximoDe,
  normalizarResumen,
  rangoInvalido,
  rangoPorDefecto,
} from '../src/modules/estadisticas/utils/estadisticas'
import { getErrorMessage } from '../src/shared/api/axios'
import { useEstadisticas } from '../src/modules/estadisticas/composables/useEstadisticas'
import EstadisticasView from '../src/modules/estadisticas/views/EstadisticasView.vue'

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
    setActivePinia(createPinia())
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
      kpis: [],
      filtros_disponibles: {
        empresas: [],
        bodegas: [],
        bodegueros: [],
        tipos: [],
        estados: [],
      },
      desglose_principal: null,
      serie_temporal: [],
      alertas_detalle: [],
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
    const codigo = leer('../src/modules/estadisticas/routes/index.js')
    expect(codigo).toContain("path: 'estadisticas'")
    expect(codigo).toContain("name: 'estadisticas'")
    expect(codigo).toContain("component: () => import('../views/EstadisticasView.vue')")
    expect(codigo).toContain("permission: 'estadisticas:view'")
    // El router global ensambla las rutas desde el módulo.
    expect(leer('../src/router/index.js')).toContain("estadisticasRoutes")
  })

  it('un solo endpoint en modo demo y un resumen distinto por rol', async () => {
    localStorage.setItem('user', JSON.stringify({ rol: 'bodeguero' }))
    const bodeguero = await getResumen({ fecha_inicio: '2026-11-01', fecha_fin: '2026-11-30' })

    expect(bodeguero.periodo.fecha_inicio).toBe('2026-11-01')
    expect(bodeguero.generado_para).toBe('bodeguero')
    expect(bodeguero.kpis.map((kpi) => kpi.clave)).toEqual([
      'por_despachar',
      'sin_firma',
      'completadas',
      'rechazadas',
    ])
    expect(bodeguero.filtros_disponibles.empresas).toEqual([])
    expect(bodeguero.filtros_disponibles.tipos.length).toBeGreaterThan(0)
    expect(bodeguero.desglose_principal.titulo).toBe('Actividad por Tipo de Producto')
    expect(bodeguero.alertas_detalle.length).toBeGreaterThan(0)

    localStorage.setItem('user', JSON.stringify({ rol: 'empresa' }))
    const empresa = await getResumen({})
    expect(empresa.generado_para).toBe('empresa')
    expect(empresa.kpis.map((kpi) => kpi.clave)).toEqual([
      'total_facturas',
      'pendientes_cierre',
      'tasa_aceptacion',
      'tasa_rechazo',
    ])
    expect(empresa.filtros_disponibles.bodegas.length).toBeGreaterThan(0)
    expect(empresa.desglose_principal.titulo).toBe('Rendimiento por Bodega')

    localStorage.setItem('user', JSON.stringify({ rol: 'cliente' }))
    const cliente = await getResumen({})
    expect(cliente.generado_para).toBe('cliente')
    expect(cliente.kpis.map((kpi) => kpi.clave)).toEqual([
      'pendientes_accion',
      'recibidas_total',
      'rechazadas_total',
      'empresas_proveedoras',
    ])
    expect(cliente.desglose_principal.titulo).toBe('Resumen por Empresa Proveedora')

    localStorage.setItem('user', JSON.stringify({ rol: 'admin' }))
    const admin = await getResumen({})
    expect(admin.generado_para).toBe('admin')
    expect(admin.kpis.map((kpi) => kpi.clave)).toEqual([
      'empresas_activas',
      'empresas_pendientes',
      'clientes_globales',
      'tasa_entrega_global',
    ])
    expect(admin.filtros_disponibles.empresas.length).toBeGreaterThan(0)
    expect(admin.desglose_principal.titulo).toBe('Top Empresas por Volumen')
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

  it('la descripción bajo el título se personaliza por rol', async () => {
    const textos = {
      admin: 'Métricas globales de empresas, clientes y operación de la plataforma.',
      empresa: 'Rendimiento consolidado de tus bodegas, entregas y motivos de rechazo.',
      bodeguero: 'Control diario de despachos, firmas pendientes y actividad de tu bodega.',
      cliente: 'Historial personal de facturas recibidas, pendientes y rechazos.',
    }

    for (const [rol, texto] of Object.entries(textos)) {
      localStorage.setItem('user', JSON.stringify({ rol }))
      setActivePinia(createPinia())
      const wrapper = mount(EstadisticasView)
      await flushPromises()

      expect(wrapper.find('.subtitle').text()).toBe(texto)
      wrapper.unmount()
    }
  })

  it('muestra filtros según filtros_disponibles y reconsulta al cambiar un filtro', async () => {
    localStorage.setItem('user', JSON.stringify({ rol: 'empresa' }))
    const spy = vi.spyOn(estadisticasApi, 'getResumen')

    const wrapper = mount(EstadisticasView)
    await flushPromises()

    expect(wrapper.find('[data-test="filtro-empresa-wrap"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="filtro-bodega-wrap"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filtro-bodeguero-wrap"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filtro-tipo-wrap"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="desglose-principal"]').text()).toContain('Rendimiento por Bodega')
    expect(wrapper.find('[data-test="alertas-detalle"]').text()).toContain('FE-0042')
    expect(wrapper.find('[data-test="stat-alerta"]').exists()).toBe(true)

    await wrapper.find('[data-test="filtro-bodega"]').setValue('1')
    await flushPromises()

    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ bodega_id: 1 }))
    expect(wrapper.find('[data-test="limpiar-filtros"]').exists()).toBe(true)

    await wrapper.find('[data-test="limpiar-filtros"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="limpiar-filtros"]').exists()).toBe(false)
    spy.mockRestore()
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
      '../src/modules/estadisticas/api/estadisticas.js',
      '../src/modules/estadisticas/utils/estadisticas.js',
      '../src/modules/estadisticas/composables/useEstadisticas.js',
      '../src/modules/estadisticas/components/StatCard.vue',
      '../src/modules/estadisticas/components/BarrasPorEstado.vue',
      '../src/modules/estadisticas/components/SerieTiempo.vue',
      '../src/modules/estadisticas/views/EstadisticasView.vue',
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
