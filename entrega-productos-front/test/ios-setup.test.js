import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

describe('iOS — proyecto preparado desde Windows', () => {
  it('los scripts iOS están disponibles y usan la CLI de Capacitor', () => {
    const pkg = JSON.parse(leer('../../Movil/package.json'))

    for (const nombre of ['build:web', 'sync:prod', 'sync:ios', 'run:ios', 'ios', 'dev:ios']) {
      expect(pkg.scripts[nombre]).toBeTruthy()
    }
    expect(pkg.scripts['sync:ios']).toContain('cap sync ios')
    expect(pkg.scripts['run:ios']).toContain('cap run ios')
    expect(pkg.scripts['ios']).toContain('cap open ios')
    expect(pkg.devDependencies['@capacitor/ios']).toBeTruthy()
  })

  it('la config de producción no usa server.url y mantiene el origen HTTP', () => {
    const config = JSON.parse(leer('../../Movil/capacitor.config.json'))

    expect(config.server.url).toBeUndefined()
    expect(config.server.androidScheme).toBe('http')
    expect(config.server.cleartext).toBe(true)
    expect(config.webDir).toContain('entrega-productos-front/dist')
  })

  it('el proyecto iOS existe y permite el backend HTTP por App Transport Security', () => {
    const plist = leer('../../Movil/ios/App/App/Info.plist')
    const appDelegate = leer('../../Movil/ios/App/App/AppDelegate.swift')
    const xcode = leer('../../Movil/ios/App/App.xcodeproj/project.pbxproj')

    expect(plist).toContain('NSAppTransportSecurity')
    expect(plist).toContain('NSAllowsArbitraryLoads')
    expect(plist).not.toContain('Quitar para producción')
    expect(appDelegate).toContain('Capacitor')
    expect(xcode).toContain('PBXProject')
  })

  it('la documentación deja claro que iOS se compila en Mac', () => {
    const readme = leer('../../Movil/README.md')
    const plan = leer('../../ArchivosMD/PLAN_MOVIL.md')
    const info = leer('../../indicaciones/info-proyecto.md')

    expect(readme).toContain('npm run run:ios')
    expect(readme).toContain('no ejecutar `npx cap add ios`')
    expect(plan).toContain('npm run run:ios')
    expect(info).toContain('Xcode 26+')
  })
})
