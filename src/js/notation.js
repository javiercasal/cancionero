import config from '../config.js';
import { parseChord, stringifyChord } from './parser.js';

// Mapeos para diferentes notaciones
const NOTATION_MAP = {
  // Las claves son las notas en sostenidos (inglés)
  'C': { latino: 'Do', aleman: 'C' },
  'C#': { latino: 'Do#', aleman: 'C#' }, // Se convertirá a bemol si config.accidentalPreference === 'flats'
  'D': { latino: 'Re', aleman: 'D' },
  'D#': { latino: 'Re#', aleman: 'D#' },
  'E': { latino: 'Mi', aleman: 'E' },
  'F': { latino: 'Fa', aleman: 'F' },
  'F#': { latino: 'Fa#', aleman: 'F#' },
  'G': { latino: 'Sol', aleman: 'G' },
  'G#': { latino: 'Sol#', aleman: 'G#' },
  'A': { latino: 'La', aleman: 'A' },
  'A#': { latino: 'La#', aleman: 'A#' },
  'B': { latino: 'Si', aleman: 'H' }
};

// Conversión de sostenidos a bemoles
const SHARPS_TO_FLATS = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb'
};

const FLATS_LATINO = {
  'Db': 'Reb',
  'Eb': 'Mib',
  'Gb': 'Solb',
  'Ab': 'Lab',
  'Bb': 'Sib'
};

const FLATS_ALEMAN = {
  'Db': 'Db',
  'Eb': 'Eb',
  'Gb': 'Gb',
  'Ab': 'Ab',
  'Bb': 'B' // Nota importante en alemán: Bb se escribe B
};

/**
 * Convierte una nota base (en sostenidos) a la notación configurada.
 * @param {string} note Nota base (ej. 'A#').
 * @param {string} format 'latino', 'ingles', 'aleman'.
 * @param {string} preference 'sharps' o 'flats'.
 * @returns {string} Nota formateada.
 */
export const formatNote = (note, format, preference) => {
  if (!note) return '';

  let isFlat = preference === 'flats' && SHARPS_TO_FLATS[note] !== undefined;

  if (isFlat) {
    const flatNote = SHARPS_TO_FLATS[note];
    if (format === 'latino') return FLATS_LATINO[flatNote];
    if (format === 'aleman') return FLATS_ALEMAN[flatNote];
    return flatNote; // ingles
  }

  // Sostenidos
  if (format === 'latino') return NOTATION_MAP[note]?.latino || note;
  if (format === 'aleman') return NOTATION_MAP[note]?.aleman || note;
  return note; // ingles
};

/**
 * Formatea un acorde completo según la configuración.
 * @param {string} chordStr Acorde parseado con sostenidos (ej. "G#m7/A#").
 * @returns {string} Acorde formateado.
 */
export const formatChord = (chordStr) => {
  const { notation, accidentalPreference } = config;
  const parsed = parseChord(chordStr);
  
  const rootFormat = formatNote(parsed.root, notation, accidentalPreference);
  const bassFormat = parsed.bass ? formatNote(parsed.bass, notation, accidentalPreference) : null;

  return `${rootFormat}${parsed.suffix}${bassFormat ? '/' + bassFormat : ''}`;
};

/**
 * Formatea una clave ({key: ...})
 */
export const formatKey = (keyStr) => {
  if (!keyStr) return '';
  let root = keyStr;
  let mode = '';
  if (keyStr.endsWith('m')) {
    root = keyStr.slice(0, -1);
    mode = 'm';
  }
  const { notation, accidentalPreference } = config;
  return formatNote(root, notation, accidentalPreference) + mode;
};
