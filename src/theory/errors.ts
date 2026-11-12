import type { ExerciseType } from '../schemas/content'
import type { IntervalQuality } from './intervals'
import { FEEDBACK_EN } from './errors-en'

export type TheoryErrorCode =
  | 'note-name'
  | 'octave'
  | 'key-signature'
  | 'scale-degree'
  | 'scale-spelling'
  | 'interval-size'
  | 'interval-quality'
  | 'interval-perfect'
  | 'interval-major'
  | 'interval-minor'
  | 'interval-augmented'
  | 'interval-diminished'
  | 'chord-tone'
  | 'chord-quality'
  | 'chord-inversion'
  | 'chord-notation'
  | 'roman-numeral'
  | 'cadence'
  | 'secondary-dominant'
  | 'borrowed-chord'
  | 'augmented-sixth'
  | 'pivot-chord'
  | 'motive-phrase'
  | 'form-period'
  | 'rondo-sonata'
  | 'texture'
  | 'counterpoint'
  | 'ornament'
  | 'transposition'
  | 'rhythm-duration'
  | 'meter'
  | 'anacrusis'
  | 'sound-parameter'
  | 'dynamics'
  | 'articulation'
  | 'tempo'
  | 'form'
  | 'italian-terms'
  | 'hand-independence'
  | 'arpeggio-fingering'
  | 'pedal'
  | 'alberti'
  | 'walking-bass'
  | 'stride'
  | 'sight-reading'
  | 'ear-melody'
  | 'arpeggiated'
  | 'accompaniment'
  | 'style-pattern'

export interface PedagogicalFeedback {
  titleEs: string
  ruleEs: string
  exampleEs: string
  titleEn: string
  ruleEn: string
  exampleEn: string
}

const FEEDBACK: Record<
  TheoryErrorCode,
  Pick<PedagogicalFeedback, 'titleEs' | 'ruleEs' | 'exampleEs'>
