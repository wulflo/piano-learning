# GUIA-CAMBIOS — Trabajar con checklist primero

Esta guía explica cómo hacer **cualquier cambio** en PianoDesdeCero para que una
interrupción (corte de luz, cierre de sesión, cambio de máquina) no deje el
proyecto en un estado ambiguo.

La regla central es simple:

> Primero se documenta qué se va a hacer; después se hace; al final se registra
> qué quedó verificado y con qué commit.

## 1. Archivos que forman el protocolo

| Archivo | Rol | ¿Se edita a mano? |
|---|---|---|
| `docs/CHECKLIST.md` | Fuente única de verdad del avance | Sí |
| `docs/RESUME.md` | Cómo retomar desde una sesión nueva | Sí |
| `docs/LOG.md` | Bitácora cronológica, solo se agrega al final | Sí |
| `docs/DECISIONES.md` | ADRs y decisiones arquitectónicas | Sí |
| `docs/ENTORNO.md` | Versiones, licencias, assets y red | Sí |
| `docs/ESTADO.md` | Resumen generado | **No** (`npm run estado`) |
| `CHANGELOG.md` | Cambios por fase | Sí |

## 2. Ciclo obligatorio para cada cambio

### Paso 1 — Elegir la tarea y marcarla en curso

Antes de escribir código:

1. Abrí `docs/CHECKLIST.md` y ubicá la tarea (`F1-033`, por ejemplo).
2. Cambiá `- [ ]` por `- [~]`.
3. Actualizá el bloque `PUNTO DE REANUDACIÓN`:
   - `Tarea actual:` con el ID.
   - `Actualizado:` con fecha y hora.
   - `Nota:` qué vas a hacer y qué falta.
4. Hacé un commit pequeño solo de documentación si el cambio es grande:

```bash
git add docs/CHECKLIST.md
git commit -m "docs(F1-033): marcar demo integrada en curso"
```

Así, si la sesión se corta ahora, la próxima persona sabe exactamente dónde
retomar.

### Paso 2 — Implementar en un cambio acotado

- Un commit atómico por tarea o por lote pequeño y coherente.
- No mezclar refactors no relacionados con la tarea.
- Si aparece un desvío, anotalo en `LOG.md` y decidí si merece una tarea nueva.
- Si una decisión cambia la arquitectura, agregá un ADR en `DECISIONES.md`.

### Paso 3 — Verificar antes de marcar

Ejecutá, como mínimo:

```bash
npm run typecheck
npm test
npm run build
```

Y además, según el tipo de cambio:

```bash
npm run validate:content   # contenido o esquemas
npm run budget             # rendimiento y code splitting
npm run estado             # al cerrar fase o actualizar el resumen
node scripts/fetch-samples.mjs --dry-run  # audio
```

No marques `[x]` si algo falla. Si queda roto y no se puede resolver ahora:

- Cambiá la tarea a `[!]`.
- Escribí en `LOG.md` el comando, las primeras 30 líneas del error, la causa
  probable y el próximo paso.
- Mové el `PUNTO` a esa tarea.

### Paso 4 — Commit y hash

```bash
git add <archivos exactos>
git commit -m "feat(F1-033): demo integrada con teclado, pentagrama y audio"
git rev-parse --short HEAD
```

Usá el hash corto en el checklist.

### Paso 5 — Cerrar la tarea en el checklist

En `docs/CHECKLIST.md`:

```markdown
- [x] **F1-033** — Construir demo F1: teclado + pentagrama + audio + controles
  - Aceptación: ...
  - Deps: ...
  - Commit: 2823751 · 2026-11-10T11:16:30-03:00
```

Reglas del formato (las valida `tests/checklist-format.test.ts`):

- Cada `[x]` debe tener `- Commit: <hash>`.
- Debe haber como máximo una tarea `[~]`.
- El `PUNTO` debe apuntar a la primera tarea pendiente, en curso o bloqueada.
- `Última verificada en verde` debe coincidir con la última `[x]` del archivo.
- La tabla de resumen y el total no cambian de cantidad si no se agregaron
  tareas.

### Paso 6 — Registrar en LOG y ENTORNO

Agregá una entrada al final de `docs/LOG.md`:

```markdown
## 2026-11-10T11:16:30-03:00 · F1-033

- Acción: qué se hizo.
- Resultado: tests, typecheck y build; commit.
- Correcciones: problemas encontrados y cómo se resolvieron.
- Limitaciones: lo que no se pudo verificar (por ejemplo, audio real).
- Próximo paso: siguiente tarea.
```

Actualizá `docs/ENTORNO.md` si cambió algo del entorno:

- Versiones o dependencias.
- Archivos de audio, tamaños o hashes.
- Comandos nuevos.
- Estado de la red.

### Paso 7 — Actualizar el PUNTO y el resumen

El bloque `PUNTO DE REANUDACIÓN` debe quedar así:

```markdown
- **Tarea actual:** F1-034
- **Última verificada en verde:** F1-033 (`abc1234`, 2026-11-10T12:00:00-03:00)
- **Actualizado:** 2026-11-10T12:00:00-03:00
- **Fase:** F1 en curso
- **Nota:** qué sigue y qué limitaciones quedan.
```

Si cerraste una fase:

```bash
npm run estado
git add docs/ESTADO.md
git commit -m "chore(F1-041): regenerar estado al cerrar F1"
git tag fase-1
```

Los tags y todo lo de GitHub son **locales** hasta autorización explícita.

## 3. Si te interrumpen a mitad de una tarea

No hace falta adivinar. Al retomar:

1. Leé `docs/RESUME.md`.
2. Leé el bloque `PUNTO` de `docs/CHECKLIST.md`.
3. Buscá la última entrada de `docs/LOG.md`.
4. Revisá `git status --short` y `git log --oneline -5`.
5. Ejecutá `npm run typecheck && npm test`.
6. Seguí desde la tarea `[~]` o desde la primera `[ ]`.

Si había cambios sin commitear, no los descartes: primero entendé qué son.
Podés guardarlos temporalmente:

```bash
git stash push -m "WIP F1-033"
```

## 4. Cómo escribir una tarea nueva

Si el trabajo no está en el checklist, agregalo antes de hacerlo:

```markdown
- [ ] **F1-042** — Título corto y verificable
  - Aceptación: condición objetiva que se puede testear.
  - Deps: F1-033 · Red: no
```

Después actualizá la tabla de resumen y el total. Si la tarea necesita internet,
agregá `· [NET]` y documentalo en `docs/ENTORNO.md`.

## 5. Reglas de oro

- El checklist manda: si no está ahí, no existe para el proyecto.
- Un cambio, un commit; un commit, un hash en el checklist.
- Nunca marques `[x]` sin typecheck, tests y build en verde.
- Documentá las limitaciones con honestidad; no inventes verificaciones.
- `docs/ESTADO.md` se genera, nunca se edita a mano.
- Nada de remoto, push, GitHub Actions, Pages ni releases sin autorización.
- Si dudás, escribí primero en `LOG.md` lo que estás por hacer.
