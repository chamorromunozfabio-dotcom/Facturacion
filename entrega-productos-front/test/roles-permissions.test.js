import { describe, expect, it } from 'vitest'
import { hasPermission } from '../src/shared/config/permissions'
import { menuItems, visibleMenuFor } from '../src/shared/config/navigation'

const labels = (role) => visibleMenuFor(role).map((item) => item.label)

describe('Test 16 — Permisos y menú definitivos del líder', () => {
  it('admin puede todo', () => {
    expect(hasPermission('admin', 'tipos', 'delete')).toBe(true)
    expect(hasPermission('admin', 'usuarios', 'edit')).toBe(true)
    expect(hasPermission('admin', 'facturas', 'entregar')).toBe(true)
  })

  it('bodeguero gestiona Tipos y Facturas, sin Bodegas ni Usuarios', () => {
    expect(hasPermission('bodeguero', 'tipos', 'view')).toBe(true)
    expect(hasPermission('bodeguero', 'tipos', 'create')).toBe(true)
    expect(hasPermission('bodeguero', 'tipos', 'edit')).toBe(true)
    expect(hasPermission('bodeguero', 'tipos', 'delete')).toBe(true)
    expect(hasPermission('bodeguero', 'bodegas', 'view')).toBe(false)
    expect(hasPermission('bodeguero', 'bodegas', 'create')).toBe(false)
    expect(hasPermission('bodeguero', 'bodegas', 'edit')).toBe(false)
    expect(hasPermission('bodeguero', 'bodegas', 'delete')).toBe(false)
    expect(hasPermission('bodeguero', 'usuarios', 'view')).toBe(false)
    expect(hasPermission('bodeguero', 'roles', 'view')).toBe(false)
  })

  it('bodeguero puede gestionar facturas pero no aceptar ni rechazar', () => {
    expect(hasPermission('bodeguero', 'facturas', 'create')).toBe(true)
    expect(hasPermission('bodeguero', 'facturas', 'entregar')).toBe(true)
    expect(hasPermission('bodeguero', 'facturas', 'recibir')).toBe(true)
    expect(hasPermission('bodeguero', 'facturas', 'aceptar')).toBe(false)
  })

  it('cliente ve Facturas y Estadísticas, y puede aceptar o rechazar', () => {
    expect(labels('cliente')).toEqual(['Inicio', 'Facturas', 'Estadísticas'])
    expect(hasPermission('cliente', 'facturas', 'view')).toBe(true)
    expect(hasPermission('cliente', 'facturas', 'aceptar')).toBe(true)
    expect(hasPermission('cliente', 'facturas', 'rechazar')).toBe(true)
    expect(hasPermission('cliente', 'facturas', 'create')).toBe(false)
    expect(hasPermission('cliente', 'tipos', 'view')).toBe(false)
  })

  it('el menú ya no incluye Órdenes', () => {
    expect(menuItems.map((item) => item.label)).not.toContain('Órdenes')
    expect(menuItems.map((item) => item.to)).toContain('/facturas')
    expect(labels('bodeguero')).not.toContain('Usuarios')
  })
})
