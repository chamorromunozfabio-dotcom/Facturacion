import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

/**
 * En el WebView nativo el <a download> solo muestra el aviso de descarga y el
 * archivo queda en una carpeta interna invisible. Por eso se guarda en el
 * cache de la app y se abre con el visor de PDF del sistema.
 */
export function esPlataformaNativa() {
  return Capacitor.isNativePlatform()
}

/** Convierte el blob del backend en base64 (sin el prefijo data:...). */
export function blobABase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const resultado = String(reader.result || '')
      const coma = resultado.indexOf(',')
      resolve(coma === -1 ? resultado : resultado.slice(coma + 1))
    }
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer el PDF.'))
    reader.readAsDataURL(blob)
  })
}

/** Guarda el PDF y abre el selector para verlo o compartirlo. */
export async function abrirPdfNativo(blob, filename) {
  const data = await blobABase64(blob)
  await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache })
  const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache })
  await Share.share({ files: [uri], title: filename, dialogTitle: 'Abrir PDF' })
  return uri
}
