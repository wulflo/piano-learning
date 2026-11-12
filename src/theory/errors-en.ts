import type { TheoryErrorCode } from './errors'

/**
 * Traducción al inglés del feedback pedagógico «Recordá».
 *
 * Vive separado del texto español para que la paridad se pueda comprobar con
 * un test y para que el contenido inglés no quede mezclado con las reglas
 * fuente. Cada entrada conserva el mismo consejo y el mismo ejemplo musical.
 */

export interface PedagogicalFeedbackEn {
  titleEn: string
  ruleEn: string
  exampleEn: string
}

export const FEEDBACK_EN: Record<TheoryErrorCode, PedagogicalFeedbackEn> = {
  'note-name': {
    titleEn: 'Remember how notes are named',
    ruleEn:
      'The white keys, from left to right inside one octave, are C, D, E, F, G, A and B. The pattern of two and three black keys repeats across the keyboard.',
    exampleEn:
      'The group of two black keys starts at C: the white key to its left is C and the white key to its right is D.',
  },
  octave: {
    titleEn: 'Remember octave numbering',
    ruleEn:
      'Middle C is C4 (MIDI 60). Every time you return to C going right, the octave goes up: C5, C6. Going left it goes down: C3, C2.',
    exampleEn: 'C4 = middle C; C5 is the next C to the right.',
  },
  'key-signature': {
    titleEn: 'Remember the order of accidentals',
    ruleEn:
      'Sharps appear in the order F, C, G, D, A, E, B. Flats go the other way: B, E, A, D, G, C, F. A key signature with two sharps is D major or B minor.',
    exampleEn: 'D major has F♯ and C♯; its relative minor is B minor.',
  },
  'scale-degree': {
    titleEn: 'Remember the scale degrees',
    ruleEn:
      'Degrees are counted from the tonic: 1 tonic, 2 supertonic, 3 mediant, 4 subdominant, 5 dominant, 6 submediant and 7 leading tone (or subtonic when it is a whole step below).',
    exampleEn: 'In C major, degree 5 is G and degree 7 is B.',
  },
  'scale-spelling': {
    titleEn: 'Remember how to spell the scale',
    ruleEn:
      'Each scale uses the seven letters once. If the tonic is B♭, the scale is B♭, C, D, E♭, F, G, A; no letter is repeated.',
    exampleEn:
      'In D major the third is F♯, not G♭, because the letter must be F.',
  },
  'interval-size': {
    titleEn: 'Remember how to count the interval size',
    ruleEn:
      'The size counts both notes: from C to E there is a third (C-D-E), not a second. From C to C there is a unison or an octave depending on the height.',
    exampleEn: 'C4 → E4 is a third; C4 → C5 is an octave.',
  },
  'interval-quality': {
    titleEn: 'Remember the interval quality',
    ruleEn:
      'Fourths, fifths and octaves are perfect. Seconds, thirds, sixths and sevenths are major or minor. A semitone wider than major or perfect is augmented; a semitone narrower than minor or perfect is diminished.',
    exampleEn: 'C → E is a major third (4 semitones); C → E♭ is a minor third (3).',
  },
  'interval-perfect': {
    titleEn: 'Remember perfect intervals',
    ruleEn:
      'The unison, fourth, fifth and octave are perfect: they are never called major or minor. A perfect unison has 0 semitones, a perfect fourth 5, a perfect fifth 7 and a perfect octave 12.',
    exampleEn:
      'C4 → F4 is a perfect fourth (5 semitones); C4 → G4 is a perfect fifth (7) and C4 → C5 a perfect octave (12).',
  },
  'interval-major': {
    titleEn: 'Remember major intervals',
    ruleEn:
      'Seconds, thirds, sixths and sevenths are major or minor depending on their semitones. A major second has 2 semitones, a major third 4, a major sixth 9 and a major seventh 11.',
    exampleEn:
      'C4 → D4 is a major second (2 semitones); C4 → E4, a major third (4); C4 → B4, a major seventh (11).',
  },
  'interval-minor': {
    titleEn: 'Remember minor intervals',
    ruleEn:
      'A minor interval has one semitone less than the major interval of the same size. A minor second has 1 semitone, a minor third 3, a minor sixth 8 and a minor seventh 10.',
    exampleEn:
      'C4 → D♭4 is a minor second (1 semitone); C4 → E♭4, a minor third (3); C4 → B♭4, a minor seventh (10).',
  },
  'interval-augmented': {
    titleEn: 'Remember augmented intervals',
    ruleEn:
      'An augmented interval is one semitone wider than the perfect or major interval of the same size. An augmented fourth has 6 semitones (one more than a perfect fourth) and an augmented fifth 8 (one more than a perfect fifth).',
    exampleEn:
      'C4 → F♯4 is an augmented fourth (6 semitones); C4 → G♯4, an augmented fifth (8).',
  },
  'interval-diminished': {
    titleEn: 'Remember diminished intervals',
    ruleEn:
      'A diminished interval is one semitone narrower than the perfect or minor interval of the same size. A diminished fifth has 6 semitones (one less than a perfect fifth) and a diminished third 2 (one less than a minor third).',
    exampleEn:
      'C4 → G♭4 is a diminished fifth (6 semitones); C4 → E♭♭4, a diminished third (2).',
  },
  'chord-tone': {
    titleEn: 'Remember how a chord is built',
    ruleEn:
      'A chord is built by stacking thirds from the root: 1, 3, 5 and, when there is a seventh, 7. The quality decides each interval: major uses a major third and a perfect fifth; minor lowers the third; diminished also lowers the fifth; augmented raises the fifth. Extensions keep stacking 9, 11 and 13.',
    exampleEn:
      'C7 = C + E (M3) + G (P5) + B♭ (m7). Cmaj7 = C, E, G, B. C9 = C, E, G, B♭, D.',
  },
  'chord-quality': {
    titleEn: 'Remember how to tell qualities apart',
    ruleEn:
      'Listen to the third and the fifth: major (M3 + P5), minor (m3 + P5), diminished (m3 + d5) or augmented (M3 + A5). In seventh chords the seventh decides: maj7 (M7), 7 (m7), m7 (m3 + P5 + m7), m7♭5 (m3 + d5 + m7) and dim7 (m3 + d5 + d7).',
    exampleEn:
      'C7 = C, E, G, B♭; Cmaj7 = C, E, G, B; Cm7 = C, E♭, G, B♭.',
  },
  'chord-inversion': {
    titleEn: 'Remember which note is in the bass',
    ruleEn:
      'The bass decides the inversion: the root in root position, the third in first inversion, the fifth in second inversion and the seventh in third inversion. A triad has three positions; a seventh chord, four. Slash notation shows the bass: C/E.',
    exampleEn:
      'Cmaj7 in its four positions: C, E, G, B (root); E, G, B, C (first); G, B, C, E (second); B, C, E, G (third). C/E is written Do/Mi in Latin notation.',
  },
  'chord-notation': {
    titleEn: 'Remember how to read and write chord symbols',
    ruleEn:
      'A chord symbol names the root and the quality: no suffix is major; m is minor; ° or dim, diminished; + or aug, augmented; maj7, major seventh; 7, dominant seventh; m7, minor seventh. The slash shows the bass. In Latin notation the root is Do, Re, Mi, Fa, Sol, La or Si; in American notation, C, D, E, F, G, A or B.',
    exampleEn:
      'G, B♭, D and F make Gm7: minor third, perfect fifth and minor seventh. In Latin notation it is Solm7; with D in the bass, Gm7/D = Solm7/Re.',
  },
  'roman-numeral': {
    titleEn: 'Remember Roman numerals',
    ruleEn:
      'In major: I, ii, iii, IV, V, vi and vii°. Uppercase means major chords and lowercase means minor. In natural minor the qualities change: i, ii°, III, iv, v, VI, VII.',
    exampleEn: 'In C major, V is G major and vi is A minor.',
  },
  cadence: {
    titleEn: 'Remember cadences',
    ruleEn:
      'A cadence is the formula that ends a phrase. The authentic cadence goes from V to I and closes strongly; the plagal goes from IV to I and sounds softer; the half cadence ends on V and leaves the phrase open; the deceptive cadence goes from V to vi and avoids the close.',
    exampleEn:
      'In C major: authentic G-C; plagal F-C; half C-G; deceptive G-Am.',
  },
  'secondary-dominant': {
    titleEn: 'Remember secondary dominants',
    ruleEn:
      'A secondary dominant is the V of another degree, not of the tonic: it is written V/x and its third is the leading tone of x. V/V is the dominant of the dominant and resolves to V; V/ii is the dominant of the second degree and resolves to ii. It usually appears as a dominant seventh chord.',
    exampleEn:
      'In C major: V/V = D7, which resolves to G (V); V/ii = A7, which resolves to Dm (ii).',
  },
  'borrowed-chord': {
    titleEn: 'Remember borrowed chords',
    ruleEn:
      'Modal mixture borrows chords from the parallel mode: in major they come from the parallel minor and vice versa. In C major the parallel mode is C minor: that is where iv (F minor), ♭VI (A♭), ♭VII (B♭), ♭III (E♭) and ii° (D diminished) come from. The Roman numeral keeps the accidental that separates it from the original mode.',
    exampleEn:
      'In C major: iv = F minor (F, A♭, C); ♭VI = A♭ major (A♭, C, E♭); ♭VII = B♭ major (B♭, D, F).',
  },
  'augmented-sixth': {
    titleEn: 'Remember augmented sixth chords',
    ruleEn:
      'The augmented sixth is built on ♭VI and includes ♯IV: the interval between them is an augmented sixth that opens out to the octave of the dominant. The Italian adds the tonic (3 notes); the French adds the second degree (4 notes); the German adds ♭3 (4 notes). All resolve to the dominant; the German usually passes through a cadential 6/4 to avoid parallel fifths.',
    exampleEn:
      'In A minor: Italian F-A-D♯; French F-A-B-D♯; German F-A-C-D♯. The sixth F-D♯ opens to E-E in the dominant E major.',
  },
  'pivot-chord': {
    titleEn: 'Remember the pivot chord',
    ruleEn:
      'A pivot chord belongs to both keys and acts as a bridge in a modulation. To find it, compare the diatonic chords of the source and target keys: the pivot keeps the same notes even though its degree and function change. After the pivot comes a chord that belongs only to the new key, such as its V7.',
    exampleEn:
      'From C major to G major, Am is the pivot: it is vi in C and ii in G. Then D7 (V7 of G) confirms the new key.',
  },
  'motive-phrase': {
    titleEn: 'Remember what a motive and a phrase are',
    ruleEn:
      'A motive is the smallest melodic unit with its own identity: a few notes with a recognisable rhythm. A phrase is a complete musical idea, usually four bars long, that breathes and often closes with a cadence or a resting point. Motives are repeated, transposed and varied to build phrases; when listening, look for where the melody starts again and where it comes to rest.',
    exampleEn:
      'In an eight-bar melody, the first motive might be “E-D-C-D”; the first phrase spans bars 1 to 4 and the second spans bars 5 to 8.',
  },
  'form-period': {
    titleEn: 'Remember the period and binary and ternary forms',
    ruleEn:
      'A period links two phrases: the antecedent states the idea and usually stays open, often with a half cadence on the dominant; the consequent answers it and closes, usually with an authentic cadence. Binary form has two sections, A and B, which are often repeated (AABB). Ternary form has three: A, B and the return of A (ABA), as in a minuet with trio or a da capo aria. What sets ternary apart is precisely the return of A after B.',
    exampleEn:
      'A period in C major: the antecedent ends on G (V) and the consequent on C (I). An ABA piece returns to the opening material after the contrasting section, whereas an AB piece ends in new material.',
  },
  'rondo-sonata': {
    titleEn: 'Remember rondo and sonata form',
    ruleEn:
      'A rondo alternates a refrain that keeps coming back with contrasting episodes; the basic scheme is ABACA, and ABACABA also exists. Sonata form organises a movement in three large moments: the exposition presents the themes (often a first theme in the tonic and a second in the dominant), the development transforms them and explores other keys, and the recapitulation brings them back and resolves the second theme in the tonic. It is recognised by the return of the opening material after an unstable development.',
    exampleEn:
      'Beethoven’s rondo “Für Elise” alternates its main theme with episodes. The first movement of Mozart’s Sonata K. 545 clearly shows exposition, development and recapitulation; both are public-domain examples.',
  },
  texture: {
    titleEn: 'Remember musical textures',
    ruleEn:
      'Monophony is a single melodic line with no accompaniment: every voice or instrument plays the same melody. Homophony is a main melody with accompaniment, usually chords that move with the same rhythm. Polyphony combines two or more independent melodic lines sounding at once, as in a canon or a fugue; each voice has its own contour and does not merely accompany.',
    exampleEn:
      'Gregorian chant is monophonic; a hymn with melody and chords is homophonic; a two-voice invention by Bach is polyphonic. All the examples are in the public domain.',
  },
  counterpoint: {
    titleEn: 'Remember voice motion and the basic rules',
    ruleEn:
      'Two voices can move in parallel (same direction and same interval), in similar motion (same direction, different interval), in contrary motion (one rises and the other falls) or in oblique motion (one moves and the other stays). Basic counterpoint avoids parallel fifths and octaves, prefers contrary motion and seeks consonances on strong beats.',
    exampleEn:
      'C-E followed by D-F is parallel motion in thirds, which is allowed. C-G followed by D-A is parallel fifths, which is forbidden; the correct move would be to send one voice the other way, for example C-G to D-E.',
  },
  ornament: {
    titleEn: 'Remember how ornaments are played',
    ruleEn:
      'A trill alternates the main note with the upper note quickly and ends on the main note. A mordent drops to the lower note and returns at once to the main note. A turn circles the main note: upper, main, lower, main. An appoggiatura leans on a neighbour note (upper or lower) before resolving to the main note and takes part of its value. Ornaments are written with symbols or small notes, but they are always played with a clear pulse and in the service of expression.',
    exampleEn:
      'On a C, a trill plays C-D-C-D…; a mordent plays C-B-C; a turn plays D-C-B-C; an appoggiatura plays D-C with the D longer and the C on the beat.',
  },
  transposition: {
    titleEn: 'Remember to transpose by degrees',
    ruleEn:
      'Transposing keeps the intervals and degrees. If you move a melody up a major second, every note goes up two semitones and the key changes in the same direction.',
    exampleEn: 'C-D-E in C, transposed up a major second, becomes D-E-F♯ in D.',
  },
  'rhythm-duration': {
    titleEn: 'Remember note values',
    ruleEn:
      'Each figure is worth half of the previous one: whole note (4 beats in 4/4), half note (2), quarter note (1), eighth note (1/2) and sixteenth note (1/4). A dot adds half of the value.',
    exampleEn: 'A dotted quarter note lasts one and a half beats: 1 + 1/2.',
  },
  meter: {
    titleEn: 'Remember the meter',
    ruleEn:
      'The top number tells how many beats fit in each measure and the bottom number tells which note value gets one beat. In 4/4 there are four quarter notes; in 6/8, six eighth notes grouped in threes.',
    exampleEn: 'In 3/4 each measure has three quarter notes: strong, weak, weak.',
  },
  anacrusis: {
    titleEn: 'Remember how the pickup is balanced',
    ruleEn:
      'The pickup (anacrusis) is the opening beats that are missing from the first measure. The last measure is shortened to balance those beats and the piece ends on time.',
    exampleEn:
      'If a piece in 4/4 starts with a one-beat pickup, the final measure lasts three beats: a half note and a quarter note.',
  },
  'sound-parameter': {
    titleEn: 'Remember the parameters of sound',
    ruleEn:
      'Pitch tells high from low; duration tells short from long; intensity tells soft from loud; and timbre is the color of each instrument or voice.',
    exampleEn:
      'The same note played louder changes intensity, not pitch or timbre.',
  },
  dynamics: {
    titleEn: 'Remember dynamic marks',
    ruleEn:
      'From softest to loudest: pp (pianissimo), p (piano), mp (mezzo piano), mf (mezzo forte), f (forte) and ff (fortissimo). Intensity is measured with the velocity of the sound.',
    exampleEn: 'pp matches a low velocity; ff matches a high velocity.',
  },
  articulation: {
    titleEn: 'Remember articulations',
    ruleEn:
      'Legato connects notes without silence; staccato plays them short and separated; accent highlights a note with a stronger attack.',
    exampleEn:
      'A note with a dot above it is staccato; a slur indicates legato.',
  },
  tempo: {
    titleEn: 'Remember tempo terms',
    ruleEn:
      'Italian terms set the speed: grave and largo are slow, adagio and andante are calm, moderato is medium, allegro and vivace are fast, and presto is very fast.',
    exampleEn: 'At 60 BPM the tempo is adagio; at 132 BPM, allegro.',
  },
  form: {
    titleEn: 'Remember the order of sections',
    ruleEn:
      'Repeat signs repeat what is between them. D.C. goes back to the beginning; D.S. goes back to the sign; at To Coda you jump to the coda. Fine marks the end.',
    exampleEn: 'With A and B inside repeat signs, the order is A A B B.',
  },
  'italian-terms': {
    titleEn: 'Remember the Italian terms',
    ruleEn:
      'Italian terms describe tempo, dynamics, articulation and character. Adagio is slow and calm; allegro, fast and lively; crescendo, gradually louder; diminuendo, gradually softer.',
    exampleEn:
      'Legato asks you to connect notes; staccato asks you to play them short and separated.',
  },
  'hand-independence': {
    titleEn: 'Remember to separate each hand’s attack',
    ruleEn:
      'In a two-hand score every event belongs to one hand. To tell which hand attacks on a beat, look at which note begins there: if the other hand is holding a long note or resting, it does not attack again. When both begin together, the attack is simultaneous. Practise each hand alone first, slowly and without tension, then join them.',
    exampleEn:
      'If the right hand holds a whole-note C while the left hand plays four quarter notes, only the left hand attacks on beat 2; both hands attack on beat 1.',
  },
  'arpeggio-fingering': {
    titleEn: 'Remember the arpeggio fingering',
    ruleEn:
      'In a one-octave major arpeggio, the right hand uses 1-2-3-5 when the tonic is a white key and 2-1-2-4 when it is a black key. Over two octaves the pattern repeats: 1-2-3-1-2-3-5 or 2-1-2-4-1-2-4. The left hand mirrors it: 5-4-2-1 on white keys and 5-3-2-1 on black keys.',
    exampleEn:
      'C major: C4-E4-G4-C5 uses 1-2-3-5. D-flat major: D♭4-F4-A♭4-D♭5 uses 2-1-2-4.',
  },
  pedal: {
    titleEn: 'Remember how to change the pedal',
    ruleEn:
      'Direct pedal is pressed together with the attack; syncopated pedal is pressed just after the attack and changed at the moment the harmony changes. For a clean change, release the pedal at the same instant you strike the new chord and press it again immediately: releasing too late mixes the harmonies; releasing too early cuts the sound. Practise without pedal first and add it only once fingering and rhythm are clear.',
    exampleEn:
      'In C–F–G–C, change the pedal at every chord change. If F blends with the previous C, the pedal stayed down too long: listen for the mud and fix the change instead of playing louder.',
  },
  'walking-bass': {
    titleEn: 'Remember how a walking bass is built',
    ruleEn:
      'The walking bass walks in quarter notes, one note per beat. In each measure the first beat states the chord root; the following beats use chord tones (third, fifth, seventh) and, especially on the last beat, a passing tone that leads to the next chord’s bass. The passing tone can be diatonic or chromatic (a semitone from the target). Keep the line close to the hand position, without big leaps, and feel the pulse as steps: steadiness matters more than the number of notes. If the line drags, slow down.',
    exampleEn:
      'In C, one possible line is C3–E3–G3–B2; A2–C3–E3–C#3; D3–F3–A3–F#3; G2–B2–D3–B2. The notes B2, C#3, F#3 and B2 are passing tones that prepare the next measure.',
  },
  stride: {
    titleEn: 'Remember how the stride is built',
    ruleEn:
      'The stride alternates the left hand between a deep bass note and a chord: bass–chord–bass–chord, one quarter note per beat. The bass falls on the strong beats (1 and 3) and usually alternates the root with the fifth; the chord falls on the weak beats (2 and 4), near the middle of the keyboard. The hand jumps from one register to the other without tightening the shoulder or the wrist. Practise slowly, with a dry pedal so each bass note and chord is heard separately, and speed up only when the pulse and the jump feel secure.',
    exampleEn:
      'In C, a basic stride can be C2–C3 E3 G3–G2–C3 E3 G3. The bass alternates C2 and G2, and the C major chord answers on beats 2 and 4. In the progression C–A minor–D minor–G, each measure repeats the same idea with its own chord.',
  },
  'sight-reading': {
    titleEn: 'Remember how to read at sight',
    ruleEn:
      'Reading at sight means reading music you do not know without stopping. The interval method has three steps: look at the key signature, the meter and the register before you start; find an anchor note (the first note or a known line); and read the rest by the distance between them, not by naming every note from scratch. A second moves to the next line or space; a third skips a line or space; a larger leap is controlled with an intermediate reference note. Always read one step ahead, with your eyes on the next note, and keep the pulse even if a mistake appears: correcting on the move is also part of the practice.',
    exampleEn:
      'If the first note is G4 and the next one is on the space above, the interval is a second and the note is A4. If the third note is two spaces higher, count A4 → B4 → C5. In a C major fragment that starts on C4 and moves up by steps, the notes are C4, D4, E4 and F4.',
  },
  'ear-melody': {
    titleEn: 'Remember how to play by ear',
    ruleEn:
      'Playing by ear has five steps: listen to the whole melody without playing; sing or hum it to fix the pitch; find the tonic and the first note; translate the shape into scale degrees (1, 2, 3, 5…); and play the answer while comparing it with what you heard. If you miss, do not guess: reduce the melody to two or three notes, sing the interval and listen again. Melodic memory is built with short fragments and spaced repetitions, not with one long listen.',
    exampleEn:
      'If the hidden melody is C4-D4-E4-G4 in C major, hear that it starts on the tonic, rises two steps and leaps to the fifth: 1-2-3-5. Play only C-D-E first, then add G4 and check whether the final leap sounds like the recording.',
  },
  alberti: {
    titleEn: 'Remember how the Alberti bass is built',
    ruleEn:
      'The Alberti bass is an eighth-note accompaniment that alternates bass, fifth, third and fifth: 1-5-3-5. In 4/4 the cell repeats twice per measure. The left hand stays close to the keys, with a light thumb on the fifth and without lifting the fingers too high. Variants change the order (for example, starting on the fifth) or the number of notes, but keep the rocking motion. If the pattern drags, slow down; if one note is louder, fix the weight before speeding up.',
    exampleEn:
      'C major: C3-G3-E3-G3, twice per measure. F major: F3-C4-A3-C4. In the inverted variant, G3-C3-E3-C3 keeps the same notes and changes the order.',
  },
  arpeggiated: {
    titleEn: 'Remember how to play an arpeggiated accompaniment',
    ruleEn:
      'In an arpeggiated accompaniment the left hand plays the chord notes one at a time in a repeating pattern. The 3-note pattern uses 1-5-3 and usually sits in triple meter; the 4-note pattern adds the fifth back and uses 1-5-3-5 in quadruple meter. Keep the pulse with the metronome, strike every note with the same intensity and look for the position that shares notes with the previous chord. If one note is louder or later, fix the hand before raising the tempo.',
    exampleEn:
      'C major in the left hand: C3-G3-E3 (1-5-3) in 3/4, or C3-G3-E3-G3 (1-5-3-5) in 4/4. In F major: F3-C4-A3 and F3-C4-A3-C4.',
  },
  accompaniment: {
    titleEn: 'Remember how to read a block accompaniment',
    ruleEn:
      'In a block accompaniment the full chord sounds on every attack. The note value sets the rhythm: whole notes for one chord per measure, half notes for two, quarter notes for four. In a lead sheet the melody sits on top and the chord symbol tells the left hand which chord to play; the bass can be alone or joined to the chord. Before playing, read the symbol, choose a comfortable position and keep the same fingering when the pattern repeats.',
    exampleEn:
      'In a “C | Am | F | G7” lead sheet, the left hand plays those four chords in half or quarter notes while the right hand carries the melody. In a bass-and-chord pattern the bass takes the strong beat and the chord the weak one.',
  },
  'style-pattern': {
    titleEn: 'Remember the pulse and harmony of the styles',
    ruleEn:
      'In popular styles the bar is usually 4/4 with the accent on beats 2 and 4 (backbeat). The accompaniment repeats the chord in eighths, quarters or half notes, and the left hand states the root. The shuffle and swing use unequal eighths, long-short, and comping attacks on the off-beats. Progressions repeat in short loops: I–V–vi–IV and vi–IV–I–V in pop/rock, I–IV–I–V in blues and ii–V–I in jazz. In the ii–V–I cadence the second degree is a minor seventh, the fifth is a dominant seventh and the first is a major seventh; the guide tones are the third and the seventh, and rootless voicings spread the third, fifth, seventh and ninth. In Latin rhythms bossa nova puts the root on 1 and 3 and the chord on 2 and 4, while salsa repeats a montuno cell over the clave. To read them, identify the key, count the degrees and check the symbol in each bar. Mark the pulse with your foot and keep the same pattern when the chord changes.',
    exampleEn:
      'In C major, the loop C–G–Am–F is I–V–vi–IV. In blues, C7–F7–C7–G7 is I–IV–I–V and the shuffle alternates long and short eighths. In jazz, Dm7–G7–Cmaj7 is ii–V–I and the guide tones F–C, B–F and E–B move by a semitone; a rootless Cmaj7 voicing is E–G–B–D (3-5-7-9). In C, Cmaj7–Am7–Dm7–G7 is I–vi–ii–V; bossa plays the root on 1 and 3 and the chord on 2 and 4, and the montuno attacks on 0, 0.5, 1.5, 2, 3 and 3.5.',
  },
}
