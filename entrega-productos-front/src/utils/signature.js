/**
 * El canvas de la firma mide 480x180 por dentro, pero en el celular se muestra
 * más chico. Sin este escalado el dedo cae en otro lugar y la firma sale corrida.
 */
export function scalePoint({ x, y }, canvas, rect) {
  const scaleX = canvas?.width && rect.width ? canvas.width / rect.width : 1
  const scaleY = canvas?.height && rect.height ? canvas.height / rect.height : 1
  return { x: x * scaleX, y: y * scaleY }
}
