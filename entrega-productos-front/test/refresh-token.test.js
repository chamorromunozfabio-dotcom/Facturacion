import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import api from '../src/shared/api/axios'

const adapterOriginal = api.defaults.adapter

function ok(config, data = { ok: true }) {
  return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config })
}

function unauthorized(config) {
  const error = new Error('Unauthorized')
  error.config = config
  error.response = { status: 401, data: { detail: 'Token vencido' }, config }
  return error
}

function adapterQueRenueva(llamadas) {
  return (config) => {
    if (config.url === '/refresh') {
      llamadas.refresh += 1
      return ok(config, {
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        token_type: 'bearer',
      })
    }
    if (config._reintentado) {
      llamadas.reintentos.push(config)
      return ok(config)
    }
    return Promise.reject(unauthorized(config))
  }
}

describe('Refresh token en el cliente HTTP', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/login')
  })

  afterEach(() => {
    localStorage.clear()
    api.defaults.adapter = adapterOriginal
    window.history.pushState({}, '', '/login')
  })

  it('renueva los tokens y reintenta la petición original', async () => {
    localStorage.setItem('token', 'access-1')
    localStorage.setItem('refresh_token', 'refresh-1')
    const llamadas = { refresh: 0, reintentos: [] }
    api.defaults.adapter = adapterQueRenueva(llamadas)

    await api.get('/me')

    expect(llamadas.refresh).toBe(1)
    expect(llamadas.reintentos).toHaveLength(1)
    expect(llamadas.reintentos[0].headers.Authorization).toBe('Bearer access-2')
    expect(localStorage.getItem('token')).toBe('access-2')
    expect(localStorage.getItem('refresh_token')).toBe('refresh-2')
    expect(localStorage.getItem('sesion_vencida')).toBeNull()
  })

  it('usa una sola renovación para dos peticiones que vencen juntas', async () => {
    localStorage.setItem('token', 'access-1')
    localStorage.setItem('refresh_token', 'refresh-1')
    const llamadas = { refresh: 0, reintentos: [] }
    api.defaults.adapter = adapterQueRenueva(llamadas)

    await Promise.all([api.get('/me'), api.get('/facturas')])

    expect(llamadas.refresh).toBe(1)
    expect(llamadas.reintentos).toHaveLength(2)
    expect(llamadas.reintentos.map((config) => config.headers.Authorization)).toEqual([
      'Bearer access-2',
      'Bearer access-2',
    ])
  })

  it('cierra la sesión si el refresh es inválido y no vuelve a intentarlo', async () => {
    localStorage.setItem('token', 'access-1')
    localStorage.setItem('refresh_token', 'refresh-viejo')
    localStorage.setItem('user', JSON.stringify({ nombre: 'Ana' }))
    const llamadas = { refresh: 0 }
    api.defaults.adapter = (config) => {
      if (config.url === '/refresh') {
        llamadas.refresh += 1
        const error = new Error('Refresh inválido')
        error.config = config
        error.response = {
          status: 401,
          data: { detail: 'Refresh token inválido o vencido' },
          config,
        }
        return Promise.reject(error)
      }
      return Promise.reject(unauthorized(config))
    }

    await expect(api.get('/me')).rejects.toMatchObject({ response: { status: 401 } })

    expect(llamadas.refresh).toBe(1)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('sesion_vencida')).toBe('1')
  })

  it('sin refresh token no llama a /refresh y cierra la sesión', async () => {
    localStorage.setItem('token', 'access-1')
    const llamadas = { refresh: 0 }
    api.defaults.adapter = (config) => {
      if (config.url === '/refresh') llamadas.refresh += 1
      return Promise.reject(unauthorized(config))
    }

    await expect(api.get('/me')).rejects.toMatchObject({ response: { status: 401 } })

    expect(llamadas.refresh).toBe(0)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('sesion_vencida')).toBe('1')
  })

  it('si el reintento vuelve a dar 401 cierra la sesión sin otro refresh', async () => {
    localStorage.setItem('token', 'access-1')
    localStorage.setItem('refresh_token', 'refresh-1')
    const llamadas = { refresh: 0 }
    api.defaults.adapter = (config) => {
      if (config.url === '/refresh') {
        llamadas.refresh += 1
        return ok(config, {
          access_token: 'access-2',
          refresh_token: 'refresh-2',
          token_type: 'bearer',
        })
      }
      return Promise.reject(unauthorized(config))
    }

    await expect(api.get('/me')).rejects.toMatchObject({ response: { status: 401 } })

    expect(llamadas.refresh).toBe(1)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('sesion_vencida')).toBe('1')
  })
})
