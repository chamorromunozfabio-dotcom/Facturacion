# Movil — Capacitor (Fase 1)

Envoltorio nativo del frontend Vue. **Todo lo móvil vive acá**; el front sigue en `../entrega-productos-front` y no se tocó.

## Estructura

- `capacitor.config.json`: `appId`, `appName`, `webDir` apuntando a `../entrega-productos-front/dist` y `server.url` al Vite de desarrollo.
- `android/`, `ios/`: proyectos nativos generados por Capacitor. Se versionan; sus carpetas de build están en `.gitignore`.
- `package.json`: dependencias y scripts.

## Puesta en marcha (Fase 1)

1. Terminal 1: `cd ../entrega-productos-front` y `npm run dev -- --host 0.0.0.0`.
2. Terminal 2: estar en `Movil/` y ejecutar `npx cap run android` (o `npm run android` para abrir Android Studio).
3. El WebView carga `http://192.168.20.44:5173`, así que usa el proxy `/api` del Vite: **no se tocó el CORS del backend**.

Para iOS hace falta macOS + Xcode: `npx cap run ios`. Capacitor 8 usa Swift Package Manager, no CocoaPods.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run build:web` | Compila el front (`vite build`). |
| `npm run copy` | Compila y copia los archivos al nativo. |
| `npm run sync` | Compila y actualiza los plugins nativos. |
| `npm run android` | Sincroniza y abre Android Studio. |
| `npx cap run android` | Compila e instala en emulador/dispositivo. |

## Solución de problemas

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

- Capacitor **8.6.x**. Plugins instalados para fases posteriores: `filesystem`, `share` y `preferences`.
- `server.url`, `android:usesCleartextTraffic` y `NSAllowsArbitraryLoads` son **solo de desarrollo**; se quitan para producción.
- Si cambia la IP de la PC, actualizar `server.url` en `capacitor.config.json` y volver a `npx cap copy`.
- En producción habrá que definir `VITE_API_URL` directo al backend y pedir el CORS nativo (ver `ArchivosMD/PLAN_MOVIL.md`).
