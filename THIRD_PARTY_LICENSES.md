# Licencias de terceros — Piano Today

Inventario de dependencias, muestras de audio y contenido de terceros.
Generado el 2026-11-14 (F6-018) desde `package-lock.json` y `content/repertoire/`.
Para regenerar la tabla completa:

```bash
node scripts/third-party-licenses.mjs
```

## Dependencias de runtime

| Paquete | Versión | Licencia | Uso |
|---|---|---|---|
| dexie | 4.4.7 | Apache-2.0 | IndexedDB y repositorios |
| react | 19.3.1 | MIT | UI |
| react-dom | 19.3.1 | MIT | UI |
| tonal | 6.5.1 | MIT | Teoría musical |
| tone | 15.1.22 | MIT | Motor de audio (carga diferida) |
| ts-fsrs | 6.0.0 | MIT | Repetición espaciada |
| vexflow | 5.0.0 | MIT | Pentagrama y notación (carga diferida) |
| vite-plugin-pwa | ^2.0.0 | MIT | Manifest, service worker y precache |
| zod | 4.6.7 | MIT | Validación de contenido y datos |

## Dependencias de desarrollo

| Paquete | Versión | Licencia |
|---|---|---|
| @playwright/test | ^1.65.0 | Apache-2.0 |
| @testing-library/dom | 10.4.2 | MIT |
| @testing-library/jest-dom | 7.0.1 | MIT |
| @testing-library/react | 16.3.3 | MIT |
| @testing-library/user-event | 14.6.8 | MIT |
| @types/node | 26.6.6 | MIT |
| @types/react | 19.3.0 | MIT |
| @types/react-dom | 19.3.0 | MIT |
| @vitejs/plugin-react | 6.2.1 | MIT |
| axe-core | 4.14.0 | MPL-2.0 |
| fake-indexeddb | 6.2.8 | Apache-2.0 |
| jsdom | 31.0.0 | MIT |
| tsx | 4.23.15 | MIT |
| typescript | 7.0.2 | Apache-2.0 |
| vite | 8.3.6 | MIT |
| vitest | 5.1.0 | MIT |

## Inventario completo (runtime, desarrollo y transitivas)

Incluye las dependencias transitivas del lockfile. Las licencias se toman del
campo `license` de cada paquete; ante una discrepancia vale el texto incluido
en el paquete original.

