import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/** jsdom no calcula media queries: verificamos que las reglas estén en el fuente. */
function leer(ruta) {
  return readFileSync(new URL(ruta, import.meta.url), 'utf8')
}

describe('Test 50 — Reglas responsive para distintos dispositivos', () => {
  it('la página declara el viewport para móviles', () => {
    expect(leer('../index.html')).toContain(
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    )
  })

  it('el menú se apila y se desplaza en tablet', () => {
    const css = leer('../src/layouts/MainLayout.vue')

    expect(css).toContain('@media (max-width: 768px)')
    expect(css).toContain('grid-template-columns: 1fr')
    expect(css).toContain('overflow-x: auto')
  })

  it('el buscador de tablas cabe en celulares chicos', () => {
    const css = leer('../src/components/DataTable.vue')

    expect(css).toContain('@media (max-width: 480px)')
    expect(css).toMatch(/\.data-table__search input\s*\{[^}]*min-width:\s*0/s)
  })

  it('el login reduce su tarjeta en celulares chicos', () => {
    const css = leer('../src/views/LoginView.vue')

    expect(css).toContain('@media (max-width: 480px)')
    expect(css).toMatch(/\.login-card\s*\{[^}]*padding:\s*22px 18px/s)
  })

  it('la alerta de facturas deja de flotar en tablet', () => {
    const css = leer('../src/views/FacturaView.vue')

    expect(css).toMatch(/@media \(max-width: 768px\)[\s\S]*\.alert-flotante[\s\S]*position:\s*static/)
  })

  it('el formulario de factura pasa a una columna en celulares', () => {
    expect(leer('../src/components/FacturaForm.vue')).toContain('@media (max-width: 700px)')
  })
})