> = {
  'note-name': {
    titleEs: 'Recordá cómo se nombran las notas',
    ruleEs:
      'Las teclas blancas, de izquierda a derecha dentro de una octava, son Do, Re, Mi, Fa, Sol, La y Si. El patrón de dos y tres teclas negras se repite.',
    exampleEs:
      'El grupo de dos teclas negras empieza en Do: la blanca a su izquierda es Do y la blanca a su derecha es Re.',
  },
  octave: {
    titleEs: 'Recordá la numeración de octavas',
    ruleEs:
      'El Do central es C4 (MIDI 60). Cada vez que volvés a Do hacia la derecha sube una octava: C5, C6. Hacia la izquierda baja: C3, C2.',
    exampleEs: 'C4 = Do central; C5 es el Do siguiente hacia la derecha.',
  },
  'key-signature': {
    titleEs: 'Recordá el orden de las alteraciones',
    ruleEs:
      'Los sostenidos aparecen en el orden Fa, Do, Sol, Re, La, Mi, Si. Los bemoles, al revés: Si, Mi, La, Re, Sol, Do, Fa. Una armadura de dos sostenidos es Re mayor o Si menor.',
    exampleEs: 'Re mayor lleva Fa♯ y Do♯; su relativa menor es Si menor.',
  },
  'scale-degree': {
    titleEs: 'Recordá los grados de la escala',
    ruleEs:
      'Los grados se cuentan desde la tónica: 1 tónica, 2 supertónica, 3 mediante, 4 subdominante, 5 dominante, 6 superdominante y 7 sensible (o subtónica si está a tono).',
    exampleEs: 'En Do mayor, el grado 5 es Sol y el grado 7 es Si.',
  },
  'scale-spelling': {
    titleEs: 'Recordá deletrear la escala',
    ruleEs:
      'Cada escala usa las siete letras una sola vez. Si la tónica es Si♭, la escala es Si♭, Do, Re, Mi♭, Fa, Sol, La; no se repite ninguna letra.',
    exampleEs: 'En Re mayor la tercera es Fa♯, no Sol♭, porque la letra debe ser F.',
  },
  'interval-size': {
    titleEs: 'Recordá contar la cantidad del intervalo',
    ruleEs:
      'La cantidad se cuenta incluyendo las dos notas: de Do a Mi hay una tercera (Do-Re-Mi), no una segunda. De Do a Do hay una primera u octava según la altura.',
    exampleEs: 'Do4 → Mi4 es una tercera; Do4 → Do5 es una octava.',
  },
  'interval-quality': {
    titleEs: 'Recordá la calidad del intervalo',
    ruleEs:
      'Las cuartas, quintas y octavas son justas. Las segundas, terceras, sextas y séptimas son mayores o menores. Si es un semitono más ancha que la mayor o justa, es aumentada; un semitono más angosta que la menor o justa, disminuida.',
    exampleEs: 'Do → Mi es tercera mayor (4 semitonos); Do → Mi♭ es tercera menor (3).',
  },
  'interval-perfect': {
    titleEs: 'Recordá los intervalos justos',
    ruleEs:
      'El unísono, la cuarta, la quinta y la octava son justos: nunca se llaman mayores ni menores. El unísono justo tiene 0 semitonos, la cuarta justa 5, la quinta justa 7 y la octava justa 12.',
    exampleEs:
      'Do4 → Fa4 es una cuarta justa (5 semitonos); Do4 → Sol4 es una quinta justa (7) y Do4 → Do5 una octava justa (12).',
  },
  'interval-major': {
    titleEs: 'Recordá los intervalos mayores',
    ruleEs:
      'Las segundas, terceras, sextas y séptimas son mayores o menores según sus semitonos. La segunda mayor tiene 2 semitonos, la tercera mayor 4, la sexta mayor 9 y la séptima mayor 11.',
    exampleEs:
      'Do4 → Re4 es una segunda mayor (2 semitonos); Do4 → Mi4, una tercera mayor (4); Do4 → Si4, una séptima mayor (11).',
  },
  'interval-minor': {
    titleEs: 'Recordá los intervalos menores',
    ruleEs:
      'Un intervalo menor tiene un semitono menos que el mayor de la misma cantidad. La segunda menor tiene 1 semitono, la tercera menor 3, la sexta menor 8 y la séptima menor 10.',
    exampleEs:
      'Do4 → Re♭4 es una segunda menor (1 semitono); Do4 → Mi♭4, una tercera menor (3); Do4 → Si♭4, una séptima menor (10).',
  },
  'interval-augmented': {
    titleEs: 'Recordá los intervalos aumentados',
    ruleEs:
      'Un intervalo aumentado es un semitono más ancho que el justo o mayor de la misma cantidad. La cuarta aumentada tiene 6 semitonos (uno más que la cuarta justa) y la quinta aumentada 8 (uno más que la quinta justa).',
    exampleEs:
      'Do4 → Fa♯4 es una cuarta aumentada (6 semitonos); Do4 → Sol♯4, una quinta aumentada (8).',
  },
  'interval-diminished': {
    titleEs: 'Recordá los intervalos disminuidos',
    ruleEs:
      'Un intervalo disminuido es un semitono más angosto que el justo o menor de la misma cantidad. La quinta disminuida tiene 6 semitonos (uno menos que la quinta justa) y la tercera disminuida 2 (uno menos que la tercera menor).',
    exampleEs:
      'Do4 → Sol♭4 es una quinta disminuida (6 semitonos); Do4 → Mi♭♭4, una tercera disminuida (2).',
  },
  'chord-tone': {
    titleEs: 'Recordá cómo se construye un acorde',
    ruleEs:
      'Un acorde se arma apilando terceras desde la fundamental: 1, 3, 5 y, si hay séptima, 7. La calidad decide cada intervalo: la mayor usa tercera mayor y quinta justa; la menor baja la tercera; la disminuida baja también la quinta; la aumentada sube la quinta. Las extensiones siguen apilando 9, 11 y 13.',
    exampleEs:
      'Do7 = Do + Mi (3M) + Sol (5J) + Si♭ (7m). Do maj7 = Do, Mi, Sol, Si. Do9 = Do, Mi, Sol, Si♭, Re.',
  },
  'chord-quality': {
    titleEs: 'Recordá distinguir la calidad',
    ruleEs:
      'Escuchá la tercera y la quinta: mayor (3M + 5J), menor (3m + 5J), disminuido (3m + 5d) o aumentado (3M + 5A). En las séptimas, la séptima decide: maj7 (7M), 7 (7m), m7 (3m + 5J + 7m), m7♭5 (3m + 5d + 7m) y dim7 (3m + 5d + 7d).',
    exampleEs:
      'Do7 = Do, Mi, Sol, Si♭; Domaj7 = Do, Mi, Sol, Si; Dom7 = Do, Mi♭, Sol, Si♭.',
  },
  'chord-inversion': {
    titleEs: 'Recordá qué nota queda en el bajo',
    ruleEs:
      'La inversión la decide la nota más grave: la fundamental en estado fundamental, la tercera en primera, la quinta en segunda y la séptima en tercera. Una tríada tiene tres posiciones; un acorde de séptima, cuatro. El cifrado con barra indica el bajo: Do/Mi.',
    exampleEs:
      'Do maj7 en sus cuatro posiciones: Do, Mi, Sol, Si (fundamental); Mi, Sol, Si, Do (primera); Sol, Si, Do, Mi (segunda); Si, Do, Mi, Sol (tercera). Do/Mi se escribe C/E.',
  },
  'chord-notation': {
    titleEs: 'Recordá leer y escribir cifrados',
    ruleEs:
      'El cifrado nombra la fundamental y la calidad: sin sufijo es mayor; m es menor; ° o dim, disminuido; + o aug, aumentado; maj7, séptima mayor; 7, séptima de dominante; m7, séptima menor. La barra indica el bajo. En latino la fundamental es Do, Re, Mi, Fa, Sol, La o Si; en americano, C, D, E, F, G, A o B.',
    exampleEs:
      'Sol, Si♭, Re y Fa forman Solm7: tercera menor, quinta justa y séptima menor. En americano se escribe Gm7; con Re en el bajo, Solm7/Re = Gm7/D.',
  },
  'roman-numeral': {
    titleEs: 'Recordá los números romanos',
    ruleEs:
      'En mayor: I, ii, iii, IV, V, vi y vii°. Las mayúsculas son acordes mayores y las minúsculas, menores. En menor natural cambian las cualidades: i, ii°, III, iv, v, VI, VII.',
    exampleEs: 'En Do mayor, V es Sol mayor y vi es La menor.',
  },
  cadence: {
    titleEs: 'Recordá las cadencias',
    ruleEs:
      'La cadencia es la fórmula con la que termina una frase. La auténtica va de V a I y cierra con fuerza; la plagal va de IV a I y suena más suave; la semicadencia termina en V y deja la frase abierta; la rota o engañosa va de V a vi y esquiva el cierre.',
    exampleEs:
      'En Do mayor: auténtica Sol-Do; plagal Fa-Do; semicadencia Do-Sol; rota Sol-Lam.',
  },
  'secondary-dominant': {
    titleEs: 'Recordá los dominantes secundarios',
    ruleEs:
      'Un dominante secundario es el V de otro grado, no de la tónica: se escribe V/x y su tercera es la sensible de x. V/V es el dominante de la dominante y resuelve en V; V/ii es el dominante del segundo grado y resuelve en ii. Suele aparecer como acorde de séptima de dominante.',
    exampleEs:
      'En Do mayor: V/V = Re7, que resuelve en Sol (V); V/ii = La7, que resuelve en Rem (ii).',
  },
  'borrowed-chord': {
    titleEs: 'Recordá los acordes prestados',
    ruleEs:
      'El intercambio modal toma acordes del modo paralelo: en mayor se prestan del menor homónimo y viceversa. En Do mayor, el modo paralelo es Do menor: de ahí vienen iv (Fa menor), ♭VI (La♭), ♭VII (Si♭), ♭III (Mi♭) y ii° (Re disminuido). El número romano conserva la alteración que lo separa del modo original.',
    exampleEs:
      'En Do mayor: iv = Fa menor (Fa, La♭, Do); ♭VI = La♭ mayor (La♭, Do, Mi♭); ♭VII = Si♭ mayor (Si♭, Re, Fa).',
  },
  'augmented-sixth': {
    titleEs: 'Recordá las sextas aumentadas',
    ruleEs:
      'La sexta aumentada se forma sobre el ♭VI y lleva el ♯IV: el intervalo entre ambos es una sexta aumentada que se abre hacia la octava de la dominante. La italiana suma la tónica (3 notas); la francesa añade el segundo grado (4 notas); la alemana añade el ♭3 (4 notas). Todas resuelven en la dominante; la alemana suele pasar por un 6/4 cadencial para evitar quintas paralelas.',
    exampleEs:
      'En La menor: italiana Fa-La-Re♯; francesa Fa-La-Si-Re♯; alemana Fa-La-Do-Re♯. La sexta Fa-Re♯ se abre a Mi-Mi en la dominante Mi mayor.',
  },
  'pivot-chord': {
    titleEs: 'Recordá el acorde pivote',
    ruleEs:
      'Un acorde pivote pertenece a las dos tonalidades y sirve de puente en una modulación. Para encontrarlo, compará los acordes diatónicos de la tonalidad de origen y de la de destino: el pivote conserva las mismas notas, aunque cambie de grado y de función. Después del pivote aparece un acorde que ya solo pertenece a la nueva tonalidad, como su V7.',
    exampleEs:
      'De Do mayor a Sol mayor, Lam es el pivote: es vi en Do y ii en Sol. Después, Re7 (V7 de Sol) confirma la nueva tonalidad.',
  },
  'motive-phrase': {
    titleEs: 'Recordá qué es un motivo y qué es una frase',
    ruleEs:
      'El motivo es la unidad melódica más pequeña con identidad propia: unas pocas notas con un ritmo reconocible. La frase es una idea musical completa, normalmente de cuatro compases, que respira y suele cerrar con una cadencia o un reposo. Los motivos se repiten, se transportan y se varían para construir frases; al escuchar, buscá dónde la melodía vuelve a empezar y dónde descansa.',
    exampleEs:
      'En una melodía de ocho compases, el primer motivo puede ser «Mi-Re-Do-Re»; la primera frase ocupa los compases 1 a 4 y la segunda, los compases 5 a 8.',
  },
  'form-period': {
    titleEs: 'Recordá el período y las formas binaria y ternaria',
    ruleEs:
      'El período encadena dos frases: el antecedente plantea la idea y suele quedar abierto, muchas veces con una semicadencia en la dominante; el consecuente la responde y cierra, normalmente con una cadencia auténtica. La forma binaria tiene dos secciones, A y B, que se suelen repetir (AABB). La forma ternaria tiene tres: A, B y la vuelta de A (ABA), como el minueto con trío o el aria da capo. Lo que distingue a la ternaria es justamente la reaparición de A después de B.',
    exampleEs:
      'Un período en Do mayor: el antecedente termina en Sol (V) y el consecuente en Do (I). Una pieza ABA vuelve al material inicial después de la sección contrastante, mientras que una AB termina en material nuevo.',
  },
  'rondo-sonata': {
    titleEs: 'Recordá el rondó y la forma sonata',
    ruleEs:
      'El rondó alterna un estribillo que vuelve una y otra vez con episodios contrastantes; el esquema básico es ABACA, y también existe ABACABA. La forma sonata organiza un movimiento en tres grandes momentos: la exposición presenta los temas (a menudo un primer tema en la tónica y un segundo en la dominante), el desarrollo los transforma y explora otras tonalidades, y la recapitulación los trae de vuelta y resuelve el segundo tema en la tónica. Se reconoce por el regreso del material inicial después de un desarrollo inestable.',
    exampleEs:
      'El rondó «Para Elisa» de Beethoven alterna su tema principal con episodios. El primer movimiento de la Sonata K. 545 de Mozart muestra con claridad exposición, desarrollo y recapitulación; ambos son ejemplos de dominio público.',
  },
  texture: {
    titleEs: 'Recordá las texturas musicales',
    ruleEs:
      'La monofonía es una sola línea melódica, sin acompañamiento: todas las voces o instrumentos hacen la misma melodía. La homofonía es una melodía principal con acompañamiento, normalmente en acordes que se mueven con el mismo ritmo. La polifonía combina dos o más líneas melódicas independientes que suenan a la vez, como en un canon o una fuga; cada voz tiene su propio contorno y no solo acompaña.',
    exampleEs:
      'Un canto gregoriano es monofónico; un himno con melodía y acordes es homofónico; una invención a dos voces de Bach es polifónica. Todos los ejemplos son de dominio público.',
  },
  counterpoint: {
    titleEs: 'Recordá el movimiento de las voces y las reglas básicas',
    ruleEs:
      'Dos voces pueden moverse en paralelo (misma dirección y mismo intervalo), en movimiento similar (misma dirección, intervalo distinto), en movimiento contrario (una sube y la otra baja) o en movimiento oblicuo (una se mueve y la otra se queda). En el contrapunto básico se evitan las quintas y las octavas paralelas, se prefiere el movimiento contrario y se buscan consonancias en los pulsos fuertes.',
    exampleEs:
      'Do-Mi seguido de Re-Fa es movimiento paralelo por terceras, permitido. Do-Sol seguido de Re-La son quintas paralelas, prohibidas; lo correcto sería mover una voz en sentido contrario, por ejemplo Do-Sol hacia Re-Mi.',
  },
  ornament: {
    titleEs: 'Recordá cómo se ejecutan los adornos',
    ruleEs:
      'El trino alterna la nota principal con la superior de forma rápida y termina en la principal. El mordente baja a la nota inferior y vuelve enseguida a la principal. El grupeto gira alrededor de la principal: superior, principal, inferior y principal. La apoyatura se apoya en la nota vecina (superior o inferior) antes de resolver en la principal, y toma parte de su valor. Los adornos se escriben con símbolos o con notas pequeñas, pero siempre se ejecutan con el pulso claro y al servicio de la expresión.',
    exampleEs:
      'Sobre un Do, el trino hace Do-Re-Do-Re…; el mordente hace Do-Si-Do; el grupeto hace Re-Do-Si-Do; la apoyatura hace Re-Do con el Re más largo y el Do en el pulso.',
  },
  transposition: {
    titleEs: 'Recordá transportar por grados',
    ruleEs:
      'Transportar conserva los intervalos y los grados. Si subís una melodía una segunda mayor, cada nota sube dos semitonos y la tonalidad cambia en la misma dirección.',
    exampleEs: 'Do-Re-Mi en Do, transportado una segunda mayor, queda Re-Mi-Fa♯ en Re.',
  },
  'rhythm-duration': {
    titleEs: 'Recordá las duraciones',
    ruleEs:
      'Cada figura vale la mitad de la anterior: redonda (4 tiempos en 4/4), blanca (2), negra (1), corchea (1/2) y semicorchea (1/4). El puntillo agrega la mitad del valor.',
    exampleEs: 'Una negra con puntillo dura un tiempo y medio: 1 + 1/2.',
  },
  meter: {
    titleEs: 'Recordá el compás',
    ruleEs:
      'El numerador indica cuántos pulsos entran por compás y el denominador qué figura vale un pulso. En 4/4 entran cuatro negras; en 6/8, seis corcheas agrupadas de a tres.',
    exampleEs: 'En 3/4 cada compás tiene tres negras: fuerte, débil, débil.',
  },
  anacrusis: {
    titleEs: 'Recordá cómo se compensa la anacrusa',
    ruleEs:
      'La anacrusa son los pulsos iniciales que faltan para completar el primer compás. El compás final se acorta para compensar esos pulsos y la obra termina a tiempo.',
    exampleEs:
      'Si una obra en 4/4 empieza con una anacrusa de un tiempo, el compás final dura tres tiempos: una blanca y una negra.',
  },
  'sound-parameter': {
    titleEs: 'Recordá los parámetros del sonido',
    ruleEs:
      'La altura distingue agudo de grave; la duración, corto de largo; la intensidad, suave de fuerte; y el timbre, el color de cada instrumento o voz.',
    exampleEs:
      'La misma nota tocada más fuerte cambia la intensidad, no la altura ni el timbre.',
  },
  dynamics: {
    titleEs: 'Recordá las marcas dinámicas',
    ruleEs:
      'De más suave a más fuerte: pp (pianissimo), p (piano), mp (mezzo piano), mf (mezzo forte), f (forte) y ff (fortissimo). La intensidad se mide con la velocity del sonido.',
    exampleEs: 'pp corresponde a una velocity baja; ff, a una velocity alta.',
  },
  articulation: {
    titleEs: 'Recordá las articulaciones',
    ruleEs:
      'El legato conecta las notas sin silencio; el staccato las toca cortas y separadas; el acento destaca una nota con un ataque más fuerte.',
    exampleEs:
      'Una nota con punto encima es staccato; una ligadura de expresión indica legato.',
  },
  tempo: {
    titleEs: 'Recordá los términos de tempo',
    ruleEs:
      'Los términos italianos indican la velocidad: grave y largo son lentos, adagio y andante son tranquilos, moderato es intermedio, allegro y vivace son rápidos, y presto es muy rápido.',
    exampleEs: 'A 60 BPM el tempo es adagio; a 132 BPM, allegro.',
  },
  form: {
    titleEs: 'Recordá el orden de las secciones',
    ruleEs:
      'Los signos de repetición repiten lo que está entre ellos. D.C. vuelve al principio; D.S. vuelve al segno; al llegar a To Coda se salta a la coda. El Fine marca el final.',
    exampleEs:
      'Con A y B entre signos de repetición, el orden es A A B B.',
  },
  'italian-terms': {
    titleEs: 'Recordá los términos italianos',
    ruleEs:
      'Los términos italianos describen tempo, dinámica, articulación y carácter. Adagio es lento y tranquilo; allegro, rápido y animado; crescendo, aumentar la intensidad; diminuendo, disminuirla.',
    exampleEs:
      'Legato pide conectar las notas; staccato, tocarlas cortas y separadas.',
  },
  'hand-independence': {
    titleEs: 'Recordá separar el ataque de cada mano',
    ruleEs:
      'En una partitura de dos manos cada evento pertenece a una mano. Para saber qué mano ataca en un pulso, mirá qué nota empieza ahí: si la otra mano mantiene una nota larga o guarda silencio, no vuelve a atacar. Cuando las dos empiezan a la vez, el ataque es simultáneo. Estudiá primero cada mano por separado, con pulso lento y sin tensión, y después unilas.',
    exampleEs:
      'Si la mano derecha sostiene un Do redondo mientras la izquierda hace cuatro negras, en el pulso 2 ataca solo la izquierda; en el pulso 1 atacan las dos.',
  },
  'arpeggio-fingering': {
    titleEs: 'Recordá la digitación del arpegio',
    ruleEs:
      'En un arpegio mayor de una octava, la mano derecha usa 1-2-3-5 cuando la tónica es una tecla blanca y 2-1-2-4 cuando es una tecla negra. Para dos octavas el patrón se repite: 1-2-3-1-2-3-5 o 2-1-2-4-1-2-4. La mano izquierda es el espejo: 5-4-2-1 en teclas blancas y 5-3-2-1 en negras.',
    exampleEs:
      'Do mayor: Do4-Mi4-Sol4-Do5 se toca 1-2-3-5. Re bemol mayor: Reb4-Fa4-Lab4-Reb5 se toca 2-1-2-4.',
  },
  pedal: {
    titleEs: 'Recordá cómo se cambia el pedal',
    ruleEs:
      'El pedal directo se pisa al mismo tiempo que el ataque; el sincopado se pisa justo después del ataque y se cambia en el momento del cambio de armonía. Para que el cambio sea limpio, levantá el pedal en el mismo instante en que atacás el acorde nuevo y volvé a pisarlo enseguida: si lo levantás tarde, las armonías se mezclan; si lo levantás antes, el sonido se corta. Estudiá primero sin pedal y agregalo solo cuando la digitación y el ritmo estén claros.',
    exampleEs:
      'En Do–Fa–Sol–Do, cambiá el pedal en cada cambio de acorde. Si el Fa se mezcla con el Do anterior, el pedal quedó pisado de más: escuchá el barro y corregí el cambio, no toques más fuerte.',
  },
  'walking-bass': {
    titleEs: 'Recordá cómo se construye un walking bass',
    ruleEs:
      'El walking bass camina en negras, una nota por pulso. En cada compás, el primer pulso afirma la fundamental del acorde; los pulsos siguientes usan notas del acorde (tercera, quinta, séptima) y, sobre todo el último pulso, una nota de paso que conduce al bajo del acorde siguiente. La nota de paso puede ser diatónica o cromática (a un semitono del destino). Mantené la línea cerca de la posición de la mano, sin saltos grandes, y sentí el pulso como pasos: la regularidad importa más que la cantidad de notas. Si la línea se atrasa, bajá el tempo.',
    exampleEs:
      'En Do, una línea posible es Do3–Mi3–Sol3–Si2; La2–Do3–Mi3–Do♯3; Re3–Fa3–La3–Fa♯3; Sol2–Si2–Re3–Si2. Las notas Si2, Do♯3, Fa♯3 y Si2 son notas de paso que preparan el compás siguiente.',
  },
  stride: {
    titleEs: 'Recordá cómo se construye el stride',
    ruleEs:
      'El stride alterna la mano izquierda entre un bajo profundo y un acorde: bajo–acorde–bajo–acorde, una negra por pulso. El bajo cae en los pulsos fuertes (1 y 3) y suele alternar la fundamental con la quinta; el acorde cae en los pulsos débiles (2 y 4), cerca del centro del teclado. La mano salta de un registro al otro sin tensar el hombro ni la muñeca. Estudiá lento, con el pedal seco para que cada bajo y cada acorde se escuchen separados, y acelerá solo cuando el pulso y el salto queden seguros.',
    exampleEs:
      'En Do, un stride básico puede ser Do2–Do3 Mi3 Sol3–Sol2–Do3 Mi3 Sol3. El bajo alterna Do2 y Sol2, y el acorde de Do mayor responde en los pulsos 2 y 4. En la progresión Do–La menor–Re menor–Sol, cada compás repite la misma idea con su propio acorde.',
  },
  'sight-reading': {
    titleEs: 'Recordá cómo se lee a primera vista',
    ruleEs:
      'Leer a primera vista es leer música que no conocés sin detenerte. El método por intervalos tiene tres pasos: mirá la armadura, el compás y el registro antes de empezar; encontrá una nota ancla (la primera nota o una línea conocida); y leé las demás por la distancia que las separa, no nombrando cada nota desde cero. Una segunda pasa a la línea o al espacio contiguo; una tercera salta una línea o un espacio; un salto mayor se controla con una nota de referencia intermedia. Leé siempre un paso adelante, con los ojos en la nota siguiente, y mantené el pulso aunque aparezca un error: corregir en marcha también se practica.',
    exampleEs:
      'Si la primera nota es Sol4 y la siguiente está en el espacio de arriba, hay un intervalo de segunda y la nota es La4. Si la tercera nota está dos espacios más arriba, se cuenta La4 → Si4 → Do5. En un fragmento de Do mayor que empieza en Do4 y sube por grados conjuntos, las notas son Do4, Re4, Mi4 y Fa4.',
  },
  'ear-melody': {
    titleEs: 'Recordá cómo se toca de oído',
    ruleEs:
      'Tocar de oído tiene cinco pasos: escuchá la melodía completa sin tocar; cantala o tarareala para fijar la altura; encontrá la tónica y la primera nota; traducí el dibujo a grados de la escala (1, 2, 3, 5…); y tocá la respuesta comparando con lo que escuchaste. Si no acertás, no adivines: reducí la melodía a dos o tres notas, cantá el intervalo y volvé a escuchar. La memoria melódica se construye con fragmentos cortos y repeticiones espaciadas, no con una sola escucha larga.',
    exampleEs:
      'Si la melodía oculta es Do4-Re4-Mi4-Sol4 en Do mayor, escuchá que empieza en la tónica, sube dos grados conjuntos y salta a la quinta: 1-2-3-5. Tocá primero solo Do-Re-Mi, después agregá Sol4 y comprobá si el salto final suena igual que en la grabación.',
  },
  alberti: {
    titleEs: 'Recordá cómo se construye el bajo de Alberti',
    ruleEs:
      'El bajo de Alberti es un acompañamiento en corcheas que alterna el bajo, la quinta, la tercera y la quinta: 1-5-3-5. En 4/4 la célula se repite dos veces por compás. La mano izquierda se mantiene cerca de las teclas, con el pulgar liviano en la quinta y sin levantar los dedos de más. Las variantes cambian el orden (por ejemplo, empezar en la quinta) o el número de notas, pero conservan el vaivén. Si el patrón se atrasa, bajá el tempo; si una nota suena más fuerte, corregí el peso antes de acelerar.',
    exampleEs:
      'Do mayor: Do3-Sol3-Mi3-Sol3, dos veces por compás. Fa mayor: Fa3-Do4-La3-Do4. En la variante invertida, Sol3-Do3-Mi3-Do3 conserva las mismas notas y cambia el orden.',
  },
  arpeggiated: {
    titleEs: 'Recordá cómo se toca un acompañamiento arpegiado',
    ruleEs:
      'En un acompañamiento arpegiado la mano izquierda toca las notas del acorde una por una, en un patrón que se repite. El patrón de 3 notas usa 1-5-3 y suele ir en compás de tres tiempos; el de 4 notas agrega la quinta y usa 1-5-3-5 en compás de cuatro. Mantené el pulso con el metrónomo, atacá todas las notas con la misma intensidad y buscá la posición que comparta notas con el acorde anterior. Si una nota queda más fuerte o más tarde, corregí la mano antes de subir el tempo.',
    exampleEs:
      'Do mayor en la izquierda: Do3-Sol3-Mi3 (1-5-3) en 3/4, o Do3-Sol3-Mi3-Sol3 (1-5-3-5) en 4/4. En Fa mayor: Fa3-Do4-La3 y Fa3-Do4-La3-Do4.',
  },
  accompaniment: {
    titleEs: 'Recordá cómo se lee un acompañamiento en bloque',
    ruleEs:
      'En un acompañamiento en bloque el acorde suena completo en cada ataque. La figura indica el ritmo: redondas para un acorde por compás, blancas para dos, negras para cuatro. En un lead sheet la melodía va arriba y el cifrado indica el acorde que toca la mano izquierda; el bajo puede ir solo o unido al acorde. Antes de tocar, leé el cifrado, elegí una posición cómoda y mantené la misma digitación al repetir el patrón.',
    exampleEs:
      'En un lead sheet «C | Am | F | G7», la mano izquierda toca esos cuatro acordes en blancas o negras mientras la derecha hace la melodía. Si el patrón es bajo y acorde, el bajo va en el pulso fuerte y el acorde en el débil.',
  },
  'style-pattern': {
    titleEs: 'Recordá el pulso y la armonía de los estilos',
    ruleEs:
      'En los estilos populares el compás suele ser 4/4 y el acento cae en los pulsos 2 y 4 (backbeat). El acompañamiento repite el acorde en corcheas, negras o blancas, y la mano izquierda afirma la fundamental. El shuffle y el swing usan corcheas desiguales, largas-cortas, y el comping ataca en los contratiempos. Las progresiones se repiten en bucles cortos: I–V–vi–IV y vi–IV–I–V en pop/rock, I–IV–I–V en blues y ii–V–I en jazz. En la cadencia ii–V–I el segundo grado es menor con séptima, el quinto es dominante y el primero es mayor con séptima; las notas guía son la tercera y la séptima, y los voicings sin fundamental reparten tercera, quinta, séptima y novena. En los ritmos latinos la bossa nova pone la fundamental en 1 y 3 y el acorde en 2 y 4, mientras que la salsa repite una célula de montuno sobre la clave. Para leerlas, identificá la tonalidad, contá los grados y comprobá el cifrado de cada compás. Marcá el pulso con el pie y mantené el mismo patrón al cambiar de acorde.',
    exampleEs:
      'En Do mayor, el bucle C–G–Am–F es I–V–vi–IV. En blues, Do7–Fa7–Do7–Sol7 es I–IV–I–V y el shuffle alterna corcheas largas y cortas. En jazz, Rem7–Sol7–Domaj7 es ii–V–I y las guías Fa–Do, Si–Fa y Mi–Si se mueven un semitono; un voicing sin fundamental de Domaj7 es Mi–Sol–Si–Re (3-5-7-9). En Do, Domaj7–Lam7–Rem7–Sol7 es I–vi–ii–V; la bossa toca la fundamental en 1 y 3 y el acorde en 2 y 4, y el montuno ataca en 0, 0,5, 1,5, 2, 3 y 3,5.',
  },
}

