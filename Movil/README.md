# Movil — Capacitor (Fase 2 cerrada / builds de Android e iOS)

Envoltorio nativo del frontend Vue. **Todo lo móvil vive acá**; el front sigue en `../entrega-productos-front` y no se duplica.

## Estructura

- `capacitor.config.json`: configuración de **producción**: `appId`, `appName` y `webDir` apuntando a `../entrega-productos-front/dist`. **No tiene `server.url`**, así que el WebView carga los archivos incluidos en el APK. Sí tiene `server.androidScheme: "http"` y `cleartext: true`: Capacitor 8 sirve por `https://localhost` por defecto y eso bloqueaba el backend HTTP por Mixed Content.
- `capacitor.config.dev.json`: copia de referencia con `server.url = http://192.168.20.44:5173` para el flujo viejo con Vite. Capacitor no la lee automáticamente.
- `android/`, `ios/`: proyectos nativos generados por Capacitor. Se versionan; sus carpetas de build están en `.gitignore`.
- `package.json`: dependencias y scripts (`sync:prod`, `run:prod`, `dev:android`, `sync:ios`, `run:ios`, `ios`).

## Build de producción (el que se usa ahora)

La app ya no depende del Vite: `entrega-productos-front/.env.production` apunta `VITE_API_URL` directo a `http://192.168.20.49:8000`. El backend habilitó CORS para `http://localhost` (Android) y `capacitor://localhost` (iOS), así que no hace falta proxy.

### Desde terminal (recomendado)

```powershell
cd Movil
npm run run:prod
```

Ese comando compila el front en modo producción, sincroniza los assets y despliega en `emulator-5554`. Si el dispositivo cambia, primero `adb devices` y después:

```powershell
npx cap run android --target <id>
```

### Desde Android Studio

1. `cd Movil && npm run sync:prod` (compila y copia el `dist`; Android Studio **no** hace este paso).
2. Abrir Android Studio → **File > Open…** → carpeta **`Movil/android`** (la que tiene `gradlew`, `settings.gradle` y `build.gradle`). **No** abrir `Movil/` ni la raíz.
3. Si pregunta, aceptar **Use Gradle wrapper** (fijado en 9.5.1).
4. Verificar **Gradle JDK = 21 (Temurin)**. El proyecto ya trae `org.gradle.java.home` en `android/gradle.properties`, pero el IDE tiene prioridad; si regenera `toolchainVersion=25`, volver a 21.
5. Elegir el AVD `Medium_Phone_API_37.0` y apretar **Run ▶**.

## Desarrollo con Vite (live-reload)

Para seguir el flujo anterior sin editar la config de producción:

```powershell
cd ../entrega-productos-front
npm run dev -- --host 0.0.0.0
```

En otra terminal:

```powershell
cd Movil
npm run dev:android
```

`--livereload --external` sobrescribe `server.url` solo para esa corrida. Si querés el modo anterior dentro de Android Studio, copiá `capacitor.config.dev.json` sobre `capacitor.config.json`, corré `npm run sync`, hacé Run y después restaurá la config de producción.

### Alternativa por terminal

```powershell
cd Movil
npx cap run android --target emulator-5554   # el --target evita el prompt interactivo
```

## iOS (preparado en Windows, compilado en Mac)

El proyecto `ios/` ya está generado y versionado; **no ejecutar `npx cap add ios`**. Desde Windows se puede compilar el front y sincronizar los assets. La compilación, el simulador y la firma requieren **macOS + Xcode 26+** y cuenta Apple Developer:

```powershell
cd Movil
npm run sync:ios     # compila el front y copia el bundle + plugins al proyecto iOS
npm run run:ios      # solo en la Mac: sincroniza y abre el simulador
npm run ios          # solo en la Mac: sincroniza y abre Xcode
```

Capacitor 8 usa **Swift Package Manager**, no CocoaPods. `Info.plist` conserva `NSAllowsArbitraryLoads` porque el backend sigue siendo HTTP; cuando pase a HTTPS se puede quitar.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run build:web` | Compila el front con `.env.production` (`vite build`, modo producción por defecto). |
| `npm run sync:prod` | Compila y sincroniza los assets nativos para producción. |
| `npm run run:prod` | `sync:prod` + instala en `emulator-5554`. |
| `npm run dev:android` | Live-reload contra el Vite (desarrollo). |
| `npm run android` | Sincroniza en producción y abre Android Studio. |
| `npx cap run android --target <id>` | Compila e instala en otro dispositivo (`adb devices`). |
| `npm run sync:ios` | Compila el front y sincroniza assets/plugins en `ios/` (funciona en Windows). |
| `npm run run:ios` | Sincroniza y abre el simulador (solo Mac). |
| `npm run ios` | Sincroniza y abre Xcode (solo Mac). |

## Solución de problemas

### `Network Error` en el login de la app instalada

Si en logcat aparece `Mixed Content: The page at 'https://localhost/...' ... requested an insecure XMLHttpRequest endpoint 'http://192.168.20.49:8000/login'`, Capacitor está sirviendo el bundle por HTTPS. La configuración de producción ya incluye `server.androidScheme: "http"`; alcanza con correr `npm run sync:prod` y reinstalar. El backend acepta CORS para `http://localhost`; con `https://localhost` también fallaría por origen no permitido.

