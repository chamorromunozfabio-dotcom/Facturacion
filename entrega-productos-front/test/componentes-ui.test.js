import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'

import DataTable from '../src/shared/ui/DataTable.vue'
import FacturaForm from '../src/modules/facturas/components/FacturaForm.vue'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

const GENERICOS = [
  'AlertMessage',
  'ConfirmDelete',
  'DataTable',
  'FormModal',
  'PagePlaceholder',
  'SignaturePad',
  'StatusBadge',
]

const DE_FACTURAS = ['FacturaDetail', 'FacturaForm', 'TipoSearch']

describe('Test 55 — Componentes genéricos y de facturas en su estructura modular', () => {
  it('las implementaciones están en shared/ui y modules/facturas/components', () => {
    for (const nombre of GENERICOS) {
      const codigo = leer(`../src/shared/ui/${nombre}.vue`)
      expect(codigo).toContain('<template>')
      expect(codigo).not.toContain('export default Componente')
    }

    for (const nombre of DE_FACTURAS) {
      const codigo = leer(`../src/modules/facturas/components/${nombre}.vue`)
      expect(codigo).toContain('<template>')
      expect(codigo).not.toContain('export default Componente')
    }

    expect(leer('../src/shared/ui/DataTable.vue')).toContain('data-table__search')
    expect(leer('../src/modules/facturas/components/FacturaForm.vue')).toContain('@media (max-width: 700px)')
  })

  it('el mapa explica dónde vive cada pieza', () => {
    const mapa = leer('../src/ARQUITECTURA.md')
    expect(mapa).toContain('shared/ui/')
    expect(mapa).toContain('modules/facturas/components/')
  })

  it('DataTable se renderiza con su buscador', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: 'nombre', label: 'Nombre' }],
        rows: [{ id: 1, nombre: 'Alimentos' }],
      },
    })

    expect(wrapper.find('tbody tr').text()).toContain('Alimentos')
    expect(wrapper.find('[data-test="search"]').exists()).toBe(true)
  })

  it('FacturaForm se renderiza con su contrato', () => {
    const wrapper = mount(FacturaForm, { props: { open: true } })

    expect(wrapper.find('[data-test="factura-form"]').exists()).toBe(true)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Producto *')
  })
})