/** Error pedagógico de referencia para cada tipo de ejercicio que se puede corregir. */
const ERROR_BY_EXERCISE_TYPE: Record<ExerciseType, TheoryErrorCode> = {
  'note-keyboard': 'note-name',
  'note-staff': 'note-name',
  'scale-spelling': 'scale-spelling',
  'key-signature': 'key-signature',
  'interval': 'interval-size',
  'chord': 'chord-quality',
  'chord-notation': 'chord-notation',
  'roman-numeral': 'roman-numeral',
  'harmonic-function': 'roman-numeral',
  cadence: 'cadence',
  'secondary-dominant': 'secondary-dominant',
  'borrowed-chord': 'borrowed-chord',
  'augmented-sixth': 'augmented-sixth',
  'pivot-chord': 'pivot-chord',
  'phrase-analysis': 'motive-phrase',
  'form-analysis': 'form-period',
  'texture-analysis': 'texture',
  'counterpoint-analysis': 'counterpoint',
  'ornament-execution': 'ornament',
  'transposition': 'transposition',
  'progression-completion': 'roman-numeral',
  'rhythm-dictation': 'rhythm-duration',
  'rhythm-completion': 'rhythm-duration',
  'anacrusis-completion': 'anacrusis',
  'meter-accent': 'meter',
  'tempo-term': 'tempo',
  'tempo-stability': 'tempo',
  'sound-parameter': 'sound-parameter',
  'dynamic-mark': 'dynamics',
  articulation: 'articulation',
  'playback-order': 'form',
  'italian-term': 'italian-terms',
  'ear-interval': 'interval-size',
  'ear-chord': 'chord-quality',
  'ear-scale': 'scale-spelling',
  'ear-progression': 'roman-numeral',
  'hand-coordination': 'hand-independence',
  arpeggio: 'arpeggio-fingering',
  pedal: 'pedal',
  alberti: 'alberti',
  'walking-bass': 'walking-bass',
  stride: 'stride',
  'sight-reading': 'sight-reading',
  'ear-melody': 'ear-melody',
  arpeggiated: 'arpeggiated',
  accompaniment: 'accompaniment',
  'style-pattern': 'style-pattern',
}

