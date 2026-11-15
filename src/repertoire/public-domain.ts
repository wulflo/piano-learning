import { MIN_PUBLIC_DOMAIN_YEARS } from '../schemas'

/**
 * F5-025 — Registro de verificación de dominio público.
 *
 * Antes de transcribir una pieza candidata se consulta una fuente (IMSLP,
 * Wikipedia, Hymnary) y se guarda su ficha: compositor, fechas, primera
 * publicación conocida, URL consultada y fecha de verificación. El criterio es
 * el de ADR-011: melodía tradicional anónima, o compositor fallecido hace más
 * de 100 años. Las transcripciones y adaptaciones son siempre propias.
 *
 * Este módulo es el registro machine-readable que usan los tests y las tareas
 * de transcripción. La versión humana, con las dudas y los descartes, vive en
 * `docs/LICENCIAS.md`.
 */

export type PublicDomainStatus = 'verified' | 'discarded'

export interface PublicDomainCandidate {
  /** Identificador estable del candidato; la pieza futura usará `piece.` + id. */
  id: string
  title: string
  /** Obra o colección de la que se toma el material. */
  work: string
  composer: string
  birthYear: number | null
  deathYear: number | null
  /** Melodía tradicional anónima: el criterio no depende de una fecha de muerte. */
  anonymousTraditional: boolean
  /** Año o siglo de la primera publicación conocida. */
  firstPublished: string
  /** Fuente consultada para la ficha. */
  source: string
  sourceUrl: string
  /** Fecha ISO en que se consultó la fuente. */
  verifiedOn: string
  status: PublicDomainStatus
  /** Aclaraciones de atribución, edición o alcance de la transcripción. */
  notes: string
}

export interface DiscardedCandidate {
  id: string
  title: string
  reason: string
  sourceUrl?: string
  verifiedOn: string
}

/**
 * Candidatos verificados para F5-026 a F5-036 y F5-040.
 *
 * Las fechas de muerte se contrastaron con las páginas de IMSLP y Wikipedia
 * citadas. Al 2026, todos los compositores identificados superan los 100 años
 * desde su fallecimiento.
 */
