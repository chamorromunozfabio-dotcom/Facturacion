import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'

const esMovil = vi.hoisted(() => vi.fn())
const plugin = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: esMovil } }))
vi.mock('@capacitor/preferences', () => ({ Preferences: plugin }))

import {
  TOKEN_KEYS,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getUser,
  hydrateSession,
  saveTokens,
  saveUser,
} from '../src/config/sessionTokens'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  esMovil.mockReturnValue(false)
  plugin.get.mockResolvedValue({ value: null })
  plugin.set.mockResolvedValue(undefined)
  plugin.remove.mockResolvedValue(undefined)
})

describe('sessionTokens — localStorage en web, Preferences en móvil', () => {
  it('en navegador mantiene el contrato actual de localStorage', async () => {
    await hydrateSession()

    await saveTokens({ accessToken: 'web-1', refreshToken: 'refresh-1' })
    await saveUser({ nombre: 'Ana', rol: 'admin' })

    expect(getAccessToken()).toBe('web-1')
    expect(getRefreshToken()).toBe('refresh-1')
    expect(getUser()).toEqual({ nombre: 'Ana', rol: 'admin' })
    expect(localStorage.getItem('token')).toBe('web-1')
    expect(localStorage.getItem('refresh_token')).toBe('refresh-1')
    expect(plugin.set).not.toHaveBeenCalled()

    await clearSession()
    expect(getAccessToken()).toBe('')
    expect(getUser()).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('en móvil hidrata desde Preferences y expone la misma API síncrona', async () => {
    esMovil.mockReturnValue(true)
    plugin.get.mockImplementation(async ({ key }) => ({
      value:
        key === TOKEN_KEYS.access
          ? 'movil-1'
          : key === TOKEN_KEYS.refresh
            ? 'refresh-1'
            : JSON.stringify({ nombre: 'Ana', rol: 'admin' }),
    }))

    await hydrateSession()

    expect(getAccessToken()).toBe('movil-1')
    expect(getRefreshToken()).toBe('refresh-1')
    expect(getUser()).toEqual({ nombre: 'Ana', rol: 'admin' })
    expect(localStorage.getItem('token')).toBeNull()

    await saveTokens({ accessToken: 'movil-2', refreshToken: 'refresh-2' })
    await saveUser({ nombre: 'Ana', rol: 'bodeguero' })

    expect(plugin.set).toHaveBeenCalledWith({ key: 'token', value: 'movil-2' })
    expect(plugin.set).toHaveBeenCalledWith({ key: 'refresh_token', value: 'refresh-2' })
    expect(plugin.set).toHaveBeenCalledWith({
      key: 'user',
      value: JSON.stringify({ nombre: 'Ana', rol: 'bodeguero' }),
    })
    expect(getAccessToken()).toBe('movil-2')
    expect(getUser().rol).toBe('bodeguero')

    await clearSession()
    expect(plugin.remove).toHaveBeenCalledWith({ key: 'token' })
    expect(plugin.remove).toHaveBeenCalledWith({ key: 'refresh_token' })
    expect(plugin.remove).toHaveBeenCalledWith({ key: 'user' })
    expect(getAccessToken()).toBe('')
    expect(getRefreshToken()).toBe('')
    expect(getUser()).toBeNull()
  })

  it('si Preferences falla, la cache mantiene la sesión actual', async () => {
    esMovil.mockReturnValue(true)
    plugin.set.mockRejectedValue(new Error('Preferences no disponible'))

    await saveTokens({ accessToken: 'sin-disco', refreshToken: 'refresh' })

    expect(getAccessToken()).toBe('sin-disco')
    expect(getRefreshToken()).toBe('refresh')
  })

  it('el store, axios y el arranque pasan por el punto único sin localStorage directo', () => {
    const store = leer('../src/stores/auth.js')
    const axios = leer('../src/api/axios.js')
    const main = leer('../src/main.js')

    expect(store).toContain('getUser()')
    expect(store).toContain('saveUser(')
    expect(store).not.toContain('localStorage')
    expect(axios).toContain('await saveTokens(')
    expect(axios).toContain('await clearSession(')
    expect(main.indexOf('hydrateSession()')).toBeLessThan(main.indexOf('createApp('))
    expect(main.indexOf('hydrateSession()')).toBeLessThan(main.indexOf('useAuthStore('))
  })
})
