# Plan móvil: Ionic Vue + Capacitor

**Decisión (23-11-2026):** iOS y Android con **Ionic Vue + Capacitor**. Flutter queda descartado: reescribiría la app en Dart y perderíamos los tests actuales (352 hoy).
**Estado real:** la carpeta `Movil/` **ya existe y está versionada** desde el commit `a79c029` (envoltorio Capacitor, proyectos `android/` e `ios/`, plugins y `README.md`). Fase 1 y Fase 2 cerradas y validadas; no hay que crearla ni volver a agregar plataformas (`cap add android`/`cap add ios` están prohibidos).

## 0. Estructura existente

**Principios vigentes:** un solo código base (sin fork del front); Ionic open source + Capacitor; **no usar Appflow ni Identity Vault** (productos comerciales en retirada), CI propio; los tests siguen siendo la puerta (`npm test` → “Pasa” → commit/push).

```text
Movil/
├─ package.json              scripts: build:web, copy, sync, sync:prod, run:prod, android,
│                            dev:android, sync:ios, run:ios, ios, dev:ios
├─ capacitor.config.json     appId com.entrega.productos, webDir → ../entrega-productos-front/dist
├─ android/                  proyecto nativo versionado (NO borrar)
├─ ios/                      proyecto nativo versionado (NO borrar)
└─ README.md                 puesta en marcha y solución de problemas

entrega-productos-front/     front Vue: 67 archivos / 352 tests; Fase 2: modales, adaptadores, layout,
                             permisos y sesión en Preferences
```

- `webDir` apunta al `dist` del front: **no hay código duplicado**.
- Plugins ya instalados: `@capacitor/filesystem`, `@capacitor/preferences`, `@capacitor/share`.
- `capacitor.config.json` **no tiene `server.url`**: en producción el WebView sirve el `dist` desde `http://localhost` (`androidScheme: "http"` + `cleartext: true`). El modo Vite quedó como referencia en `capacitor.config.dev.json`. El CORS del front web no se tocó.

## 1. Qué se instaló / qué falta preparar

Ya ejecutado y verificado en la PC: `npm install` (0 vulnerabilidades); **JDK 21 Temurin** instalado y `JAVA_HOME` / `ANDROID_HOME` / `ANDROID_SDK_ROOT` configurados; **SDK Platform 36 + Build-Tools 36** instalados; AVD `Medium_Phone_API_37.0` arrancado.

| Destino | Requisitos |
|---|---|
| **Android (esta PC)** | Node 22.18+; **JDK 21** (el JDK 25/27 de Android Studio no sirve); **Android Studio Otter 2025.2.1+** con SDK Platform **36** y Build-Tools; emulador o celular con depuración USB (`adb devices`) |
| **iOS** | macOS + **Xcode 26+** y command line tools (iOS 15+). Capacitor 8 usa **Swift Package Manager**, no CocoaPods. Cuenta Apple Developer para dispositivo/TestFlight/App Store. iOS no se compila en Windows. |

Incidencias resueltas (detalle en `Movil/README.md`):

- `JAVA_HOME is not set` → instalar Temurin 21 y **reabrir PowerShell**.
- AGP 8.13 + Gradle 9.7.1 → error `InternalProblems` (API eliminada en Gradle 9.6). Wrapper fijado en **Gradle 9.5.1** con `networkTimeout=120000`. No subir a 9.6+ sin migrar a AGP 9.x.
- Android Studio generó `gradle/gradle-daemon-jvm.properties` con `toolchainVersion=25`; se ajustó a **21** porque ese criteria gana sobre `org.gradle.java.home`. Verificado `assembleDebug` con launcher JBR 25 → **BUILD SUCCESSFUL**.
- Falta de Platform 36 → `android.exe sdk install platforms/android-36`.
- `npx cap run android` sin `--target` muestra un prompt interactivo; usar `--target <id>`.

## 2. Fase 1 — WebView funcional (cerrada ✅)

**No ejecutar `npx cap add android`**: la plataforma ya existe y por eso sale `[error] android platform already exists`. Ese comando es solo para crear el proyecto por primera vez.

Procedimiento preferido (Android Studio):