/** Aspecto del acorde que puede preguntar un ejercicio de tipo `chord`. */
export type ChordExerciseAsk = 'quality' | 'inversion' | 'notes' | 'symbol'

/** Forma global que analiza un ejercicio `form-analysis`. */
export type FormAnalysisKind =
  | 'binary'
  | 'ternary'
  | 'period'
  | 'rondo'
  | 'sonata'

export interface PedagogicalContext {
  code?: TheoryErrorCode
  exerciseType?: ExerciseType
  /** Calidad real del intervalo; elige la regla específica. */
  intervalQuality?: IntervalQuality
  /** Aspecto del acorde que pregunta un ejercicio `chord`. */
  chordAsk?: ChordExerciseAsk
  /** Forma analizada; elige la regla de período o de rondó/sonata. */
  form?: FormAnalysisKind
}

/**
 * Código de feedback que corresponde a lo que pregunta un acorde.
 *
 * La construcción (`notes`), la inversión y el cifrado (`symbol`) necesitan
 * reglas distintas aunque compartan el tipo de ejercicio `chord`. La calidad
 * conserva su propia regla porque se reconoce por intervalos.
 */
export function chordAskFeedbackCode(
  ask: ChordExerciseAsk,
): TheoryErrorCode {
  switch (ask) {
    case 'quality':
      return 'chord-quality'
    case 'inversion':
      return 'chord-inversion'
    case 'notes':
      return 'chord-tone'
    case 'symbol':
      return 'chord-notation'
  }
}

