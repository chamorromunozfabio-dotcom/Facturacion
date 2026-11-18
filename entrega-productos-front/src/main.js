import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Si hay token guardado, validamos la sesión con GET /me.
// Si venció (60 min), el interceptor 401 limpia la sesión y manda al login.
const auth = useAuthStore(pinia)
if (auth.isAuthenticated) {
  auth.fetchMe().catch(() => {})
}

app.use(router)
app.mount('#app')