1. Terminal: `cd ..\entrega-productos-front` → `npm run dev -- --host 0.0.0.0`.
2. Android Studio → **File > Open…** → carpeta **`Movil/android`** (aceptar *Use Gradle wrapper*).
3. Confirmar **Gradle JDK = 21 Temurin** en *Settings > Build Tools > Gradle* (el proyecto ya fija `org.gradle.java.home` en `gradle.properties`).
4. Elegir el AVD `Medium_Phone_API_37.0` y apretar **Run ▶**.
5. Si cambió el front, antes correr `cd Movil && npm run sync` para actualizar los assets.

Alternativa por terminal (desde `Movil`, con PowerShell reabierto):

```powershell
npx cap run android --target emulator-5554
```

Resultado verificado: `√ Running Gradle build in 329.61s` → `√ Deploying app-debug.apk to emulator-5554`. `adb` confirma `com.entrega.productos/.MainActivity` en primer plano y el logcat muestra `[vite] connected`.

- [x] Verificar login real (`admin@entrega.com` / `Admin123*`).
- [x] Recargar → `GET /me` mantiene la sesión.
- [x] Facturas: listado y firma con el dedo verificados en el emulador.
- [x] PDF nativo validado: se guarda en cache y se abre con `Share`. Sin visor instalado, compartir a **Imprimir** muestra la factura correctamente.
- [x] `pdfNativo.js` reutiliza la apertura en curso: un doble toque en **PDF** ya no dispara dos `Share.share` (`Can't share while sharing is in progress`).
- [x] Ajustes visuales web: los `IonButton` llevan `border: 0` en el host (sin doble marco) y la card de Facturas restaura `gap: 16px` entre filtro Estado y tabla.
- [x] Scroll en navegador restaurado (causa raíz): `IonApp` inyecta `.ion-page` (`position:absolute` + `contain:size`) en el host y saca todo el contenido del flujo, así que **ninguna** pantalla scrolleaba. `App.vue` separa plataformas: en móvil usa `IonApp`, en navegador usa `<RouterView />` directo. `test/app-plataforma.test.js` lo verifica. El parche de `overflow` en `main.css` no sirvió y fue revertido.
- [x] Avisos flotantes con cierre a los 5 s y cierre manual verificado.
- [x] iOS preparado en Windows: proyecto `ios/` versionado, scripts `sync:ios`/`run:ios`/`ios`, ATS configurado para el backend HTTP y bundle sincronizado. Falta compilar y firmar en una Mac con `npm run run:ios`.

## 3. Fase 2 — Capa Ionic (look nativo)

- [x] Instalar `@ionic/vue@9.0.13` e `ionicons` **en el front** y registrar `IonicVue` en `main.js` (junto con `core.css` y `normalize.css`).
- [x] `App.vue` → `IonApp` solo en móvil; `MainLayout.vue` delega en `LayoutBase.vue`, que mantiene el grid web y usa `IonMenu` + `IonHeader`/`IonToolbar`/`IonContent` en el WebView. `test/layout-base.test.js` cubre ambas ramas.
- [x] Migrar por módulos: **Login → Facturas → Estadísticas → catálogos → Permisos**.
  - [x] Login: `IonPage`, `IonContent`, `IonInput`, `IonButton`; `useLogin` sigue haciendo `POST /login` con `{ correo, contrasena }`. `@ion-blur` reemplaza a `@blur`; `test/setup-ionic.js` mantiene los tests con inputs nativos. **Validado en emulador** (23-11-2026).
  - [x] Facturas: solo `IonList`/`IonButton` en las acciones. Se quitaron los `IonCard` porque cambiaban color/fuente y agregaban una card que la vista no tenía; `main.css` alinea `--ion-font-family` con el resto de los menús. `useFacturas`, `data-test` y la alerta flotante (`z-index: 100`, `position: static` en ≤768px) intactos. Firma en `<canvas>` conservada.
  - [x] Los seis diálogos (detalle, firma, rechazo, `FacturaForm`, `ConfirmDelete` y `FormModal`) usan `ModalBase.vue`: `IonModal` en móvil y el markup HTML original en navegador (Ionic necesita `IonApp` para presentar overlays y eso rompía el scroll web). `useModalA11y`, el foco al abrir y todos los `data-test` intactos. `ConfirmDelete` conserva `role="alertdialog"` y su evento `cancel`. `test/modal-base.test.js` cubre ambas ramas y el contrato de los seis.
  - [x] Estadísticas y catálogos: nuevos adaptadores `BotonBase.vue` y `CampoNative.vue` dejan el `<button>`/`<input>` original en navegador y usan `IonButton`/`IonInput` en el WebView. Aplicados a `EstadisticasView` (fechas y Actualizar) y a los compartidos `DataTable` (buscar, crear, editar, borrar, paginar), `FormModal` y `ConfirmDelete`. `StatCard`, `BarrasPorEstado` y `SerieTiempo` siguen siendo CSS puro; no se agregó `ionicons`. `test/componentes-base.test.js` cubre ambas ramas.
  - [x] Permisos: buscador, limpiar, selección de usuario, acciones masivas, cambiar usuario, descartar y confirmar usan `BotonBase`/`CampoNative`. Los checks siguen siendo nativos (Ionic no tiene equivalente con el mismo contrato `checked`/`change`). Sin `ionicons`.