| Paquete | Versión | Licencia |
|---|---|---|
| @adobe/css-tools | 4.5.0 | MIT |
| @apideck/better-ajv-errors | 0.3.7 | MIT |
| @babel/code-frame | 7.29.7 | MIT |
| @babel/compat-data | 7.29.7 | MIT |
| @babel/core | 7.29.13 | MIT |
| @babel/generator | 7.29.14 | MIT |
| @babel/helper-annotate-as-pure | 7.29.7 | MIT |
| @babel/helper-compilation-targets | 7.29.13 | MIT |
| @babel/helper-create-class-features-plugin | 7.29.13 | MIT |
| @babel/helper-create-regexp-features-plugin | 7.29.14 | MIT |
| @babel/helper-define-polyfill-provider | 0.6.8 | MIT |
| @babel/helper-globals | 7.29.7 | MIT |
| @babel/helper-member-expression-to-functions | 7.29.14 | MIT |
| @babel/helper-module-imports | 7.29.7 | MIT |
| @babel/helper-module-transforms | 7.29.14 | MIT |
| @babel/helper-optimise-call-expression | 7.29.7 | MIT |
| @babel/helper-plugin-utils | 7.29.7 | MIT |
| @babel/helper-remap-async-to-generator | 7.29.7 | MIT |
| @babel/helper-replace-supers | 7.29.7 | MIT |
| @babel/helper-skip-transparent-expression-wrappers | 7.29.13 | MIT |
| @babel/helper-string-parser | 7.29.14 | MIT |
| @babel/helper-validator-identifier | 7.29.7 | MIT |
| @babel/helper-validator-option | 7.29.7 | MIT |
| @babel/helper-wrap-function | 7.29.14 | MIT |
| @babel/helpers | 7.29.14 | MIT |
| @babel/parser | 7.29.14 | MIT |
| @babel/plugin-bugfix-firefox-class-in-computed-class-key | 7.29.7 | MIT |
| @babel/plugin-bugfix-safari-class-field-initializer-scope | 7.29.7 | MIT |
| @babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression | 7.29.7 | MIT |
| @babel/plugin-bugfix-safari-rest-destructuring-rhs-array | 7.29.13 | MIT |
| @babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining | 7.29.7 | MIT |
| @babel/plugin-bugfix-v8-static-class-fields-redefine-readonly | 7.29.7 | MIT |
| @babel/plugin-proposal-private-property-in-object | 7.21.0-placeholder-for-preset-env.2 | MIT |
| @babel/plugin-syntax-import-assertions | 7.29.7 | MIT |
| @babel/plugin-syntax-import-attributes | 7.29.7 | MIT |
| @babel/plugin-syntax-unicode-sets-regex | 7.18.6 | MIT |
| @babel/plugin-transform-arrow-functions | 7.29.7 | MIT |
| @babel/plugin-transform-async-generator-functions | 7.29.7 | MIT |
| @babel/plugin-transform-async-to-generator | 7.29.7 | MIT |
| @babel/plugin-transform-block-scoped-functions | 7.29.7 | MIT |
| @babel/plugin-transform-block-scoping | 7.29.13 | MIT |
| @babel/plugin-transform-class-properties | 7.29.7 | MIT |
| @babel/plugin-transform-class-static-block | 7.29.14 | MIT |
| @babel/plugin-transform-classes | 7.29.11 | MIT |
| @babel/plugin-transform-computed-properties | 7.29.7 | MIT |
| @babel/plugin-transform-destructuring | 7.29.13 | MIT |
| @babel/plugin-transform-dotall-regex | 7.29.7 | MIT |
| @babel/plugin-transform-duplicate-keys | 7.29.7 | MIT |
| @babel/plugin-transform-duplicate-named-capturing-groups-regex | 7.29.7 | MIT |
| @babel/plugin-transform-dynamic-import | 7.29.7 | MIT |
| @babel/plugin-transform-explicit-resource-management | 7.29.7 | MIT |
| @babel/plugin-transform-exponentiation-operator | 7.29.7 | MIT |
| @babel/plugin-transform-export-namespace-from | 7.29.7 | MIT |
| @babel/plugin-transform-for-of | 7.29.13 | MIT |
| @babel/plugin-transform-function-name | 7.29.7 | MIT |
| @babel/plugin-transform-json-strings | 7.29.7 | MIT |
| @babel/plugin-transform-literals | 7.29.7 | MIT |
| @babel/plugin-transform-logical-assignment-operators | 7.29.7 | MIT |
| @babel/plugin-transform-member-expression-literals | 7.29.7 | MIT |
| @babel/plugin-transform-modules-amd | 7.29.14 | MIT |
| @babel/plugin-transform-modules-commonjs | 7.29.14 | MIT |
| @babel/plugin-transform-modules-systemjs | 7.29.8 | MIT |
| @babel/plugin-transform-modules-umd | 7.29.14 | MIT |
| @babel/plugin-transform-named-capturing-groups-regex | 7.29.7 | MIT |
| @babel/plugin-transform-new-target | 7.29.7 | MIT |
| @babel/plugin-transform-nullish-coalescing-operator | 7.29.7 | MIT |
| @babel/plugin-transform-numeric-separator | 7.29.7 | MIT |
| @babel/plugin-transform-object-rest-spread | 7.29.7 | MIT |
| @babel/plugin-transform-object-super | 7.29.7 | MIT |
| @babel/plugin-transform-optional-catch-binding | 7.29.7 | MIT |
| @babel/plugin-transform-optional-chaining | 7.29.7 | MIT |
| @babel/plugin-transform-parameters | 7.29.7 | MIT |
| @babel/plugin-transform-private-methods | 7.29.7 | MIT |
| @babel/plugin-transform-private-property-in-object | 7.29.7 | MIT |
| @babel/plugin-transform-property-literals | 7.29.7 | MIT |
| @babel/plugin-transform-regenerator | 7.29.8 | MIT |
| @babel/plugin-transform-regexp-modifiers | 7.29.7 | MIT |
| @babel/plugin-transform-reserved-words | 7.29.7 | MIT |
| @babel/plugin-transform-shorthand-properties | 7.29.7 | MIT |
| @babel/plugin-transform-spread | 7.29.11 | MIT |
| @babel/plugin-transform-sticky-regex | 7.29.7 | MIT |
| @babel/plugin-transform-template-literals | 7.29.7 | MIT |
| @babel/plugin-transform-typeof-symbol | 7.29.7 | MIT |
| @babel/plugin-transform-unicode-escapes | 7.29.7 | MIT |
| @babel/plugin-transform-unicode-property-regex | 7.29.7 | MIT |
| @babel/plugin-transform-unicode-regex | 7.29.7 | MIT |
| @babel/plugin-transform-unicode-sets-regex | 7.29.7 | MIT |
| @babel/preset-env | 7.29.14 | MIT |
| @babel/preset-modules | 0.1.6-no-external-plugins | MIT |
| @babel/runtime | 7.29.13 | MIT |
| @babel/template | 7.29.7 | MIT |
| @babel/traverse | 7.29.14 | MIT |
| @babel/types | 7.29.14 | MIT |
| @esbuild/aix-ppc64 | 0.28.2 | MIT |
| @esbuild/android-arm | 0.28.2 | MIT |
| @esbuild/android-arm64 | 0.28.2 | MIT |
| @esbuild/android-x64 | 0.28.2 | MIT |
| @esbuild/darwin-arm64 | 0.28.2 | MIT |
| @esbuild/darwin-x64 | 0.28.2 | MIT |
| @esbuild/freebsd-arm64 | 0.28.2 | MIT |
| @esbuild/freebsd-x64 | 0.28.2 | MIT |
| @esbuild/linux-arm | 0.28.2 | MIT |
| @esbuild/linux-arm64 | 0.28.2 | MIT |
| @esbuild/linux-ia32 | 0.28.2 | MIT |
| @esbuild/linux-loong64 | 0.28.2 | MIT |
| @esbuild/linux-mips64el | 0.28.2 | MIT |
| @esbuild/linux-ppc64 | 0.28.2 | MIT |
| @esbuild/linux-riscv64 | 0.28.2 | MIT |
| @esbuild/linux-s390x | 0.28.2 | MIT |
| @esbuild/linux-x64 | 0.28.2 | MIT |
| @esbuild/netbsd-arm64 | 0.28.2 | MIT |
| @esbuild/netbsd-x64 | 0.28.2 | MIT |
| @esbuild/openbsd-arm64 | 0.28.2 | MIT |
| @esbuild/openbsd-x64 | 0.28.2 | MIT |
| @esbuild/openharmony-arm64 | 0.28.2 | MIT |
| @esbuild/sunos-x64 | 0.28.2 | MIT |
| @esbuild/win32-arm64 | 0.28.2 | MIT |
| @esbuild/win32-ia32 | 0.28.2 | MIT |
| @esbuild/win32-x64 | 0.28.2 | MIT |
| @exodus/bytes | 1.16.0 | MIT |
| @isaacs/cliui | 9.0.0 | BlueOak-1.0.0 |
| @jridgewell/gen-mapping | 0.3.13 | MIT |
| @jridgewell/remapping | 2.3.5 | MIT |
| @jridgewell/resolve-uri | 3.1.2 | MIT |
| @jridgewell/source-map | 0.3.11 | MIT |
| @jridgewell/sourcemap-codec | 1.6.0 | MIT |
| @jridgewell/trace-mapping | 0.3.31 | MIT |
| @open-spaced-repetition/srs-kit | 1.0.0 | BSD-3-Clause |
| @oxc-project/types | 0.156.0 | MIT |
| @playwright/test | 1.65.0 | Apache-2.0 |
| @rolldown/binding-android-arm-eabi | 1.2.16 | MIT |
| @rolldown/binding-android-arm64 | 1.2.16 | MIT |
| @rolldown/binding-darwin-arm64 | 1.2.16 | MIT |
| @rolldown/binding-darwin-x64 | 1.2.16 | MIT |
| @rolldown/binding-freebsd-x64 | 1.2.16 | MIT |
| @rolldown/binding-linux-arm-gnueabihf | 1.2.16 | MIT |
| @rolldown/binding-linux-arm64-gnu | 1.2.16 | MIT |
| @rolldown/binding-linux-arm64-musl | 1.2.16 | MIT |
| @rolldown/binding-linux-ppc64-gnu | 1.2.16 | MIT |
| @rolldown/binding-linux-s390x-gnu | 1.2.16 | MIT |
| @rolldown/binding-linux-x64-gnu | 1.2.16 | MIT |
| @rolldown/binding-linux-x64-musl | 1.2.16 | MIT |
| @rolldown/binding-openharmony-arm64 | 1.2.16 | MIT |
| @rolldown/binding-win32-arm64-msvc | 1.2.16 | MIT |
| @rolldown/binding-win32-x64-msvc | 1.2.16 | MIT |
| @rolldown/pluginutils | 1.0.1 | MIT |
| @rollup/plugin-babel | 6.1.0 | MIT |
| @rollup/plugin-node-resolve | 16.0.3 | MIT |
| @rollup/plugin-replace | 6.0.3 | MIT |
| @rollup/plugin-terser | 1.0.2 | MIT |
| @rollup/pluginutils | 5.5.1 | MIT |
| @rollup/rollup-android-arm-eabi | 4.68.2 | MIT |
| @rollup/rollup-android-arm64 | 4.68.2 | MIT |
| @rollup/rollup-android-x64 | 4.68.2 | MIT |
| @rollup/rollup-darwin-arm64 | 4.68.2 | MIT |
| @rollup/rollup-darwin-x64 | 4.68.2 | MIT |
| @rollup/rollup-freebsd-arm64 | 4.68.2 | MIT |
| @rollup/rollup-freebsd-x64 | 4.68.2 | MIT |
| @rollup/rollup-linux-arm-gnueabihf | 4.68.2 | MIT |
| @rollup/rollup-linux-arm-musleabihf | 4.68.2 | MIT |
| @rollup/rollup-linux-arm64-gnu | 4.68.2 | MIT |
| @rollup/rollup-linux-arm64-musl | 4.68.2 | MIT |
| @rollup/rollup-linux-loong64-gnu | 4.68.2 | MIT |
| @rollup/rollup-linux-loong64-musl | 4.68.2 | MIT |
| @rollup/rollup-linux-ppc64-gnu | 4.68.2 | MIT |
| @rollup/rollup-linux-ppc64-musl | 4.68.2 | MIT |
| @rollup/rollup-linux-riscv64-gnu | 4.68.2 | MIT |
| @rollup/rollup-linux-riscv64-musl | 4.68.2 | MIT |
| @rollup/rollup-linux-s390x-gnu | 4.68.2 | MIT |
| @rollup/rollup-linux-x64-gnu | 4.68.2 | MIT |
| @rollup/rollup-linux-x64-musl | 4.68.2 | MIT |
| @rollup/rollup-openbsd-x64 | 4.68.2 | MIT |
| @rollup/rollup-openharmony-arm64 | 4.68.2 | MIT |
| @rollup/rollup-win32-arm64-msvc | 4.68.2 | MIT |
| @rollup/rollup-win32-ia32-msvc | 4.68.2 | MIT |
| @rollup/rollup-win32-x64-gnu | 4.68.2 | MIT |
| @rollup/rollup-win32-x64-msvc | 4.68.2 | MIT |
| @testing-library/dom | 10.4.2 | MIT |
| @testing-library/jest-dom | 7.0.1 | MIT |
| @testing-library/react | 16.3.3 | MIT |
| @testing-library/user-event | 14.6.8 | MIT |
| @tonaljs/abc-notation | 4.9.3 | MIT |
| @tonaljs/array | 4.8.6 | MIT |
| @tonaljs/chord | 6.2.1 | MIT |
| @tonaljs/chord-detect | 4.9.3 | MIT |
| @tonaljs/chord-type | 5.2.1 | MIT |
| @tonaljs/collection | 4.9.1 | MIT |
| @tonaljs/core | 5.0.4 | MIT |
| @tonaljs/duration-value | 4.9.1 | MIT |
| @tonaljs/interval | 5.1.1 | MIT |
| @tonaljs/key | 4.11.4 | MIT |
| @tonaljs/midi | 4.10.4 | MIT |
| @tonaljs/mode | 4.9.4 | MIT |
| @tonaljs/note | 4.12.3 | MIT |
| @tonaljs/pcset | 4.10.3 | MIT |
| @tonaljs/pitch | 5.0.3 | MIT |
| @tonaljs/pitch-distance | 5.0.7 | MIT |
| @tonaljs/pitch-interval | 6.1.2 | MIT |
| @tonaljs/pitch-note | 6.1.2 | MIT |
| @tonaljs/progression | 4.9.4 | MIT |
| @tonaljs/range | 4.9.4 | MIT |
| @tonaljs/rhythm-pattern | 1.0.1 | MIT |
| @tonaljs/roman-numeral | 4.9.3 | MIT |
| @tonaljs/scale | 4.13.6 | MIT |
| @tonaljs/scale-type | 4.9.4 | MIT |
| @tonaljs/time-signature | 4.10.1 | MIT |
| @tonaljs/voice-leading | 5.1.4 | MIT |
| @tonaljs/voicing | 5.1.5 | MIT |
| @tonaljs/voicing-dictionary | 5.1.5 | MIT |
| @trickfilm400/rollup-plugin-off-main-thread | 3.0.0-pre1 | Apache-2.0 |
| @types/aria-query | 5.0.4 | MIT |
| @types/chai | 5.2.3 | MIT |
| @types/deep-eql | 4.0.2 | MIT |
| @types/estree | 1.0.10 | MIT |
| @types/node | 26.6.6 | MIT |
| @types/react | 19.3.0 | MIT |
| @types/react-dom | 19.3.0 | MIT |
| @types/resolve | 1.20.2 | MIT |
| @types/trusted-types | 2.0.7 | MIT |
| @typescript/typescript-aix-ppc64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-darwin-arm64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-darwin-x64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-freebsd-arm64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-freebsd-x64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-linux-arm | 7.0.2 | Apache-2.0 |
| @typescript/typescript-linux-arm64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-linux-loong64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-linux-mips64el | 7.0.2 | Apache-2.0 |
| @typescript/typescript-linux-ppc64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-linux-riscv64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-linux-s390x | 7.0.2 | Apache-2.0 |
| @typescript/typescript-linux-x64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-netbsd-arm64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-netbsd-x64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-openbsd-arm64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-openbsd-x64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-sunos-x64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-win32-arm64 | 7.0.2 | Apache-2.0 |
| @typescript/typescript-win32-x64 | 7.0.2 | Apache-2.0 |
| @vitejs/plugin-react | 6.2.1 | MIT |
| @vitest/mocker | 5.1.0 | MIT |
| @vitest/spy | 5.1.0 | MIT |
| acorn | 8.19.0 | MIT |
| ajv | 8.20.0 | MIT |
| ansi-regex | 5.0.1 | MIT |
| ansi-styles | 5.2.0 | MIT |
| aria-query | 5.3.0 | Apache-2.0 |
| array-buffer-byte-length | 1.0.2 | MIT |
| arraybuffer.prototype.slice | 1.0.4 | MIT |
| assertion-error | 2.0.1 | MIT |
| async | 3.2.6 | MIT |
| async-function | 1.0.0 | MIT |
| at-least-node | 1.0.0 | ISC |
| automation-events | 7.1.19 | MIT |
| available-typed-arrays | 1.0.7 | MIT |
| axe-core | 4.14.0 | MPL-2.0 |
| babel-plugin-polyfill-corejs2 | 0.4.17 | MIT |
| babel-plugin-polyfill-corejs3 | 0.14.2 | MIT |
| babel-plugin-polyfill-regenerator | 0.6.8 | MIT |
| balanced-match | 4.0.4 | MIT |
| balanced-match | 1.0.2 | MIT |
| baseline-browser-mapping | 2.11.36 | Apache-2.0 |
| bcp-47 | 2.1.2 | MIT |
| bcp-47-match | 2.0.3 | MIT |
| brace-expansion | 5.0.13 | MIT |
| brace-expansion | 2.1.8 | MIT |
| browserslist | 4.29.5 | MIT |
| buffer-from | 1.1.2 | MIT |
| call-bind | 1.0.9 | MIT |
| call-bind-apply-helpers | 1.0.2 | MIT |
| call-bound | 1.0.4 | MIT |
| caniuse-lite | 1.0.30001826 | CC-BY-4.0 |
| chai | 6.3.0 | MIT |
| commander | 2.20.3 | MIT |
| common-tags | 1.8.2 | MIT |
| convert-source-map | 2.0.0 | MIT |
| core-js-compat | 3.51.0 | MIT |
| cross-spawn | 7.0.6 | MIT |
| crypto-random-string | 2.0.0 | MIT |
| css.escape | 1.5.1 | MIT |
| csstype | 3.2.3 | MIT |
| data-urls | 8.0.0 | MIT |
| data-view-buffer | 1.0.2 | MIT |
| data-view-byte-length | 1.0.2 | MIT |
| data-view-byte-offset | 1.0.1 | MIT |
| debug | 4.4.3 | MIT |
| decimal.js | 10.6.0 | MIT |
| deepmerge | 4.3.1 | MIT |
| define-data-property | 1.1.4 | MIT |
| define-properties | 1.2.1 | MIT |
| dequal | 2.0.3 | MIT |
| detect-libc | 2.1.2 | Apache-2.0 |
| dexie | 4.4.7 | Apache-2.0 |
| dom-accessibility-api | 0.6.3 | MIT |
| dom-accessibility-api | 0.5.16 | MIT |
| dunder-proto | 1.0.1 | MIT |
| ejs | 3.1.10 | Apache-2.0 |
| electron-to-chromium | 1.5.482 | ISC |
| entities | 9.0.0 | BSD-2-Clause |
| es-abstract | 1.24.2 | MIT |
| es-abstract-get | 1.0.0 | MIT |
| es-define-property | 1.0.1 | MIT |
| es-errors | 1.3.0 | MIT |
| es-module-lexer | 2.3.2 | MIT |
| es-object-atoms | 1.1.2 | MIT |
| es-set-tostringtag | 2.1.0 | MIT |
| es-to-primitive | 1.3.4 | MIT |
| esbuild | 0.28.2 | MIT |
| escalade | 3.2.0 | MIT |
| estree-walker | 2.0.2 | MIT |
| estree-walker | 3.0.3 | MIT |
| esutils | 2.0.3 | BSD-2-Clause |
| eta | 4.6.0 | MIT |
| expect-type | 1.4.0 | Apache-2.0 |
| fake-indexeddb | 6.2.8 | Apache-2.0 |
| fast-deep-equal | 3.1.3 | MIT |
| fast-json-stable-stringify | 2.1.0 | MIT |
| fast-uri | 3.1.9 | BSD-3-Clause |
| fdir | 6.5.0 | MIT |
| filelist | 1.0.6 | Apache-2.0 |
| for-each | 0.3.5 | MIT |
| foreground-child | 3.3.1 | ISC |
| fs-extra | 9.1.0 | MIT |
| fsevents | 2.3.3 | MIT |
| function-bind | 1.1.2 | MIT |
| function.prototype.name | 1.2.0 | MIT |
| functions-have-names | 1.2.3 | MIT |
| generator-function | 2.0.1 | MIT |
| gensync | 1.0.0-beta.2 | MIT |
| get-intrinsic | 1.3.0 | MIT |
| get-own-enumerable-property-symbols | 3.0.2 | ISC |
| get-proto | 1.0.1 | MIT |
| get-symbol-description | 1.1.0 | MIT |
| glob | 11.1.0 | BlueOak-1.0.0 |
| globalthis | 1.0.4 | MIT |
| gopd | 1.2.0 | MIT |
| graceful-fs | 4.2.11 | ISC |
| has-bigints | 1.1.0 | MIT |
| has-property-descriptors | 1.0.2 | MIT |
| has-proto | 1.2.0 | MIT |
| has-symbols | 1.1.0 | MIT |
| has-tostringtag | 1.0.2 | MIT |
| hasown | 2.0.4 | MIT |
| html-encoding-sniffer | 7.0.0 | MIT |
| idb | 7.1.1 | ISC |
| indent-string | 4.0.0 | MIT |
| internal-slot | 1.1.0 | MIT |
| is-alphabetical | 2.0.1 | MIT |
| is-alphanumerical | 2.0.1 | MIT |
| is-array-buffer | 3.0.5 | MIT |
| is-async-function | 2.1.1 | MIT |
| is-bigint | 1.1.0 | MIT |
| is-boolean-object | 1.2.2 | MIT |
| is-callable | 1.2.7 | MIT |
| is-core-module | 2.18.0 | MIT |
| is-data-view | 1.0.2 | MIT |
| is-date-object | 1.1.0 | MIT |
| is-decimal | 2.0.1 | MIT |
| is-document.all | 1.0.0 | MIT |
| is-finalizationregistry | 1.1.1 | MIT |
| is-generator-function | 1.1.2 | MIT |
| is-map | 2.0.3 | MIT |
| is-module | 1.0.0 | MIT |
| is-negative-zero | 2.0.3 | MIT |
| is-number-object | 1.1.1 | MIT |
| is-obj | 1.0.1 | MIT |
| is-potential-custom-element-name | 1.0.1 | MIT |
| is-regex | 1.2.1 | MIT |
| is-regexp | 1.0.0 | MIT |
| is-set | 2.0.3 | MIT |
| is-shared-array-buffer | 1.0.4 | MIT |
| is-stream | 2.0.1 | MIT |
| is-string | 1.1.1 | MIT |
| is-symbol | 1.1.1 | MIT |
| is-typed-array | 1.1.15 | MIT |
| is-weakmap | 2.0.2 | MIT |
| is-weakref | 1.1.1 | MIT |
| is-weakset | 2.0.4 | MIT |
| isarray | 2.0.5 | MIT |
| isexe | 2.0.0 | ISC |
| jackspeak | 4.2.3 | BlueOak-1.0.0 |
| jake | 10.9.4 | Apache-2.0 |
| js-tokens | 4.0.0 | MIT |
| jsdom | 31.0.0 | MIT |
| jsesc | 3.1.0 | MIT |
| json-schema-traverse | 1.0.0 | MIT |
| json5 | 2.2.3 | MIT |
| jsonfile | 6.2.1 | MIT |
| jsonpointer | 5.0.1 | MIT |
| leven | 3.1.0 | MIT |
| lightningcss | 1.33.0 | MPL-2.0 |
| lightningcss-android-arm64 | 1.33.0 | MPL-2.0 |
| lightningcss-darwin-arm64 | 1.33.0 | MPL-2.0 |
| lightningcss-darwin-x64 | 1.33.0 | MPL-2.0 |
| lightningcss-freebsd-x64 | 1.33.0 | MPL-2.0 |
| lightningcss-linux-arm-gnueabihf | 1.33.0 | MPL-2.0 |
| lightningcss-linux-arm64-gnu | 1.33.0 | MPL-2.0 |
| lightningcss-linux-arm64-musl | 1.33.0 | MPL-2.0 |
| lightningcss-linux-x64-gnu | 1.33.0 | MPL-2.0 |
| lightningcss-linux-x64-musl | 1.33.0 | MPL-2.0 |
| lightningcss-win32-arm64-msvc | 1.33.0 | MPL-2.0 |
| lightningcss-win32-x64-msvc | 1.33.0 | MPL-2.0 |
| lodash.debounce | 4.0.8 | MIT |
| lru-cache | 5.1.1 | ISC |
| lru-cache | 11.5.3 | BlueOak-1.0.0 |
| lz-string | 1.5.0 | MIT |
| magic-string | 0.30.21 | MIT |
| magic-string | 1.4.5 | MIT |
| math-intrinsics | 1.1.0 | MIT |
| min-indent | 1.0.1 | MIT |
| minimatch | 5.1.9 | ISC |
| minimatch | 10.2.6 | BlueOak-1.0.0 |
| minipass | 7.1.3 | BlueOak-1.0.0 |
| ms | 2.1.3 | MIT |
| nanoid | 3.3.20 | MIT |
| node-releases | 2.0.63 | MIT |
| object-inspect | 1.13.4 | MIT |
| object-keys | 1.1.1 | MIT |
| object.assign | 4.1.7 | MIT |
| obug | 3.0.0 | MIT |
| own-keys | 1.0.2 | MIT |
| package-json-from-dist | 1.0.1 | BlueOak-1.0.0 |
| parse5 | 8.1.1 | MIT |
| parse5-parser-stream | 8.1.1 | MIT |
| path-key | 3.1.1 | MIT |
| path-parse | 1.0.7 | MIT |
| path-scurry | 2.0.2 | BlueOak-1.0.0 |
| picocolors | 1.1.1 | ISC |
| picomatch | 4.0.7 | MIT |
| playwright | 1.65.0 | Apache-2.0 |
| playwright-core | 1.65.0 | Apache-2.0 |
| possible-typed-array-names | 1.1.0 | MIT |
| postcss | 8.5.32 | MIT |
| pretty-bytes | 6.1.1 | MIT |
| pretty-bytes | 5.6.0 | MIT |
| pretty-format | 27.5.1 | MIT |
| punycode | 2.3.1 | MIT |
| react | 19.3.1 | MIT |
| react-dom | 19.3.1 | MIT |
| react-is | 17.0.2 | MIT |
| redent | 3.0.0 | MIT |
| reflect.getprototypeof | 1.0.10 | MIT |
| regenerate | 1.5.0 | MIT |
| regenerate-unicode-properties | 10.3.0 | MIT |
| regexp.prototype.flags | 1.5.4 | MIT |
| regexpu-core | 6.5.4 | MIT |
| regjsgen | 0.8.0 | MIT |
| regjsparser | 0.14.1 | BSD-2-Clause |
| require-from-string | 2.0.2 | MIT |
| resolve | 1.22.14 | MIT |
| rolldown | 1.2.16 | MIT |
| rollup | 4.68.2 | MIT |
| safe-array-concat | 1.1.4 | MIT |
| safe-push-apply | 1.0.0 | MIT |
| safe-regex-test | 1.1.0 | MIT |
| saxes | 6.0.0 | ISC |
| scheduler | 0.28.0 | MIT |
| semver | 6.3.2 | ISC |
| serialize-javascript | 7.1.4 | BSD-3-Clause |
| set-function-length | 1.2.2 | MIT |
| set-function-name | 2.0.2 | MIT |
| set-proto | 1.0.0 | MIT |
| shebang-command | 2.0.0 | MIT |
| shebang-regex | 3.0.0 | MIT |
| side-channel | 1.1.1 | MIT |
| side-channel-list | 1.0.1 | MIT |
| side-channel-map | 1.0.1 | MIT |
| side-channel-weakmap | 1.0.2 | MIT |
| signal-exit | 4.1.0 | ISC |
| smob | 1.6.2 | MIT |
| source-map | 0.8.0 | BSD-3-Clause |
| source-map | 0.6.1 | BSD-3-Clause |
| source-map-js | 1.2.2 | BSD-3-Clause |
| source-map-support | 0.5.21 | MIT |
| standardized-audio-context | 25.3.77 | MIT |
| std-env | 4.3.0 | MIT |
| stop-iteration-iterator | 1.1.0 | MIT |
| string.prototype.matchall | 4.1.0 | MIT |
| string.prototype.trim | 1.2.11 | MIT |
| string.prototype.trimend | 1.0.10 | MIT |
| string.prototype.trimstart | 1.0.8 | MIT |
| stringify-object | 3.3.0 | BSD-2-Clause |
| strip-comments | 2.0.1 | MIT |
| strip-indent | 3.0.0 | MIT |
| supports-preserve-symlinks-flag | 1.0.0 | MIT |
| temp-dir | 2.0.0 | MIT |
| tempy | 0.6.0 | MIT |
| terser | 5.51.2 | BSD-2-Clause |
| tinybench | 6.2.3 | MIT |
| tinyexec | 1.3.1 | MIT |
| tinyglobby | 0.2.17 | MIT |
| tldts | 7.4.19 | MIT |
| tldts-core | 7.4.20 | MIT |
| tonal | 6.5.1 | MIT |
| tone | 15.1.22 | MIT |
| tough-cookie | 6.1.0 | BSD-3-Clause |
| tr46 | 7.0.0 | MIT |
| ts-fsrs | 6.0.0 | MIT |
| tslib | 2.9.1 | 0BSD |
| tsx | 4.23.15 | MIT |
| type-fest | 0.16.0 | (MIT OR CC0-1.0) |
| typed-array-buffer | 1.0.3 | MIT |
| typed-array-byte-length | 1.0.3 | MIT |
| typed-array-byte-offset | 1.0.5 | MIT |
| typed-array-length | 1.0.8 | MIT |
| typescript | 7.0.2 | Apache-2.0 |
| unbox-primitive | 1.1.0 | MIT |
| undici | 8.12.4 | MIT |
| undici-types | 8.9.0 | MIT |
| unicode-canonical-property-names-ecmascript | 2.0.1 | MIT |
| unicode-match-property-ecmascript | 2.0.0 | MIT |
| unicode-match-property-value-ecmascript | 2.2.1 | MIT |
| unicode-property-aliases-ecmascript | 2.2.0 | MIT |
| unique-string | 2.0.0 | MIT |
| universalify | 2.0.1 | MIT |
| upath | 1.2.0 | MIT |
| update-browserslist-db | 1.3.4 | MIT |
| vexflow | 5.0.0 | MIT |
| vite | 8.3.6 | MIT |
| vite-plugin-pwa | 2.0.0 | MIT |
| vitest | 5.1.0 | MIT |
| w3c-xmlserializer | 6.0.0 | MIT |
| webidl-conversions | 8.0.1 | BSD-2-Clause |
| whatwg-mimetype | 5.0.0 | MIT |
| whatwg-url | 17.3.0 | MIT |
| which | 2.0.2 | ISC |
| which-boxed-primitive | 1.1.1 | MIT |
| which-builtin-type | 1.2.1 | MIT |
| which-collection | 1.0.2 | MIT |
| which-typed-array | 1.1.24 | MIT |
| why-is-node-running | 3.2.1 | MIT |
| workbox-background-sync | 7.4.1 | MIT |
| workbox-broadcast-update | 7.4.1 | MIT |
| workbox-build | 7.4.1 | MIT |
| workbox-cacheable-response | 7.4.1 | MIT |
| workbox-core | 7.4.1 | MIT |
| workbox-expiration | 7.4.1 | MIT |
| workbox-google-analytics | 7.4.1 | MIT |
| workbox-navigation-preload | 7.4.1 | MIT |
| workbox-precaching | 7.4.1 | MIT |
| workbox-range-requests | 7.4.1 | MIT |
| workbox-recipes | 7.4.1 | MIT |
| workbox-routing | 7.4.1 | MIT |
| workbox-strategies | 7.4.1 | MIT |
| workbox-streams | 7.4.1 | MIT |
| workbox-sw | 7.4.1 | MIT |
| workbox-window | 7.4.1 | MIT |
| xml-name-validator | 5.0.0 | Apache-2.0 |
| xmlchars | 2.2.0 | MIT |
| yallist | 3.1.1 | ISC |
| zod | 4.6.7 | MIT |

