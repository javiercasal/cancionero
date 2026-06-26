import { parseChord, stringifyChord } from './parser.js';

/**
 * Array de notas en notación inglesa con sostenidos.
 * Cada índice representa un semitono.
 */
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Encuentra el índice de una nota en el array NOTES.
 */
const getNoteIndex = (note) => {
  return NOTES.indexOf(note);
};

/**
 * Transpone una nota específica (ej. 'C#') por un número de semitonos.
 * @param {string} note Nota a transponer.
 * @param {number} semitones Número de semitonos a transponer.
 * @returns {string} Nueva nota transpuesta (en sostenidos).
 */
export const transposeNote = (note, semitones) => {
  if (!note) return note;
  const index = getNoteIndex(note);
  if (index === -1) return note; // No es una nota reconocida, la devolvemos igual
  
  // Cálculo seguro para números negativos y positivos usando módulo
  const newIndex = (((index + semitones) % 12) + 12) % 12;
  return NOTES[newIndex];
};

/**
 * Transpone un acorde parseado.
 * @param {string} chordStr Acorde en texto (ej. "G#m7/B").
 * @param {number} semitones Semitonos a transponer.
 * @returns {string} Acorde transpuesto en texto.
 */
export const transposeChordString = (chordStr, semitones) => {
  const parsed = parseChord(chordStr);
  const newRoot = transposeNote(parsed.root, semitones);
  const newBass = transposeNote(parsed.bass, semitones);
  
  return stringifyChord({
    root: newRoot,
    suffix: parsed.suffix,
    bass: newBass
  });
};

/**
 * Transpone una clave ({key: ...}) y retorna un objeto con la nueva clave y el cálculo del Capo.
 * @param {string} originalKey Clave original.
 * @param {number} semitones Semitonos transpuestos.
 * @returns {object} { newKey, suggestedCapo }
 */
export const transposeKey = (originalKey, semitones) => {
  if (!originalKey) return { newKey: '', suggestedCapo: 0 };
  
  let root = originalKey;
  let mode = '';
  if (originalKey.endsWith('m')) {
    root = originalKey.slice(0, -1);
    mode = 'm';
  }
  
  const newRoot = transposeNote(root, semitones);
  const suggestedCapo = (((semitones) % 12) + 12) % 12;
  
  return {
    newKey: newRoot + mode,
    suggestedCapo
  };
};

/**
 * Recibe un AST inmutable (Song) y retorna un nuevo AST transpuesto.
 * @param {object} song Árbol AST original.
 * @param {number} semitones Semitonos a transponer.
 * @returns {object} Nuevo AST Song.
 */
export const transposeSong = (song, semitones) => {
  // Transponer clave si existe
  let newKey = song.metadata.key;
  let newCapo = song.metadata.capo;
  
  if (song.metadata.key) {
    const keyInfo = transposeKey(song.metadata.key, semitones);
    newKey = keyInfo.newKey;
    newCapo = keyInfo.suggestedCapo || song.metadata.capo; // Muestra nuevo capo si es > 0, sino conserva el original o nada
  }

  const newSong = {
    metadata: {
      ...song.metadata,
      key: newKey,
      capo: newCapo
    },
    lines: song.lines.map(line => ({
      type: line.type,
      elements: line.elements.map(el => {
        if (el.type === 'chord') {
          return {
            type: 'chord',
            value: transposeChordString(el.value, semitones)
          };
        }
        return el;
      })
    }))
  };

  return newSong;
};
