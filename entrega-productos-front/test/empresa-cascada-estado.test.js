import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from '../src/shared/ui/DataTable.vue'
import { mockCambiarEstadoEmpresa, mockList, mockUpdate } from '../src/shared/api/mocks'

describe('Cascada y bloqueo de estado por empresa', () => {
  it('suspende en cascada y restaura el estado previo al reactivar la empresa', async () => {
    await mockUpdate('tipos', 2, { estado: false })

    await mockCambiarEstadoEmpresa(1, { estado: 'suspendida' })

    const usuarios = await mockList('usuarios', { empresa_id: 1, limit: 20 })
    const bodegas = await mockList('bodegas', { empresa_id: 1, limit: 20 })
    const tipos = await mockList('tipos', { empresa_id: 1, limit: 20 })
    const usuariosEmpresa = usuarios.data.filter((u) => Number(u.empresa_id) === 1)

    expect(usuariosEmpresa.length).toBeGreaterThan(0)
    expect(usuariosEmpresa.every((u) => u.estado === false && u.empresa_estado === 'suspendida')).toBe(true)
    expect(bodegas.data.every((b) => b.estado === false && b.empresa_estado === 'suspendida')).toBe(true)
    expect(tipos.data.every((t) => t.estado === false && t.empresa_estado === 'suspendida')).toBe(true)

    await expect(mockUpdate('bodegas', 1, { estado: true })).rejects.toThrow(/empresa está suspendida/i)

    await mockCambiarEstadoEmpresa(1, { estado: 'activa' })

    const tiposReactivados = await mockList('tipos', { empresa_id: 1, limit: 20 })
    const tipo1 = tiposReactivados.data.find((t) => t.id === 1)
    const tipo2 = tiposReactivados.data.find((t) => t.id === 2)
    expect(tipo1.estado).toBe(true)
    expect(tipo2.estado).toBe(false)
  })

  it('deshabilita el botón Activar en DataTable cuando la empresa está suspendida', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [
          { key: 'nombre', label: 'Nombre' },
          { key: 'estado', label: 'Estado' },
        ],
        rows: [
          { id: 1, nombre: 'Bodega Central', estado: false, empresa_estado: 'suspendida' },
          { id: 2, nombre: 'Bodega Activa', estado: false, empresa_estado: 'activa' },
        ],
        total: 2,
        canEdit: true,
        canToggleEstado: true,
      },
    })

    const botones = wrapper.findAll('[data-test="toggle-estado"]')
    expect(botones[0].attributes('disabled')).toBeDefined()
    expect(botones[1].attributes('disabled')).toBeUndefined()
  })
})
