# PRUEBAS MANUALES — Piano Today

Pasos exactos para las comprobaciones que **solo una persona con hardware y oído
real** puede cerrar. Todo lo que se puede verificar en este entorno ya está
cubierto por tests y por las auditorías de `npm run audit`; este documento es lo
que queda pendiente y por qué.

> Cómo usarlo: seguí cada prueba en orden, anotá el resultado en la tabla final
> y, cuando termines, pegá la tabla en `docs/LOG.md` o pasásela al responsable
> del proyecto. La tarea **F6-054** queda `[ ]` hasta que exista ese reporte: el
> documento solo describe el procedimiento, no lo da por hecho.

## Preparación común

1. Instalá dependencias y, si querés escuchar las muestras reales de piano (no el
   sintetizador de respaldo), descargalas una vez:

   ```bash
   npm ci
   npm run fetch:samples
   ```

   `npm run fetch:samples -- --dry-run` confirma que están las 30 muestras. Si
   faltan, la app funciona igual con piano sintetizado: el estado de audio lo
   aclara en la pantalla (`Listo con muestras de piano (Salamander)` vs.
   `Listo con piano sintetizado`).

2. Levantá el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   La URL local aparece en la consola (por defecto `http://localhost:5173/`).
   Usá auriculares o parlantes, subí el volumen del sistema a un nivel cómodo y
   dejá el volumen de la app en el valor por defecto (**−8 dB**).

3. Tené a mano el teclado **Yamaha PSR-373** (o el dispositivo MIDI que uses) y
   su cable USB.

## P1 — Escucha humana de audio, latencia y usabilidad (F1-038)

**Por qué está pendiente.** La revisión de F1-038 fue estática: se comprobó por
código y tests que no queden notas trabadas (`stop`, `releaseAll`, limpieza de
timers), que el metrónomo no derive, que el volumen y el tempo se propaguen y
que exista fallback sin muestras. Lo que no se pudo confirmar es la sensación
real de latencia, el equilibrio de volumen ni la ausencia de artefactos de oído.

**Pasos**

1. Abrí la demo en `#/demo` (en la barra de navegación, **Demo**).
2. Tocá una tecla del piano en pantalla o presioná **Activar audio**. Esperá a
   que el estado pase a `Listo con muestras de piano (Salamander)`.
3. **Latencia:** tocá teclas sueltas y seguidas. La nota debe sonar
   prácticamente al instante; no debe haber un retraso que obligue a esperar ni
   a tocar «adelantado». Anotá si la latencia es molesta.
4. **Notas trabadas:** mantené una nota, soltala, tocá acordes y escalas, y
   después presioná **Detener**. Repetí con el metrónomo encendido y con
   **Repetir**. Ninguna nota debe quedar sonando después de soltar la tecla ni
   tras **Detener**.
5. **Equilibrio de volumen:** con el volumen de la app en −8 dB, reproducí una
   demo de acorde en bloque, una de arpegio y una de metrónomo. El acento del
   metrónomo debe distinguirse sin tapar las notas y ningún elemento debe
   sonar mucho más fuerte que el resto. Probá mover el control **Volumen** en
   `#/ajustes` entre −40 dB y 0 dB y comprobá que el cambio se aplica en la
   siguiente reproducción.