export const PUBLIC_DOMAIN_CANDIDATES: readonly PublicDomainCandidate[] = [
  {
    id: 'twinkle',
    title: 'Twinkle, Twinkle, Little Star',
    work: 'Ah! vous dirai-je, maman (melodía tradicional francesa)',
    composer: 'Anónimo tradicional',
    birthYear: null,
    deathYear: null,
    anonymousTraditional: true,
    firstPublished: '1761',
    source:
      'Wikipedia: «Ah! vous dirai-je, maman», melodía publicada en 1761; IMSLP: 12 Variations on «Ah, vous dirai-je maman», K.265/300e (Mozart)',
    sourceUrl: 'https://en.wikipedia.org/wiki/Ah!_vous_dirai-je,_maman',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'Se transcribe solo la melodía tradicional. No se usan las variaciones de Mozart ni la letra inglesa.',
  },
  {
    id: 'frere-jacques',
    title: 'Frère Jacques',
    work: 'Ronda infantil tradicional francesa',
    composer: 'Anónimo tradicional',
    birthYear: null,
    deathYear: null,
    anonymousTraditional: true,
    firstPublished: 'c. 1780',
    source:
      'Wikipedia: «Frère Jacques», manuscrito «Recueil de Timbres de Vaudevilles» (c. 1780); IMSLP: Frère Jacques, Op.389 (Battmann, 1876)',
    sourceUrl: 'https://en.wikipedia.org/wiki/Fr%C3%A8re_Jacques',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'La atribución a Rameau es discutida y no se usa. Se transcribe la melodía tradicional.',
  },
  {
    id: 'greensleeves',
    title: 'Greensleeves',
    work: 'Balada tradicional inglesa',
    composer: 'Anónimo tradicional',
    birthYear: null,
    deathYear: null,
    anonymousTraditional: true,
    firstPublished: '1580',
    source:
      "Wikipedia: «Greensleeves», balada registrada en la Stationers' Company en 1580; IMSLP: Greensleeves to a Ground (Anonymous)",
    sourceUrl: 'https://en.wikipedia.org/wiki/Greensleeves',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'Se descarta la Fantasía sobre Greensleeves de Vaughan Williams (1934) y cualquier arreglo moderno; se usa solo la melodía tradicional.',
  },
  {
    id: 'auld-lang-syne',
    title: 'Auld Lang Syne',
    work: 'Canción tradicional escocesa',
    composer: 'Anónimo tradicional',
    birthYear: null,
    deathYear: null,
    anonymousTraditional: true,
    firstPublished: '1799',
    source:
      'Wikipedia: «Auld Lang Syne»; IMSLP: Auld lang syne (Folk Songs, Scottish), primera publicación en A Select Collection of Original Scottish Airs (1799)',
    sourceUrl: 'https://en.wikipedia.org/wiki/Auld_Lang_Syne',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'La letra es de Robert Burns (1759-1796); se usa solo la melodía tradicional. Se descartan arreglos corales modernos.',
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    work: 'Himno «New Britain» (melodía tradicional estadounidense)',
    composer: 'Anónimo tradicional',
    birthYear: null,
    deathYear: null,
    anonymousTraditional: true,
    firstPublished: '1829',
    source:
      'Hymnary.org: NEW BRITAIN, publicado en Columbian Harmony (1829); Wikipedia: «Amazing Grace»',
    sourceUrl: 'https://hymnary.org/tune/new_britain',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'La letra de John Newton (1725-1807) no se usa. Se descartan armonizaciones y arreglos modernos; solo la melodía.',
  },
  {
    id: 'ode-to-joy',
    title: 'Oda a la alegría (tema de la Sinfonía n.º 9)',
    work: 'Symphony No. 9, Op. 125, IV',
    composer: 'Ludwig van Beethoven',
    birthYear: 1770,
    deathYear: 1827,
    anonymousTraditional: false,
    firstPublished: '1826',
    source:
      'IMSLP: Symphony No.9, Op.125 (Beethoven); estreno en Viena el 7 de mayo de 1824; primera publicación en agosto de 1826 (Mainz: Schott)',
    sourceUrl:
      'https://imslp.org/wiki/Symphony_No.9%2C_Op.125_(Beethoven%2C_Ludwig_van)',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'Transcripción propia del tema. No se usa la letra de Schiller ni arreglos modernos.',
  },
  {
    id: 'minuet-g',
    title: 'Minueto en Sol mayor, BWV Anh. 114',
    work: 'Notebook for Anna Magdalena Bach (1725)',
    composer: 'Christian Petzold',
    birthYear: 1677,
    deathYear: 1733,
    anonymousTraditional: false,
    firstPublished: '1725',
    source:
      'IMSLP: Minuet in G major, BWV Anh.114 (Petzold); Wikipedia: Minuets in G major and G minor',
    sourceUrl:
      'https://imslp.org/wiki/Minuet_in_G_major%2C_BWV_Anh.114_(Petzold%2C_Christian)',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'Atribuido durante mucho tiempo a J. S. Bach; la ficha usa a Petzold. Se transcribe desde el cuaderno de 1725, no desde la edición Bärenreiter de 1957.',
  },
  {
    id: 'soldatenmarsch',
    title: 'Soldatenmarsch (Marcha de los soldados)',
    work: 'Album für die Jugend, Op. 68, n.º 2',
    composer: 'Robert Schumann',
    birthYear: 1810,
    deathYear: 1856,
    anonymousTraditional: false,
    firstPublished: '1848',
    source:
      'IMSLP: Album für die Jugend, Op.68 (Schumann); obra compuesta en 1848',
    sourceUrl:
      'https://imslp.org/wiki/Album_f%C3%BCr_die_Jugend%2C_Op.68_(Schumann%2C_Robert)',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'Se usa la edición original de 1848; se descartan revisiones modernas con derechos.',
  },
  {
    id: 'clementi-sonatina-1',
    title: 'Sonatina Op. 36 n.º 1, primer movimiento (fragmento)',
    work: '6 Piano Sonatinas, Op. 36',
    composer: 'Muzio Clementi',
    birthYear: 1752,
    deathYear: 1832,
    anonymousTraditional: false,
    firstPublished: '1797',
    source:
      'IMSLP: 6 Piano Sonatinas, Op.36 (Clementi), primera publicación en Londres en 1797',
    sourceUrl:
      'https://imslp.org/wiki/6_Piano_Sonatinas%2C_Op.36_(Clementi%2C_Muzio)',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'Se transcribe un fragmento pedagógico propio; no se copia ninguna edición moderna.',
  },
  {
    id: 'burgmuller-arabesque',
    title: 'Arabesque, Op. 100 n.º 2',
    work: '25 Études faciles et progressives, Op. 100',
    composer: 'Friedrich Burgmüller',
    birthYear: 1806,
    deathYear: 1874,
    anonymousTraditional: false,
    firstPublished: '1852',
    source:
      'IMSLP: 25 Études faciles et progressives, Op.100 (Burgmüller), primera publicación en 1852',
    sourceUrl:
      'https://imslp.org/wiki/25_%C3%89tudes_faciles_et_progressives%2C_Op.100_(Burgm%C3%BCller%2C_Friedrich)',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'La tarea F5-035 dice «Op.100 n.º 1», pero Arabesque es el n.º 2; el n.º 1 es La candeur. Se transcribirá el n.º 2.',
  },
  {
    id: 'chopin-prelude-4',
    title: 'Preludio Op. 28 n.º 4 (versión simplificada propia)',
    work: 'Preludes, Op. 28',
    composer: 'Frédéric Chopin',
    birthYear: 1810,
    deathYear: 1849,
    anonymousTraditional: false,
    firstPublished: '1839',
    source:
      'IMSLP: Preludes, Op.28 (Chopin), primera publicación en 1839',
    sourceUrl:
      'https://imslp.org/wiki/Preludes%2C_Op.28_(Chopin%2C_Fr%C3%A9d%C3%A9ric)',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'La versión simplificada es una adaptación propia declarada; se parte de la edición original.',
  },
  {
    id: 'hanon-exercise-1',
    title: 'Ejercicio 1 de El pianista virtuoso',
    work: 'The Virtuoso Pianist (Le pianiste virtuose)',
    composer: 'Charles-Louis Hanon',
    birthYear: 1819,
    deathYear: 1900,
    anonymousTraditional: false,
    firstPublished: '1873',
    source:
      'IMSLP: The Virtuoso Pianist (Hanon), primera publicación en 1873',
    sourceUrl:
      'https://imslp.org/wiki/The_Virtuoso_Pianist_(Hanon%2C_Charles-Louis)',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'Se usa la edición original de 1873, no las revisiones modernas. Hanon murió en 1900: 126 años al 2026.',
  },
  {
    id: 'czerny-op599',
    title: 'Ejercicio de Erster Wiener Lehrmeister, Op. 599',
    work: 'Erster Wiener Lehrmeister im Pianoforte-Spiel, Op. 599',
    composer: 'Carl Czerny',
    birthYear: 1791,
    deathYear: 1857,
    anonymousTraditional: false,
    firstPublished: '1840',
    source:
      'IMSLP: Erster Wiener Lehrmeister im Pianoforte-Spiel, Op.599 (Czerny), primera publicación en Viena en 1840',
    sourceUrl:
      'https://imslp.org/wiki/Erster_Wiener_Lehrmeister_im_Pianoforte-Spiel%2C_Op.599_(Czerny%2C_Carl)',
    verifiedOn: '2026-11-13',
    status: 'verified',
    notes:
      'Se usa una edición de dominio público; la adaptación es propia.',
  },
]

