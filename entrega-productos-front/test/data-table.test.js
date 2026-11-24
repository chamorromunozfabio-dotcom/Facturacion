import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from '../src/shared/ui/DataTable.vue'

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'direccion', label: 'Dirección' },
]

function mountTable(props = {}) {
  return mount(DataTable, {
    props: {
      columns,
      rows: [{ id: 1, nombre: 'Alimentos', direccion: null }],
      total: 1,
      ...props,
    },
  })
}

describe('Test 9 — DataTable', () => {
  it('muestra encabezados y filas', () => {
    const wrapper = mountTable()

    const headers = wrapper.findAll('th').map((th) => th.text())
    expect(headers).toContain('Nombre')
    expect(headers).toContain('Dirección')
    expect(wrapper.text()).toContain('Alimentos')
    expect(wrapper.text()).toContain('—')
  })

  it('emite update:q al escribir en la búsqueda', async () => {
    const wrapper = mountTable()

    await wrapper.find('[data-test="search"]').setValue('ali')

    expect(wrapper.emitted('update:q')).toEqual([['ali']])
  })

  it('emite update:page al avanzar y retroceder', async () => {
    const wrapper = mountTable({ rows: [], total: 25, page: 2, limit: 10 })

    await wrapper.find('[data-test="prev"]').trigger('click')
    await wrapper.find('[data-test="next"]').trigger('click')

    expect(wrapper.emitted('update:page')).toEqual([[1], [3]])
  })

  it('emite create, edit y delete con la fila correspondiente', async () => {
    const wrapper = mountTable()

    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="edit"]').trigger('click')
    await wrapper.find('[data-test="delete"]').trigger('click')

    expect(wrapper.emitted('create')).toHaveLength(1)
    expect(wrapper.emitted('edit')[0][0]).toMatchObject({ id: 1 })
    expect(wrapper.emitted('delete')[0][0]).toMatchObject({ id: 1 })
  })

  it('muestra un mensaje cuando no hay registros', () => {
    const wrapper = mountTable({ rows: [], total: 0 })

    expect(wrapper.text()).toContain('No hay registros')
  })
})