/**
 * Código de feedback que corresponde a la forma analizada.
 *
 * El período y las formas binaria y ternaria comparten la regla de frases y
 * secciones; el rondó y la sonata necesitan su propia explicación de esquemas.
 */
export function formFeedbackCode(form: FormAnalysisKind): TheoryErrorCode {
  return form === 'rondo' || form === 'sonata' ? 'rondo-sonata' : 'form-period'
}

/**
 * Código de feedback que corresponde a una calidad de intervalo.
 *
 * Las calidades dobles no tienen regla propia: se explican con la aumentada o
 * la disminuida, que son su paso anterior. Así una doble aumentada recibe el
 * recordatorio de las aumentadas en vez de un texto vacío.
 */
export function intervalQualityFeedbackCode(
  quality: IntervalQuality,
): TheoryErrorCode {
  switch (quality) {
    case 'perfect':
      return 'interval-perfect'
    case 'major':
      return 'interval-major'
    case 'minor':
      return 'interval-minor'
    case 'augmented':
    case 'doubly-augmented':
      return 'interval-augmented'
    case 'diminished':
    case 'doubly-diminished':
      return 'interval-diminished'
  }
}

/** Regla «Recordá» específica de una calidad de intervalo. */
export function intervalQualityFeedback(
  quality: IntervalQuality,
): PedagogicalFeedback {
  return pedagogicalFeedback(intervalQualityFeedbackCode(quality))
}