/**
 * Candidatos descartados.
 *
 * Se registran para que la decisión no se repita: obras bajo copyright,
 * arreglos modernos y ediciones con trabajo editorial protegido.
 */
export const DISCARDED_CANDIDATES: readonly DiscardedCandidate[] = [
  {
    id: 'river-flows-in-you',
    title: 'River Flows in You (Yiruma)',
    reason:
      'El compositor sigue vivo y la obra está bajo copyright; no se puede publicar una transcripción sin licencia.',
    verifiedOn: '2026-11-13',
  },
  {
    id: 'comptine-dun-autre-ete',
    title: "Comptine d'un autre été (Yann Tiersen)",
    reason:
      'Obra del siglo XXI bajo copyright; queda fuera del criterio de dominio público.',
    verifiedOn: '2026-11-13',
  },
  {
    id: 'happy-birthday',
    title: 'Happy Birthday to You',
    reason:
      'El estado de copyright varía por país y arrastra una historia de litigios y marca registrada; no se necesita para el curso.',
    verifiedOn: '2026-11-13',
  },
  {
    id: 'modern-method-arrangements',
    title: 'Arreglos de métodos modernos (Alfred, Bastien, Suzuki y similares)',
    reason:
      'Los arreglos y las digitaciones de esos métodos están protegidos; se transcribe siempre desde la fuente original o se compone material propio.',
    verifiedOn: '2026-11-13',
  },
  {
    id: 'vaughan-williams-greensleeves',
    title: 'Fantasia on Greensleeves (Vaughan Williams, 1934)',
    reason:
      'La fantasía es una obra del siglo XX con derechos; solo se usa la melodía tradicional de Greensleeves.',
    sourceUrl: 'https://imslp.org/wiki/Fantasia_on_Greensleeves_(Vaughan_Williams%2C_Ralph)',
    verifiedOn: '2026-11-13',
  },
  {
    id: 'amazing-grace-modern-arrangements',
    title: 'Armonizaciones modernas de Amazing Grace',
    reason:
      'Las armonizaciones y los arreglos recientes están protegidos; se usa solo la melodía tradicional «New Britain», sin letra.',
    verifiedOn: '2026-11-13',
  },
  {
    id: 'barenreiter-1957-notebook',
    title: 'Notebook for Anna Magdalena Bach, edición Bärenreiter 1957',
    reason:
      'La edición de 1957 aporta trabajo editorial protegido; el Minueto se transcribe desde el cuaderno de 1725.',
    sourceUrl:
      'https://imslp.org/wiki/Notebooks_for_Anna_Magdalena_Bach_(Bach%2C_Johann_Sebastian)',
    verifiedOn: '2026-11-13',
  },
]

