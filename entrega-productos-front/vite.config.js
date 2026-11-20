import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || 'http://192.168.20.49:8000'

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // Escucha en todas las tarjetas de red para que otro equipo pueda entrar
      host: '0.0.0.0',
      proxy: {
        // El navegador llama a /api (mismo origen) y Vite lo reenvía al backend.
        // Así no dependemos de los orígenes permitidos por el CORS del backend.
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy) => {
            // Quitamos el Origin del navegador para que FastAPI no lo rechace
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin')
            })
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['test/**/*.test.js'],
      // Los tests unitarios siempre usan mocks, sin importar el .env local
      env: { VITE_USE_MOCKS: 'true' },
    },
  }
})
