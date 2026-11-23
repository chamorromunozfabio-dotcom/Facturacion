# Plan móvil: Ionic Vue + Capacitor

**Decisión (23-11-2026):** iOS y Android con **Ionic Vue + Capacitor**. Flutter queda descartado: reescribiría la app en Dart y perderíamos los 312 tests.

## 0. Principios

- Un solo código base: el front actual de Vue/Pinia/Axios. **No hacer un fork**.
- Toda la capa nativa se aísla en la carpeta **`Movil/`**; el front web queda intacto.
- Aprovechar `api/`, `composables/`, `utils/`, `config/` y `stores/` tal cual.
- Los tests siguen siendo la puerta: `npm test` → “Pasa” → commit/push.
- Usar Ionic open source + Capacitor. **No usar Appflow ni Identity Vault** (productos comerciales en retirada). CI propio.

## 1. Arranque (sin cambiar la UI todavía)

- [x] Crear `Movil/` con su `package.json`, `.gitignore` y `capacitor.config.json` (`webDir: ../entrega-productos-front/dist`).
- [x] Instalar Capacitor **8.6.x** y los plugins `filesystem`, `share` y `preferences` dentro de `Movil/`.
- [x] Generar `Movil/android/` e `Movil/ios/` con `npx cap add android` y `npx cap add ios` (Capacitor 8 usa Swift Package Manager, no CocoaPods).
- [x] En desarrollo, apuntar el WebView al Vite que ya usamos (`server.url = http://192.168.20.44:5173`). Así el proxy `/api` sigue funcionando y **no tocamos CORS**. Se agregó `usesCleartextTraffic` (Android) y `NSAllowsArbitraryLoads` (iOS) solo para desarrollo.
- [x] `npm run sync` verificado: compila el front y copia los assets en `android/` e `ios/`.
- [ ] Verificar en emulador/dispositivo: login con cuentas reales, `GET /me` al recargar, listado de facturas, firma y descarga de PDF.
- [ ] Compilar iOS requiere macOS + Xcode; los archivos ya están generados en `Movil/ios/`.
- [ ] Android: instalar SDK (Android Studio) y configurar `ANDROID_HOME`/`ANDROID_SDK_ROOT`. Detalle y solución al error `ERR_SDK_NOT_FOUND` en `Movil/README.md`.

## 2. Capa Ionic (look nativo)

- [ ] Instalar `@ionic/vue` + `ionicons` **en `entrega-productos-front`** (la UI Ionic vive en el código Vue, no en `Movil/`) y registrar `IonicVue` en `src/main.js`.
- [ ] `App.vue` → `IonApp`; `MainLayout.vue` → `IonMenu` + `IonHeader`/`IonContent` (el drawer ya existe en CSS; se cambia por `IonMenu`).
- [ ] Migrar por módulos, en este orden: **Login → Facturas → Estadísticas → catálogos**.
  - Login: `IonPage`, `IonInput`, `IonButton`. `LoginForm` sigue emitiendo `submit` y `useLogin` sigue haciendo `POST /login`.
  - Facturas: `IonList`/`IonCard`, `StatusBadge`, firma en `<canvas>` dentro de `IonContent` y modales con `IonModal`.
  - Estadísticas: `StatCard`, `BarrasPorEstado` y `SerieTiempo` siguen siendo CSS puro, sin librería de gráficos.
- [ ] No mezclar Lucide e `ionicons` dentro de un mismo componente.

## 3. Funcionalidad nativa

- [ ] Firma: conservar la validación actual (data URL PNG, base64 válido, máx. 500 KB); persistir con `@capacitor/filesystem` si hace falta.
- [ ] PDF: el `blob` de `FE-0001.pdf` → `@capacitor/filesystem` + `@capacitor/share` para abrir/compartir.
- [ ] Token: salir de `localStorage` → `@capacitor/preferences` o keystore nativo. Ajustar `src/api/axios.js` y `stores/auth.js` **sin cambiar el contrato del backend**.
- [ ] Permisos nativos solo los necesarios; no hace falta cámara si el canvas con touch basta.

## 4. Backend y CORS (punto clave)

- En **desarrollo** el WebView carga Vite y el proxy `/api` resuelve CORS como hoy.
- En el **build de producción** no existe ese proxy: `VITE_API_URL=/api` no sirve dentro del WebView. Dos opciones:
  1. Apuntar `VITE_API_URL` directo a `http://192.168.20.49:8000` y pedir al backend que permita los orígenes nativos (`capacitor://localhost` en iOS, `http://localhost` en Android).
  2. Publicar un reverse proxy `/api` y dejar la URL relativa.
- [ ] Escribir el pedido en `ArchivosMD/MENSAJE_PARA_BACKEND.md` (regla del equipo): CORS nativo y **refresh token** para no depender del JWT de 60 min.
- No modificar el CORS del front web: la regla anterior de “no tocar CORS” era solo por el proxy de Vite.

## 5. Pruebas y entrega

- [ ] Los tests de `utils/`, `api/`, `composables/` y `stores/` se reutilizan.
- [ ] Agregar mocks de plugins Capacitor para los tests que interactúen con filesystem/share/preferences.
- [ ] Seguir el flujo: `npm test` → “Pasa” → commit y push.
- [ ] Validación visual en dispositivo: 320/375 px, menú/firma con el dedo, PDF y avisos flotantes de 5 s.

## 6. Antes de empezar a codificar

- [ ] Confirmar app id (`com.entrega.productos`) y nombre visible.
- [ ] Definir si la primera entrega es solo WebView funcional (Fase 1) o ya con UI Ionic (Fase 2).
- [ ] Generar iconos y splash con `@capacitor/assets`.
- [ ] Cuentas de desarrollador para publicar (Apple Developer / Google Play).