### Resumen por licencia

| Licencia | Paquetes |
|---|---:|
| (MIT OR CC0-1.0) | 1 |
| 0BSD | 1 |
| Apache-2.0 | 35 |
| BlueOak-1.0.0 | 8 |
| BSD-2-Clause | 6 |
| BSD-3-Clause | 7 |
| CC-BY-4.0 | 1 |
| ISC | 15 |
| MIT | 464 |
| MPL-2.0 | 13 |

Total: 551 paquetes (runtime y desarrollo, incluidas dependencias transitivas).


## Fuentes de notación y audio

- **VexFlow 5** (MIT) incluye las fuentes musicales que usa la app para dibujar
  pentagramas. El detalle de su licencia está en `node_modules/vexflow/LICENSE`.
- **Tone.js 15** (MIT) reproduce las muestras y el metrónomo; se carga de forma
  diferida al inicializar el audio.
- No se distribuyen fuentes tipográficas adicionales: la interfaz usa fuentes
  del sistema.

## Muestras de audio

**Salamander Grand Piano** — grabado por Alexander Holm.
- Licencia: CC BY 3.0.
- Fuente: <https://tonejs.github.io/audio/salamander/>
- Uso: 30 muestras MP3 (~2 MB) cargadas solo al inicializar el motor de audio.
- Atribución visible en la app: pantalla de créditos (`#/creditos`).

