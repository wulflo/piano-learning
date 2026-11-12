# AUDITORÍA — Piano Today

> Informe de las auditorías de cierre. Cada sección la escribe su comando
> (`npm run audit:code`, `npm run audit:text` y `npm run audit`); no se edita a mano.

<!-- audit:code:start -->
## Duplicación de código y encabezados ajenos

- Comando: `npm run audit:code` (jscpd 5.4.3)
- jscpd sobre `src/`: 186 archivos, 93 clones, 1205 líneas duplicadas (2.61 %) y 7447 tokens duplicados (3.27 %).

### Clones detectados

| Ubicación A | Ubicación B | Líneas | Tokens | Tipo |
|---|---|---:|---:|---|
| `src/audio/engine.ts:383-397` | `src/audio/engine.ts:413-427` | 15 | 94 | exact |
| `src/components/Demo.tsx:394-401` | `src/components/ExercisePlayer.tsx:981-990` | 8 | 61 | exact |
| `src/components/ExercisePlayer.tsx:594-601` | `src/components/ExercisePlayer.tsx:642-649` | 8 | 66 | exact |
| `src/components/ExercisePlayer.tsx:594-601` | `src/components/ExercisePlayer.tsx:663-670` | 8 | 66 | exact |
| `src/components/ExercisePlayer.tsx:594-601` | `src/components/ExercisePlayer.tsx:684-691` | 8 | 66 | exact |
| `src/components/ExercisePlayer.tsx:594-601` | `src/components/ExercisePlayer.tsx:743-750` | 8 | 66 | exact |
| `src/components/ExercisePlayer.tsx:594-601` | `src/components/ExercisePlayer.tsx:764-771` | 8 | 66 | exact |
| `src/components/ExercisePlayer.tsx:594-602` | `src/components/ExercisePlayer.tsx:785-795` | 9 | 68 | exact |
| `src/components/ExercisePlayer.tsx:594-602` | `src/components/ExercisePlayer.tsx:816-824` | 9 | 68 | exact |
| `src/components/ExercisePlayer.tsx:594-601` | `src/components/ExercisePlayer.tsx:853-862` | 8 | 66 | exact |
| `src/components/ExercisePlayer.tsx:596-601` | `src/components/ExercisePlayer.tsx:1250-1255` | 6 | 61 | exact |
| `src/components/ExercisePlayer.tsx:951-963` | `src/components/ExercisePlayer.tsx:1020-1032` | 13 | 64 | exact |
| `src/components/ExercisePlayer.tsx:951-963` | `src/components/ExercisePlayer.tsx:1047-1059` | 13 | 64 | exact |
| `src/components/ExercisePlayer.tsx:953-963` | `src/components/ExercisePlayer.tsx:995-1005` | 11 | 53 | exact |
| `src/components/ExerciseSuggestions.tsx:35-45` | `src/components/LessonPlayer.tsx:42-52` | 11 | 68 | exact |
| `src/components/GrandStaff.tsx:51-69` | `src/components/Staff.tsx:57-75` | 19 | 119 | exact |
| `src/components/GrandStaff.tsx:101-116` | `src/components/Staff.tsx:98-113` | 16 | 60 | exact |
| `src/components/GrandStaff.tsx:148-166` | `src/components/Staff.tsx:128-146` | 19 | 87 | exact |
| `src/components/GrandStaff.tsx:166-184` | `src/components/Staff.tsx:146-164` | 19 | 111 | exact |
| `src/components/RepertoirePlayer.tsx:62-68` | `src/components/SongPlayer.tsx:24-29` | 7 | 69 | exact |
| `src/components/RepertoirePlayer.tsx:161-172` | `src/components/SongPlayer.tsx:88-99` | 12 | 63 | exact |
| `src/components/RepertoirePlayer.tsx:274-284` | `src/components/RepertoirePlayer.tsx:289-299` | 11 | 78 | exact |
| `src/components/SongRecorder.tsx:236-244` | `src/components/SongRecorder.tsx:250-258` | 9 | 57 | exact |
| `src/content/validate.ts:830-842` | `src/content/validate.ts:867-879` | 13 | 102 | exact |
| `src/content/validate.ts:1011-1022` | `src/content/validate.ts:1053-1063` | 12 | 66 | exact |
| `src/exercises/answer.ts:1126-1136` | `src/exercises/answer.ts:1163-1173` | 11 | 52 | exact |
| `src/exercises/answer.ts:1137-1145` | `src/exercises/answer.ts:1174-1182` | 9 | 60 | exact |
| `src/exercises/chord-dictation.ts:105-124` | `src/exercises/interval-dictation.ts:250-270` | 20 | 69 | exact |
| `src/exercises/chord-dictation.ts:105-115` | `src/exercises/progression-dictation.ts:89-99` | 11 | 67 | exact |
| `src/exercises/chord-dictation.ts:105-124` | `src/exercises/scale-dictation.ts:121-140` | 20 | 69 | exact |
| `src/exercises/ear-session.ts:100-113` | `src/state/daily-queue.ts:49-62` | 14 | 95 | exact |
| `src/exercises/generators/borrowed-chord.ts:114-125` | `src/exercises/generators/cadence.ts:93-104` | 12 | 99 | exact |
| `src/exercises/generators/borrowed-chord.ts:114-124` | `src/exercises/generators/fingering.ts:105-120` | 11 | 86 | exact |
| `src/exercises/generators/borrowed-chord.ts:114-124` | `src/exercises/generators/independence.ts:305-315` | 11 | 86 | exact |
| `src/exercises/generators/borrowed-chord.ts:114-125` | `src/exercises/generators/modulation.ts:64-75` | 12 | 99 | exact |
| `src/exercises/generators/borrowed-chord.ts:114-124` | `src/exercises/generators/progression-completion.ts:181-191` | 11 | 86 | exact |
| `src/exercises/generators/borrowed-chord.ts:114-124` | `src/exercises/generators/roman-numeral.ts:68-78` | 11 | 86 | exact |
| `src/exercises/generators/borrowed-chord.ts:114-125` | `src/exercises/generators/secondary-dominant.ts:67-78` | 12 | 99 | exact |
| `src/exercises/generators/borrowed-chord.ts:147-157` | `src/exercises/generators/secondary-dominant.ts:99-109` | 11 | 66 | exact |
| `src/exercises/generators/borrowed-chord.ts:155-170` | `src/exercises/generators/modulation.ts:130-145` | 16 | 95 | exact |
| `src/exercises/generators/borrowed-chord.ts:157-165` | `src/exercises/generators/cadence.ts:153-161` | 9 | 54 | exact |
| `src/exercises/generators/borrowed-chord.ts:247-264` | `src/exercises/generators/modulation.ts:253-270` | 18 | 65 | exact |
| `src/exercises/generators/borrowed-chord.ts:247-264` | `src/exercises/generators/progression-completion.ts:366-383` | 18 | 65 | exact |
| `src/exercises/generators/borrowed-chord.ts:249-264` | `src/exercises/generators/ornament.ts:355-371` | 16 | 56 | exact |
| `src/exercises/generators/borrowed-chord.ts:251-264` | `src/exercises/generators/cadence.ts:314-327` | 14 | 50 | exact |
| `src/exercises/generators/borrowed-chord.ts:251-264` | `src/exercises/generators/form-analysis.ts:457-470` | 14 | 50 | exact |
| `src/exercises/generators/borrowed-chord.ts:294-304` | `src/exercises/generators/form-analysis.ts:507-517` | 11 | 66 | exact |
| `src/exercises/generators/borrowed-chord.ts:294-304` | `src/exercises/generators/modulation.ts:304-314` | 11 | 66 | exact |
| `src/exercises/generators/borrowed-chord.ts:294-304` | `src/exercises/generators/roman-numeral.ts:276-286` | 11 | 68 | exact |
| `src/exercises/generators/borrowed-chord.ts:295-304` | `src/exercises/generators/cadence.ts:363-372` | 10 | 64 | exact |
| `src/exercises/generators/borrowed-chord.ts:296-304` | `src/exercises/generators/ornament.ts:395-403` | 9 | 63 | exact |
| `src/exercises/generators/cadence.ts:113-133` | `src/exercises/generators/progression-completion.ts:169-183` | 21 | 78 | exact |
| `src/exercises/generators/cadence.ts:151-163` | `src/exercises/generators/secondary-dominant.ts:107-119` | 13 | 78 | exact |
| `src/exercises/generators/cadence.ts:154-165` | `src/exercises/generators/secondary-dominant.ts:110-122` | 12 | 66 | exact |
| `src/exercises/generators/cadence.ts:361-372` | `src/exercises/generators/progression-completion.ts:418-429` | 12 | 67 | exact |
| `src/exercises/generators/cadence.ts:361-372` | `src/exercises/generators/secondary-dominant.ts:329-340` | 12 | 67 | exact |
| `src/exercises/generators/form-analysis.ts:324-347` | `src/exercises/generators/ornament.ts:99-122` | 24 | 157 | exact |
| `src/exercises/generators/form-analysis.ts:347-357` | `src/exercises/generators/ornament.ts:122-132` | 11 | 96 | exact |
| `src/exercises/generators/key-signature.ts:41-60` | `src/exercises/generators/scale-spelling.ts:54-73` | 20 | 74 | exact |
| `src/exercises/generators/key-signature.ts:41-70` | `src/exercises/generators/transposition.ts:57-86` | 30 | 137 | exact |
| `src/exercises/generators/key-signature.ts:59-68` | `src/exercises/generators/scale-spelling.ts:101-110` | 10 | 59 | exact |
| `src/exercises/generators/key-signature.ts:139-149` | `src/exercises/generators/scale-spelling.ts:146-160` | 11 | 76 | exact |
| `src/exercises/generators/key-signature.ts:287-304` | `src/exercises/generators/scale-spelling.ts:250-266` | 18 | 51 | exact |
| `src/exercises/generators/modulation.ts:252-270` | `src/exercises/generators/secondary-dominant.ts:277-295` | 19 | 67 | exact |
| `src/exercises/generators/note-keyboard.ts:145-155` | `src/exercises/generators/note-staff.ts:278-288` | 11 | 53 | exact |
| `src/exercises/generators/note-keyboard.ts:157-168` | `src/exercises/generators/note-staff.ts:289-301` | 12 | 60 | exact |
| `src/exercises/generators/sight-reading.ts:181-195` | `src/exercises/generators/sight-reading.ts:216-230` | 15 | 101 | exact |
| `src/exercises/progression-completion.ts:91-99` | `src/exercises/progression-dictation.ts:132-140` | 9 | 62 | exact |
| `src/exercises/stride.ts:25-41` | `src/exercises/walking.ts:31-46` | 17 | 54 | exact |
| `src/exercises/stride.ts:91-105` | `src/exercises/walking.ts:46-67` | 15 | 88 | exact |
| `src/notation.ts:33-46` | `src/theory/pitch.ts:178-191` | 14 | 123 | exact |
| `src/pages/AttributionsPage.tsx:20-29` | `src/pages/RepertoirePage.tsx:20-29` | 10 | 57 | exact |
| `src/pages/AttributionsPage.tsx:34-53` | `src/pages/RepertoirePage.tsx:32-51` | 20 | 98 | exact |
| `src/pages/AttributionsPage.tsx:110-140` | `src/pages/RepertoirePage.tsx:59-89` | 31 | 186 | exact |
| `src/pages/PracticePage.tsx:231-237` | `src/pages/PracticePage.tsx:432-438` | 7 | 54 | exact |
| `src/schemas/content.ts:32-37` | `src/schemas/course-index.ts:32-37` | 6 | 61 | exact |
| `src/schemas/content.ts:148-153` | `src/schemas/content.ts:602-607` | 6 | 68 | exact |
| `src/schemas/content.ts:311-319` | `src/schemas/content.ts:325-333` | 9 | 56 | exact |
| `src/schemas/content.ts:325-333` | `src/schemas/content.ts:338-346` | 9 | 57 | exact |
| `src/schemas/content.ts:367-379` | `src/schemas/content.ts:470-483` | 13 | 65 | exact |
| `src/schemas/content.ts:533-540` | `src/schemas/content.ts:542-549` | 8 | 53 | exact |
| `src/schemas/content.ts:648-661` | `src/schemas/content.ts:716-729` | 14 | 85 | exact |
| `src/schemas/content.ts:672-682` | `src/schemas/content.ts:682-692` | 11 | 62 | exact |
| `src/staff/grand-staff.ts:558-567` | `src/staff/render.ts:175-184` | 10 | 54 | exact |
| `src/state/lesson-progress.ts:180-194` | `src/state/lesson-progress.ts:200-214` | 15 | 86 | exact |
| `src/state/repositories.ts:424-433` | `src/state/repositories.ts:446-455` | 10 | 86 | exact |
| `src/state/use-course-progress.ts:74-89` | `src/state/use-progress-dashboard.ts:85-100` | 16 | 79 | exact |
| `src/styles.css:70-114` | `src/styles.css:117-161` | 45 | 507 | exact |
| `src/styles.css:105-115` | `src/styles.css:152-163` | 11 | 184 | exact |
| `src/styles.css:591-597` | `src/styles.css:1365-1371` | 7 | 52 | exact |
| `src/styles.css:1739-1749` | `src/styles.css:1896-1906` | 11 | 54 | exact |
| `src/styles.css:2098-2103` | `src/styles.css:2603-2608` | 6 | 87 | exact |
| `src/styles.css:2194-2204` | `src/styles.css:2838-2848` | 11 | 52 | exact |

### Encabezados de copyright o licencia ajenos

Se revisan `src/`, `scripts/`, `content/` buscando `Copyright`, `SPDX-License-Identifier`, `GPL` y `licensed under`.

Sin hallazgos.
<!-- audit:code:end -->
