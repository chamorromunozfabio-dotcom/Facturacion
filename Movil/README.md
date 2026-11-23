# Movil — Capacitor (Fase 1)

Envoltorio nativo del frontend Vue. **Todo lo móvil vive acá**; el front sigue en `../entrega-productos-front` y no se tocó.

## Estructura

- `capacitor.config.json`: `appId`, `appName`, `webDir` apuntando a `../entrega-productos-front/dist` y `server.url` al Vite de desarrollo.
- `android/`, `ios/`: proyectos nativos generados por Capacitor. Se versionan; sus carpetas de build están en `.gitignore`.
- `package.json`: dependencias y scripts.

## Puesta en marcha con Android Studio (forma preferida)

1. Dejar el Vite levantado en una terminal: `cd ../entrega-productos-front` → `npm run dev -- --host 0.0.0.0`.
2. Abrir Android Studio → **File > Open…** y elegir la carpeta **`Movil/android`** (la que tiene `gradlew`, `settings.gradle` y `build.gradle`). **No** abrir `Movil/` ni la raíz del repo.
3. Si pregunta, aceptar **Use Gradle wrapper** (ya está fijado en 9.5.1).
4. Verificar **File > Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK = 21 (Temurin)**. El proyecto ya trae `org.gradle.java.home` apuntando a JDK 21 en `android/gradle.properties`, pero la configuración del IDE tiene prioridad.
5. Elegir el AVD `Medium_Phone_API_37.0` en la barra de dispositivos y apretar **Run ▶** (o Shift+F10). Android Studio compila e instala el APK.
6. El WebView carga `http://192.168.20.44:5173`, así que usa el proxy `/api` del Vite: **no se tocó el CORS del backend**.

**Si cambiaste código del front**, antes de apretar Run ejecutar `cd Movil && npm run sync` para copiar el `dist` al proyecto nativo. Android Studio **no** hace ese paso.

### Alternativa por terminal

```powershell
cd Movil
npx cap run android --target emulator-5554   # el --target evita el prompt interactivo
```

Para iOS hace falta macOS + Xcode: `npx cap run ios`. Capacitor 8 usa Swift Package Manager, no CocoaPods.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run build:web` | Compila el front (`vite build`). |
| `npm run copy` | Compila y copia los archivos al nativo. |
| `npm run sync` | Compila y actualiza los plugins nativos. |
| `npm run android` | Sincroniza y abre Android Studio. |
| `npx cap run android --target <id>` | Compila e instala en un dispositivo concreto (`adb devices` para ver el id). |

## Solución de problemas

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

- Capacitor **8.6.2**. Plugins instalados para fases posteriores: `filesystem`, `share` y `preferences`.
- La compilación de Fase 1 se verificó con el AVD `Medium_Phone_API_37.0` (API 37 / Android 17).
- `server.url`, `android:usesCleartextTraffic` y `NSAllowsArbitraryLoads` son **solo de desarrollo**; se quitan para producción.
- Si cambia la IP de la PC, actualizar `server.url` en `capacitor.config.json` y volver a `npx cap copy`.
- En producción habrá que definir `VITE_API_URL` directo al backend y pedir el CORS nativo (ver `ArchivosMD/PLAN_MOVIL.md`).
