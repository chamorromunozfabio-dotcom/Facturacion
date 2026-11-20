import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'

import DataTableCompat from '../src/components/DataTable.vue'
import DataTable from '../src/components/ui/DataTable.vue'
import FacturaFormCompat from '../src/components/FacturaForm.vue'
import FacturaForm from '../src/components/facturas/FacturaForm.vue'

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

describe('Test 55 — Componentes ui/facturas y re-exports de compatibilidad', () => {
  it('las implementaciones están en ui/ y facturas/', () => {
    for (const nombre of GENERICOS) {
      const codigo = leer(`../src/components/ui/${nombre}.vue`)
      expect(codigo).toContain('<template>')
      expect(codigo).not.toContain('export default Componente')
    }

    for (const nombre of DE_FACTURAS) {
      const codigo = leer(`../src/components/facturas/${nombre}.vue`)
      expect(codigo).toContain('<template>')
      expect(codigo).not.toContain('export default Componente')
    }

    expect(leer('../src/components/ui/DataTable.vue')).toContain('data-table__search')
    expect(leer('../src/components/facturas/FacturaForm.vue')).toContain('@media (max-width: 700px)')
  })

  it('la raíz solo re-exporta y el mapa lo explica', () => {
    for (const nombre of GENERICOS) {
      const codigo = leer(`../src/components/${nombre}.vue`)
      expect(codigo).toContain(`./ui/${nombre}.vue`)
      expect(codigo).toContain('export default Componente')
    }

    for (const nombre of DE_FACTURAS) {
      const codigo = leer(`../src/components/${nombre}.vue`)
      expect(codigo).toContain(`./facturas/${nombre}.vue`)
      expect(codigo).toContain('export default Componente')
    }

    const mapa = leer('../src/ARQUITECTURA.md')
    expect(mapa).toContain('components/ui/')
    expect(mapa).toContain('re-export')
  })

  it('DataTable se renderiza igual por la ruta vieja y la nueva', () => {
    const props = {
      columns: [{ key: 'nombre', label: 'Nombre' }],
      rows: [{ id: 1, nombre: 'Alimentos' }],
    }

    const compat = mount(DataTableCompat, { props })
    const directo = mount(DataTable, { props })

    expect(compat.find('tbody tr').text()).toContain('Alimentos')
    expect(directo.find('tbody tr').text()).toContain('Alimentos')
    expect(compat.find('[data-test="search"]').exists()).toBe(true)
    expect(directo.find('[data-test="search"]').exists()).toBe(true)
  })

  it('FacturaForm se renderiza igual por la ruta vieja y la nueva', () => {
    const compat = mount(FacturaFormCompat, { props: { open: true } })
    const directo = mount(FacturaForm, { props: { open: true } })

    for (const wrapper of [compat, directo]) {
      expect(wrapper.find('[data-test="factura-form"]').exists()).toBe(true)
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Producto *')
    }
  })
})