## Contenido musical

Las transcripciones son adaptaciones pedagógicas originales de Piano Today a
partir de fuentes de dominio público. Las obras originales y sus fuentes:

| Pieza | Fuente | Licencia de la transcripción |
|---|---|---|
| Oda a la alegría (Beethoven) | [IMSLP](https://imslp.org/wiki/Symphony_No.9%2C_Op.125_(Beethoven%2C_Ludwig_van)) | Dominio público |
| L’Arabesque, Op. 100 N.º 2 (Burgmüller) | [Mutopia](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=203) | Dominio público |
| Preludio Op. 28 N.º 4 (Chopin) | [Mutopia](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=468) | Dominio público |
| Sonatina Op. 36 N.º 1, I (Clementi) | [IMSLP](https://imslp.org/wiki/6_Piano_Sonatinas,_Op.36_(Clementi,_Muzio)) | Dominio público |
| Estudio de cinco dedos (Hanon) | [IMSLP](https://imslp.org/wiki/Le_pianiste_virtuose_(Hanon,_Charles-Louis)) | Dominio público |
| Minueto BWV Anh. 114 (Petzold) | [IMSLP](https://imslp.org/wiki/Minuet_in_G_major%2C_BWV_Anh.114_(Petzold%2C_Christian)) | Dominio público |
| Soldatenmarsch, Op. 68 N.º 2 (Schumann) | [IMSLP](https://imslp.org/wiki/Album_f%C3%BCr_die_Jugend%2C_Op.68_(Schumann%2C_Robert)) | Dominio público |
| Amazing Grace (New Britain) | [Hymnary](https://hymnary.org/tune/new_britain) | Dominio público |
| Auld Lang Syne | [Wikipedia](https://en.wikipedia.org/wiki/Auld_Lang_Syne) | Dominio público |
| Frère Jacques | [Wikipedia](https://en.wikipedia.org/wiki/Fr%C3%A8re_Jacques) | Dominio público |
| Greensleeves | [Wikipedia](https://en.wikipedia.org/wiki/Greensleeves) | Dominio público |
| Twinkle, Twinkle, Little Star | [Wikipedia](https://en.wikipedia.org/wiki/Ah!_vous_dirai-je,_maman) | Dominio público |

Los 16 estudios y las 4 melodías originales de Piano Today se publican bajo
**CC0 1.0** (ver `LICENSE-CONTENT`).
