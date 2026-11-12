# Cómo contribuir a Piano Today

Gracias por querer aportar. Este documento resume **qué se puede aportar, con qué
licencia y cómo firmarlo**. Es corto a propósito: si algo no está claro, abrí un
issue antes de mandar el cambio.

## 1. Antes de tocar nada

- Leé `docs/GUIA-CAMBIOS.md`: el proyecto trabaja **checklist primero**.
- Toda tarea nueva se anota en `docs/CHECKLIST.md` (ID, criterio de aceptación,
  dependencias y si necesita red) **antes** de implementarla.
- Un cambio, un commit atómico; un commit, un hash en el checklist.
- No se marca nada como hecho sin `npm run typecheck`, `npm test` y
  `npm run build` en verde.

## 2. Origen y licencia de lo que aportás

Cada aporte declara **de dónde sale** y **con qué licencia entra**. Al enviar un
cambio aceptás que:

| Tipo de aporte | Licencia de entrada |
|---|---|
| Código, herramientas, pruebas, documentación y configuración | **MIT** (ver `LICENSE`) |
| Lecciones, ejercicios, módulos y habilidades (`content/**`) | **CC BY-SA 4.0** (ver `LICENSE-CONTENT`) |
| Estudios técnicos y melodías originales marcados `cc0-1.0` en su ficha | **CC0 1.0** |

La licencia de cada archivo versionado está declarada en `REUSE.toml` y los
textos legales viven en `LICENSES/`. Si agregás un archivo que no encaja en las
anotaciones existentes, actualizá `REUSE.toml` (y `LICENSES/` si hace falta) y
dejá `npm run audit:reuse` en verde.

### Firma DCO (obligatoria)

Todos los commits se firman con el [Developer Certificate of Origin 1.1][dco].
Eso certifica que tenés derecho a aportar lo que aportás. Usá `git commit -s`
para añadir la línea:

```text
Signed-off-by: Nombre Apellido <correo@ejemplo.com>
```

La firma debe coincidir con el autor del commit. Un PR sin firma no se puede
integrar. El texto completo del DCO está en <https://developercertificate.org/>.

[dco]: https://developercertificate.org/

## 3. Lo que NO se puede aportar

Está **prohibido pegar material de terceros**. En concreto:

- **Texto**: párrafos copiados de libros, métodos, blogs, wikis o apuntes
  ajenos. Escribí la explicación con palabras propias.
- **Audio**: grabaciones, samples o bancos de sonido de terceros. La app usa
  muestras de Salamander Grand Piano con su atribución; no agregues otras.
- **Partituras**: ediciones, arreglos, digitaciones o transcripciones modernas
  de terceros. Solo se aceptan obras de dominio público **con transcripción,
  arreglo y digitación propios** (criterio de ADR-011 en `docs/DECISIONES.md`).
- **Imágenes, tipografías o iconos** sin licencia compatible y sin atribución.

Si dudás del estatus de una obra, no la agregues: abrí un issue y se verifica
antes. El criterio conservador es que la obra es de dominio público si el
compositor murió hace **más de 100 años** o si es una melodía tradicional
anónima antigua.

### Contenido de repertorio

Cada pieza nueva necesita su ficha en `content/repertoire/` con compositor,
fechas, fuente consultada, fecha de verificación, licencia, transcriptor y
atribución visible. Las transcripciones de dominio público también se registran
en `docs/LICENCIAS.md`. `npm run validate:content` es el gate: no valida solo el
esquema, también exige la licencia.

## 4. Flujo de trabajo

1. Anotá la tarea en `docs/CHECKLIST.md` y marcala `[~]`.
2. Implementá en un cambio acotado, sin refactors no relacionados.
3. Verificá:

   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

   Según el cambio, además: `npm run validate:content`, `npm run budget`,
   `npm run audit:audio`, `npm run audit:licenses`, `npm run audit:code`,
   `npm run audit:text` o `npm run audit:reuse`.
4. Commiteá firmado (`git commit -s`) con el ID de la tarea en el mensaje.
5. Cerrá la tarea en `docs/CHECKLIST.md` con `- Commit: <hash>`, agregá la
   entrada en `docs/LOG.md` y actualizá el punto de reanudación.

Si una decisión cambia la arquitectura, agregá un ADR en `docs/DECISIONES.md`.
No se hace `push`, tags ni releases sin autorización explícita.

## 5. Estilo

- TypeScript estricto; el código y los mensajes van en español, igual que el
  resto del proyecto.
- Los textos visibles se agregan en los diccionarios ES/EN de
  `src/state/settings.tsx`.
- Se prefiere contenido local: la app no debe pedir red en runtime.
- Respetá la accesibilidad ya cubierta (navegación por teclado, alternativas
  textuales, contraste AA, movimiento reducido).

## 6. Licencia del proyecto

Piano Today se distribuye bajo **MIT** (código) y **CC BY-SA 4.0** (contenido),
con los estudios y melodías originales marcados como **CC0 1.0**. Al contribuir
aceptás liberar tu aporte bajo esas mismas licencias.
