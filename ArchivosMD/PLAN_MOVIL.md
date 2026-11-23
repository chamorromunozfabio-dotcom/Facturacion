# Plan móvil: Ionic Vue + Capacitor

**Decisión (23-11-2026):** iOS y Android con **Ionic Vue + Capacitor**. Flutter queda descartado: reescribiría la app en Dart y perderíamos los 312 tests.
**Estado real:** la carpeta `Movil/` **ya existe y está versionada** desde el commit `a79c029` (envoltorio Capacitor, proyectos `android/` e `ios/`, plugins y `README.md`). La Fase 1 está preparada; no hay que crearla ni volver a agregar la plataforma Android.

## 0. Estructura existente

**Principios vigentes:** un solo código base (sin fork del front); Ionic open source + Capacitor; **no usar Appflow ni Identity Vault** (productos comerciales en retirada), CI propio; los tests siguen siendo la puerta (`npm test` → “Pasa” → commit/push).

```text
Movil/
├─ package.json              scripts: build:web, copy, sync, android, dev:android
├─ capacitor.config.json     appId com.entrega.productos, webDir → ../entrega-productos-front/dist
├─ android/                  proyecto nativo versionado (NO borrar)
├─ ios/                      proyecto nativo versionado (NO borrar)
└─ README.md                 puesta en marcha y solución de problemas

entrega-productos-front/     front Vue: 57 archivos / 312 tests, sin cambios
```

- `webDir` apunta al `dist` del front: **no hay código duplicado**.
- Plugins ya instalados: `@capacitor/filesystem`, `@capacitor/preferences`, `@capacitor/share`.
- `capacitor.config.json` tiene `server.url = http://192.168.20.44:5173` con `cleartext: true`: el WebView carga el Vite de desarrollo y el proxy `/api` resuelve el CORS **sin tocar el backend**. Es solo de desarrollo; se quita en producción.

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

## 2. Fase 1 — WebView funcional (compilado e instalado ✅)

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

- [ ] Verificar login real (`admin@entrega.com` / `Admin123*`).
- [ ] Recargar → `GET /me` mantiene la sesión.
- [ ] Facturas: listado, firma con el dedo y descarga de `FE-0001.pdf`.
- [ ] Avisos flotantes con cierre a los 5 s.
- [ ] iOS: en una Mac, `npx cap run ios`.

## 3. Fase 2 — Capa Ionic (look nativo)

- [ ] Instalar `@ionic/vue@9.0.13` e `ionicons` **en el front** y registrar `IonicVue` en `main.js`.
- [ ] `App.vue` → `IonApp`; `MainLayout.vue` → `IonMenu` + `IonHeader`/`IonContent`.
- [ ] Migrar por módulos: **Login → Facturas → Estadísticas → catálogos**.
  - Login: `IonPage`, `IonInput`, `IonButton`; `useLogin` sigue haciendo `POST /login`.
  - Facturas: `IonList`/`IonCard`, firma en `<canvas>` y modales con `IonModal`.
  - Estadísticas: `StatCard`, `BarrasPorEstado` y `SerieTiempo` siguen siendo CSS puro.
- [ ] No mezclar Lucide e `ionicons` en un mismo componente.

## 4. Funcionalidad nativa (plugins ya disponibles)

- [ ] Firma: conservar data URL PNG, base64 válido y máx. 500 KB; persistir con `@capacitor/filesystem` si hace falta.
- [ ] PDF: `blob` de `FE-0001.pdf` → `@capacitor/filesystem` + `@capacitor/share`.
- [ ] Token: migrar de `localStorage` a `@capacitor/preferences`, sin cambiar el contrato del backend.
- [ ] Permisos nativos solo los necesarios; el canvas con touch basta para firmar.

## 5. Backend y CORS (producción)

- En Fase 1 el WebView carga Vite: el proxy `/api` evita el CORS, igual que en la web.
- En producción no hay proxy: `VITE_API_URL=/api` no sirve dentro del WebView. Opciones:
  1. Apuntar `VITE_API_URL` a `http://192.168.20.49:8000` y pedir al backend los orígenes nativos (`capacitor://localhost` en iOS, `http://localhost` en Android).
  2. Publicar un reverse proxy `/api` y dejar la URL relativa.
- [ ] Escribir el pedido en `ArchivosMD/MENSAJE_PARA_BACKEND.md`: CORS nativo y **refresh token** (el JWT vence a los 60 min). No se modifica el CORS usado por el front web.

## 6. Pruebas y entrega

- [ ] Los tests de `utils/`, `api/`, `composables/` y `stores/` se reutilizan.
- [ ] Agregar mocks de los plugins Capacitor para filesystem/share/preferences.
- [ ] Flujo: `npm test` → “Pasa” → commit y push.
- [ ] Validar en dispositivo: 320/375 px, menú, firma con el dedo, PDF y avisos de 5 s.

## 7. Pendientes

- [ ] Iconos y splash (Capacitor 8 trae assets por defecto; se pueden generar con `@capacitor/assets`).
- [ ] Cuentas de desarrollador (Apple Developer / Google Play).
