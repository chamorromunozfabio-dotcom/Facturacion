import { describe, expect, it } from 'vitest'
import { mockList, mockGet, mockCreate, mockUpdate, mockRemove } from '../src/api/mocks'
import { createCrudResource } from '../src/api/crud'

describe('Test 5 — CRUD con mocks', () => {
  it('devuelve la forma acordada: data, total, page y limit', async () => {
    const result = await mockList('tipos')

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
    expect(result.data.map((row) => row.nombre)).toEqual(['Alimentos', 'Bebidas', 'Limpieza'])
  })

  it('pagina correctamente', async () => {
    const result = await mockList('tipos', { page: 2, limit: 2 })

    expect(result.total).toBe(3)
    expect(result.page).toBe(2)
    expect(result.limit).toBe(2)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].nombre).toBe('Limpieza')
  })

  it('busca por texto (q)', async () => {
    const result = await mockList('tipos', { q: 'alim' })

    expect(result.total).toBe(1)
    expect(result.data[0].nombre).toBe('Alimentos')
  })

  it('obtiene, crea, edita y elimina registros', async () => {
    const found = await mockGet('tipos', 2)
    const created = await mockCreate('tipos', { nombre: 'Nuevo tipo' })
    const updated = await mockUpdate('tipos', 5, { nombre: 'Tipo editado' })
    const removed = await mockRemove('tipos', 5)

    expect(found.nombre).toBe('Bebidas')
    expect(created).toMatchObject({ nombre: 'Nuevo tipo' })
    expect(created.id).toBeDefined()
    expect(updated).toEqual({ id: 5, nombre: 'Tipo editado' })
    expect(removed).toHaveProperty('detail')
  })

  it('createCrudResource usa los mocks cuando están activos', async () => {
    const tipos = createCrudResource('tipos')

    const result = await tipos.list({ page: 1, limit: 2 })

    expect(result.total).toBe(3)
    expect(result.data).toHaveLength(2)
  })
})
