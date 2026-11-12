import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { configure } from '@testing-library/react'

// La suite completa comparte CPU entre muchos archivos y algunas pantallas
// cargan contenido y FSRS de forma diferida. Un margen mayor evita fallos por
// contención sin ocultar errores reales.
configure({ asyncUtilTimeout: 5000 })

// VexFlow mide texto con un canvas 2D. jsdom no implementa getContext y
// imprime un error por cada medición; este stub mínimo mantiene los tests
// silenciosos y deterministas.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return {
      font: '',
      measureText: (text: string) => ({
        width: Math.max(0, text.length * 7),
        actualBoundingBoxAscent: 8,
        actualBoundingBoxDescent: 2,
        fontBoundingBoxAscent: 8,
        fontBoundingBoxDescent: 2,
        actualBoundingBoxLeft: 0,
        actualBoundingBoxRight: Math.max(0, text.length * 7),
        alphabeticBaseline: 0,
        emHeightAscent: 8,
        emHeightDescent: 2,
        hangingBaseline: 8,
        ideographicBaseline: 0,
      }),
      save: () => undefined,
      restore: () => undefined,
      translate: () => undefined,
      scale: () => undefined,
      rotate: () => undefined,
      clearRect: () => undefined,
    } as unknown as CanvasRenderingContext2D
  } as unknown as typeof HTMLCanvasElement.prototype.getContext
}
