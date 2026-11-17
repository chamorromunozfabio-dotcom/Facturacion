import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import api from '../src/api/axios'

const adapterOk = (captured) => (config) => {
  captured.config = config
  return Promise.resolve({
    data: { ok: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })
}

describe('Test 3 — interceptores de Axios', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  afterEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('agrega el token Bearer a cada petición', async () => {
    localStorage.setItem('token', 'abc123')
    const captured = {}

    await api.get('/tipos', { adapter: adapterOk(captured) })

    expect(captured.config.headers.Authorization).toBe('Bearer abc123')
  })

  it('no agrega Authorization si no hay token', async () => {
    const captured = {}

    await api.get('/tipos', { adapter: adapterOk(captured) })

    expect(captured.config.headers.Authorization).toBeUndefined()
  })

  it('ante un 401 limpia token y usuario y propaga el error', async () => {
    localStorage.setItem('token', 'abc123')
    localStorage.setItem('user', JSON.stringify({ nombre: 'Ana' }))
    // Estar ya en /login evita la navegación real (jsdom no soporta location.assign)
    window.history.pushState({}, '', '/login')

    const unauthorized = new Error('Unauthorized')
    unauthorized.response = { status: 401, data: { detail: 'Sin sesión' } }
    unauthorized.config = { headers: {} }

    await expect(
      api.get('/tipos', { adapter: () => Promise.reject(unauthorized) }),
    ).rejects.toMatchObject({ response: { status: 401 } })

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