6. **Reproductor de lección:** abrí una lección con ejemplos de audio (por
   ejemplo `#/leccion/lesson.m1-05`) y usá **Escuchar**/**Repetir**. El audio
   debe arrancar solo tras un gesto (nunca al montar la pantalla) y detenerse al
   salir.
7. Anotá cualquier chasquido, corte, nota pegada o desequilibrio.

**Resultado esperado**

- Sin latencia molesta al tocar.
- Ninguna nota queda trabada al soltar, al cambiar de modo ni al detener.
- Volumen equilibrado entre notas, acordes y metrónomo, y control de volumen
  efectivo.

## P2 — Yamaha PSR-373 con el panel de diagnóstico (F6-031, F6-032, F6-033)

**Por qué está pendiente.** La detección, la normalización de mensajes y la
integración con la evaluación están cubiertas con mensajes MIDI simulados; falta
la prueba con el dispositivo físico por USB.

**Conexión**

1. Conectá el **MIDI OUT** del PSR-373 al **MIDI IN** del adaptador USB-MIDI y
   el adaptador a la computadora. Encendé el teclado.
2. Usá **Chrome, Edge o un navegador basado en Chromium**: son los que ofrecen
   Web MIDI. (En Safari y Firefox la app muestra el aviso de soporte y sigue
   funcionando con autoevaluación manual; ver P3.)

**Panel de diagnóstico**

3. Abrí `#/ajustes` (**Ajustes**) y bajá hasta la sección **Diagnóstico MIDI**.
   El panel muestra exactamente lo que ve el navegador:
   - **Web MIDI**: debe decir `disponible`.
   - **Permiso**: `concedido` después de conectar.
   - **Estado**: pasa de `sin conectar` a `escuchando`.
   - **Perfil**: debe decir `Yamaha PSR-373` si se reconoce; si no,
     `MIDI genérico`.
4. Presioná **Conectar entrada MIDI** y aceptá el permiso del navegador cuando
   lo pida.
5. En **Entradas MIDI** debe aparecer el nombre del PSR-373 con estado
   `conectado`. Si no aparece ninguna entrada, seguí el propio aviso del panel
   (revisar cable MIDI OUT → MIDI IN, encender el teclado, reconectar) y probá
   otro puerto USB o cable; en Windows algunos Yamaha necesitan el driver
   oficial.
6. Tocá varias teclas del Yamaha. En **Último mensaje** debe cambiar en cada
   pulsación, mostrando el nombre del puerto, los bytes en hexadecimal y la nota
   (por ejemplo `nota Do4`). Si la última nota cambia al tocar, la app está
   recibiendo MIDI.
7. **Salidas MIDI**: deben listarse si el adaptador expone una salida (o
   `No hay salidas detectadas.` si es solo de entrada); no bloquea el uso.

**Integración con la evaluación**

8. Volvé a una lección con tarea de teclado (por ejemplo
   `#/leccion/lesson.m0-01`), entrá a la tarea y tocá la secuencia pedida en el
   Yamaha. La app debe registrar las pulsaciones y mostrar el feedback de
   secuencia y ritmo (`X de Y pulsaciones acertadas en la secuencia · ritmo Z%`).
9. Comprobá que, al desconectar el teclado o denegar el permiso, la
   **autoevaluación manual sigue activa** y la app no se rompe.

**Resultado esperado**

- El PSR-373 aparece como entrada y se marca `conectado`.
- El último mensaje cambia al tocar, con bytes y nota correctos.
- Las pulsaciones se registran en la evaluación de ejercicios.
- Sin dispositivo (o sin permiso) la autoevaluación manual sigue disponible.

## P3 — Safari (macOS)

**Por qué está pendiente.** El binario de WebKit de Playwright no se pudo
ejecutar en este host (faltan ICU 74 y WPE, y `playwright install-deps` requiere
root). Ver `docs/QA-NAVEGADORES.md`.

**Pasos**

1. Abrí la demo publicada `https://wulflo.github.io/piano-learning/` (o el
   servidor local) en Safari.
2. Recorré una lección, un ejercicio y el repaso; comprobá que el layout y los
   pentagramas se dibujan bien.
3. **Audio:** tocá **Activar audio** y reproducí un ejemplo. Confirmá que suena
   tras el gesto (Safari exige interacción) y que no quedan notas trabadas. En
   Pages la app usa el sintetizador de respaldo, así que lo esperado es
   `Listo con piano sintetizado`.
4. **MIDI:** entrá a `#/ajustes`. Safari no implementa Web MIDI: debe aparecer el
   aviso de soporte y el panel debe indicar `no disponible en este navegador`.
   La autoevaluación manual debe seguir funcionando.
5. **PWA:** comprobá si Safari ofrece añadir la app a la pantalla de inicio o al
   Dock y si el uso sin conexión funciona tras la primera visita.

**Resultado esperado**

- Layout y pentagramas correctos.
- Audio tras gesto, sin notas trabadas.
- Aviso de MIDI no soportado y autoevaluación manual operativa.
- PWA instalable y offline tras la primera carga.

## P4 — iOS (audio y PWA)

**Por qué está pendiente.** No hay dispositivo iOS físico ni acceso a un
servicio de dispositivos en la nube en este entorno (F6-028 quedó descartada por
falta de hardware).

**Pasos**

1. En Safari de iPhone/iPad, abrí
   `https://wulflo.github.io/piano-learning/`.
2. **Instalación:** **Compartir → Añadir a pantalla de inicio**. Abrí la app
   desde el ícono nuevo.
3. **Audio:** tocá la pantalla una vez y luego **Activar audio**; reproducí un
   ejemplo. Confirmá que el audio se habilita tras el gesto y que no queda
   ninguna nota sonando al detener.
4. **Rotación y layout:** girá el dispositivo y comprobá que el teclado y el
   pentagrama se adaptan sin cortarse.
5. **Offline:** tras la primera visita, activá modo avión y volvé a abrir la app.
   El shell debe cargar desde la caché.
6. **MIDI:** no aplica (iOS Safari no expone Web MIDI); confirmá que la app
   muestra el aviso y permite autoevaluación manual.

**Resultado esperado**

- Instalación correcta y apertura desde el ícono.
- Audio habilitado tras el gesto, sin notas trabadas.
- Layout usable en vertical y horizontal.
- Carga sin conexión tras la primera visita.

## P5 — Android (audio y PWA)

**Por qué está pendiente.** Igual que iOS: no hay dispositivo Android en este
entorno (F6-029 quedó descartada por falta de hardware).

**Pasos**

1. Abrí la demo publicada en **Chrome para Android**.
2. **Instalación:** menú **⋮ → Instalar aplicación** (o el banner de instalación).
   Abrí la app instalada.
3. **Audio:** tocá **Activar audio** y reproducí un ejemplo; comprobá que suena,
   que no hay latencia molesta y que ninguna nota queda trabada.
4. **MIDI (opcional):** si tenés un adaptador USB-C/OTG y un teclado MIDI,
   repetí la prueba P2 desde el celular y verificá que el permiso y el panel de
   diagnóstico funcionan igual.
5. **Offline:** activá modo avión tras la primera visita y reabrí la app; el
   shell debe cargar desde la caché.

**Resultado esperado**

- Instalación correcta y apertura desde el ícono.
- Audio tras el gesto, sin notas trabadas.
- Carga sin conexión tras la primera visita.

## Registro de resultados

Completá una fila por prueba y pegá la tabla en `docs/LOG.md` (o entregala al
responsable del proyecto). Mientras la tabla esté vacía, F6-054 permanece `[ ]`.

| Prueba | Dispositivo / SO | Navegador | Resultado | Observaciones |
|---|---|---|---|---|
| P1 · Audio, latencia y volumen | | | ⬜ pendiente | |
| P2 · Yamaha PSR-373 | | Chromium | ⬜ pendiente | |
| P3 · Safari | macOS | Safari | ⬜ pendiente | |
| P4 · iOS | iPhone/iPad | Safari | ⬜ pendiente | |
| P5 · Android | Android | Chrome | ⬜ pendiente | |

Usá `✅ OK`, `⚠️ con observaciones` o `❌ falla` en la columna **Resultado** y
describí el problema en **Observaciones** con la ruta y el paso exactos. Si algo
falla, se registra como incidencia y, si es un bug de la app, se abre una tarea
nueva en `docs/CHECKLIST.md` en lugar de dar F6-054 por cerrada.

## Lo que este documento no cubre

- **Pruebas automáticas:** `npm test`, `npm run test:e2e` (Chromium y Firefox),
  `npm run typecheck`, `npm run build`, `npm run validate:content` y
  `npm run budget`. Ya se ejecutan en `npm run estado`.
- **Auditorías:** `npm run audit` (audio, licencias, código y texto) y
  `npm run audit:reuse`. El resultado vive en `docs/AUDITORIA.md`.
- **QA de escritorio en Chrome, Firefox y Edge:** cerrada en F6-027
  (`docs/QA-NAVEGADORES.md`).