/** Años transcurridos desde la muerte, o `null` si es tradicional o falta el dato. */
export function yearsSinceDeath(
  candidate: PublicDomainCandidate,
  currentYear: number = new Date().getUTCFullYear(),
): number | null {
  if (candidate.anonymousTraditional || candidate.deathYear === null) {
    return null
  }
  return currentYear - candidate.deathYear
}

/**
 * Indica si la ficha cumple el criterio conservador de ADR-011.
 *
 * Una melodía tradicional anónima pasa por definición. Una obra con compositor
 * identificado necesita año de muerte y más de 100 años transcurridos.
 */
export function isPublicDomainVerified(
  candidate: PublicDomainCandidate,
  currentYear: number = new Date().getUTCFullYear(),
): boolean {
  if (candidate.status !== 'verified') return false
  if (candidate.anonymousTraditional) return true
  const years = yearsSinceDeath(candidate, currentYear)
  return years !== null && years > MIN_PUBLIC_DOMAIN_YEARS
}

/** Candidatos que pueden transcribirse. */
export function verifiedCandidates(): PublicDomainCandidate[] {
  return PUBLIC_DOMAIN_CANDIDATES.filter(
    (candidate) => candidate.status === 'verified',
  )
}

/** Busca un candidato por id. */
export function candidateById(
  id: string,
): PublicDomainCandidate | undefined {
  return PUBLIC_DOMAIN_CANDIDATES.find((candidate) => candidate.id === id)
}
