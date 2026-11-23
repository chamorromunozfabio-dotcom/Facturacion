import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { hydrateSession } from './config/sessionTokens'
import './assets/main.css'

// En el WebView la sesión vive en Preferences y su lectura es async. Hidratar
// antes de crear el store evita que la app arranque como invitado teniendo
// token guardado. En navegador es un no-op sobre localStorage.
hydrateSession().then(() => {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(IonicVue)

  // Si hay token guardado, validamos la sesión con GET /me.
  // Si venció (60 min), el interceptor 401 limpia la sesión y manda al login.
  const auth = useAuthStore(pinia)
  if (auth.isAuthenticated) {
    auth.fetchMe().catch(() => {})
  }

  app.use(router)
  app.mount('#app')
})