export function pedagogicalFeedback(code: TheoryErrorCode): PedagogicalFeedback {
  const feedback = FEEDBACK[code]
  const english = FEEDBACK_EN[code]
  const merged: PedagogicalFeedback = { ...feedback, ...english }
  if (
    !merged.titleEs.trim() ||
    !merged.ruleEs.trim() ||
    !merged.exampleEs.trim() ||
    !merged.titleEn.trim() ||
    !merged.ruleEn.trim() ||
    !merged.exampleEn.trim()
  ) {
    throw new Error(`Feedback pedagógico incompleto para ${code}`)
  }
  return merged
}

export function resolvePedagogicalFeedback(context: PedagogicalContext = {}): PedagogicalFeedback {
  if (context.code !== undefined) return pedagogicalFeedback(context.code)
  if (context.intervalQuality !== undefined) {
    return intervalQualityFeedback(context.intervalQuality)
  }
  if (context.chordAsk !== undefined) {
    return pedagogicalFeedback(chordAskFeedbackCode(context.chordAsk))
  }
  if (context.form !== undefined) {
    return pedagogicalFeedback(formFeedbackCode(context.form))
  }
  const code = ERROR_BY_EXERCISE_TYPE[context.exerciseType ?? 'note-keyboard']
  return pedagogicalFeedback(code)
}

export function allPedagogicalFeedback(): Array<{
  code: TheoryErrorCode
  feedback: PedagogicalFeedback
}> {
  return (Object.keys(FEEDBACK) as TheoryErrorCode[]).map((code) => ({
    code,
    feedback: pedagogicalFeedback(code),
  }))
}
