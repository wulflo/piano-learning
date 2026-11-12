import packageJson from '../package.json'

/** Versión de la aplicación, leída de `package.json` para no duplicarla. */
export const APP_VERSION: string = packageJson.version