- [ ] No mezclar Lucide e `ionicons` en un mismo componente.

## 4. Funcionalidad nativa (plugins ya disponibles)

- [ ] Firma: conservar data URL PNG, base64 válido y máx. 500 KB; persistir con `@capacitor/filesystem` si hace falta.
- [x] PDF: `blob` de `FE-0001.pdf` → `@capacitor/filesystem` + `@capacitor/share` (validado en emulador vía compartir/Imprimir).
- [x] Refresh token integrado en `axios.js` y el store: renovación única, reintento y guardado del refresh rotado (tests 62/63).
- [x] Token: migrar de `localStorage` a `@capacitor/preferences` usando `src/config/sessionTokens.js` como único punto de cambio, sin tocar el contrato del backend. En web sigue `localStorage`; en móvil se hidrata antes de crear el store y la cache mantiene la API síncrona de axios. `test/session-preferences.test.js` cubre ambas ramas.
- [ ] Permisos nativos solo los necesarios; el canvas con touch basta para firmar.

## 5. Backend y CORS (producción)

- En Fase 1 el WebView cargaba Vite: el proxy `/api` evitaba el CORS, igual que en la web. Ese modo sigue disponible con `npm run dev:android` (live-reload) y con `capacitor.config.dev.json` como referencia.
- En producción no hay proxy: se eligió apuntar `VITE_API_URL` directo al backend en `entrega-productos-front/.env.production`. La alternativa de reverse proxy `/api` queda descartada por ahora.
- [x] Pedido escrito en `ArchivosMD/MENSAJE_PARA_BACKEND.md` (23-11-2026): CORS nativo + **refresh token**. No se modifica el CORS usado por el front web.
- [x] Respuesta del backend recibida en `ArchivosMD/cambios-backend-movil.md` (23-11-2026): CORS nativo sumado y `POST /refresh` con rotación de 7 días.
- [x] `server.url` quitado de `Movil/capacitor.config.json`; `.env.production` apunta a `http://192.168.20.49:8000`; scripts `sync:prod` y `run:prod` agregados.
- [x] Corregido el `Network Error` del primer build: Capacitor 8 servía por `https://localhost` y el WebView bloqueaba el backend HTTP por Mixed Content. Se agregó `server.androidScheme: "http"` + `cleartext: true` y se verificó el CORS real del backend para `Origin: http://localhost` (200 en preflight).
- [x] Validar en el emulador el build corregido (23-11-2026): login, facturas, PDF y renovación de sesión. El refresh se probó forzando un 401 desde la consola de la WebView (`localStorage.setItem('token','invalido')`): renovó y entró solo; al invalidar también `refresh_token` apareció el aviso de sesión vencida. Adelantar la hora no sirve porque el `exp` lo valida el backend.

## 6. Pruebas y entrega

- [ ] Los tests de `utils/`, `api/`, `composables/` y `stores/` se reutilizan.
- [x] Mock de `@capacitor/preferences` en `test/session-preferences.test.js` para probar la rama nativa sin WebView (filesystem/share se validan en emulador).
- [ ] Flujo: `npm test` → “Pasa” → commit y push.
- [ ] Validar en dispositivo: 320/375 px, menú, firma con el dedo, PDF y avisos de 5 s.

## 7. Pendientes

- [ ] Iconos y splash (Capacitor 8 trae assets por defecto; se pueden generar con `@capacitor/assets`).
- [ ] Cuentas de desarrollador (Apple Developer / Google Play).