### `JAVA_HOME is not set` / Gradle no arranca

Capacitor 8 necesita **JDK 21** (no sirve el JDK 25/27 que trae Android Studio). En esta PC se instaló Temurin 21 en `C:\Program Files\Eclipse Adoptium\jdk-21.0.13.10002-hotspot` y se configuraron las variables de usuario. **Reabrir PowerShell** después de instalarlas.

### AGP 8.13 + Gradle 9.7.1 → `InternalProblems`

Android Gradle Plugin 8.x usa una API interna eliminada en Gradle 9.6. El wrapper quedó fijado en **Gradle 9.5.1** (`android/gradle/wrapper/gradle-wrapper.properties`) con `networkTimeout=120000` por la descarga lenta. No actualizar a 9.6+ sin migrar antes a AGP 9.x.

Además, Android Studio había generado `android/gradle/gradle-daemon-jvm.properties` con `toolchainVersion=25`. Ese criteria tiene prioridad sobre `org.gradle.java.home`, así que se cambió a **`toolchainVersion=21`**. Si Android Studio lo vuelve a generar en 25, corregilo a 21 o el daemon usará el JBR 25 y AGP puede fallar.

### Falta la plataforma Android 36

`android/variables.gradle` pide `compileSdkVersion = 36`. Si el SDK solo tiene la 37:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
& "$env:ANDROID_HOME\cmdline-tools\latest\bin\android.exe" sdk install platforms/android-36
```

### `ERR_SDK_NOT_FOUND: No valid Android SDK root found`

Significa que `native-run` no encuentra el Android SDK. La copia de archivos sí funcionó; solo falta configurar el entorno:

1. Instalar **Android Studio** → *SDK Manager* → instalar un *SDK Platform* (por ejemplo API 35) y *Android SDK Build-Tools*.
2. Anotar la ruta que muestra *Android SDK Location* (típica: `C:\Users\<usuario>\AppData\Local\Android\Sdk`).
3. En PowerShell, para la sesión actual:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin"
adb version
```

4. Para que quede permanente, ejecutar en una terminal nueva y **reabrir PowerShell**:

```powershell
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
setx ANDROID_SDK_ROOT "$env:LOCALAPPDATA\Android\Sdk"
```

5. Crear un emulador en *Device Manager* o conectar un celular con depuración USB, verificar con `adb devices` y volver a correr `npx cap run android`.

**Atajo:** si ya tenés Android Studio, podés saltarte `native-run` con `npx cap open android` y apretar el botón **Run** desde el IDE.

## Notas

- Capacitor **8.6.2**. Plugins disponibles: `filesystem`, `share` y `preferences`.
- Fase 1 y Fase 2 validadas en el AVD `Medium_Phone_API_37.0` (API 37 / Android 17).
- En producción se quitó `server.url`; el WebView sirve `dist` desde `http://localhost` gracias a `androidScheme: "http"`. Capacitor 8 usa `https` por defecto y provocaba Mixed Content contra el backend HTTP.
- El backend sumó `http://localhost` y `capacitor://localhost` al CORS; el CORS del front web no cambió.
- Si cambia la IP del backend, actualizar `VITE_API_URL` en `entrega-productos-front/.env.production` y correr `npm run sync:prod`.
- Para probar el refresh token sin esperar 60 min: **no adelantes la hora del emulador** (el `exp` del JWT lo valida el backend con su reloj, no el del dispositivo). En la **web** podés forzar `localStorage.setItem('token', 'invalido'); location.reload()` y la app renueva sola; si invalidás también `refresh_token`, aparece el aviso de sesión vencida. En el **APK** la sesión ya no está en `localStorage` sino en `@capacitor/preferences` (ver `src/config/sessionTokens.js`), así que el flujo se cubre con `test/refresh-token.test.js` y `test/session-preferences.test.js`; para empezar de cero en el emulador, limpiá los datos de la app.
