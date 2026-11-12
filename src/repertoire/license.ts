import type { LicenseKind } from '../schemas'

/**
 * F5-024 — Presentación de licencias.
 *
 * Traduce el identificador interno de licencia a una etiqueta y a la página
 * oficial que explica sus términos. Las obras originales del proyecto no
 * tienen deed externo: se muestran como obra propia.
 */

export interface LicensePresentation {
  labelKey: string
  url?: string
}

const LICENSE_PRESENTATIONS: Record<LicenseKind, LicensePresentation> = {
  'public-domain': {
    labelKey: 'repertoire.license.kind.public-domain',
    url: 'https://creativecommons.org/publicdomain/mark/1.0/',
  },
  'cc0-1.0': {
    labelKey: 'repertoire.license.kind.cc0-1.0',
    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
  'cc-by-4.0': {
    labelKey: 'repertoire.license.kind.cc-by-4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
  'cc-by-sa-4.0': {
    labelKey: 'repertoire.license.kind.cc-by-sa-4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  original: {
    labelKey: 'repertoire.license.kind.original',
  },
}

export function licensePresentation(kind: LicenseKind): LicensePresentation {
  return LICENSE_PRESENTATIONS[kind]
}

/** Año visible o texto de dato desconocido. */
export function licenseYear(
  year: number | null,
  unknownLabel: string,
): string {
  return year === null ? unknownLabel : String(year)
}
