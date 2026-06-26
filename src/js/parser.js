/**
 * Analizador Sintáctico (Parser) de ChordPro.
 * Convierte el texto fuente ChordPro en un Árbol de Sintaxis Abstracta (AST) inmutable.
 * Normaliza la notación alemana (H->B, B->Bb) y convierte todas las notas a su versión con sostenido (#).
 */

// Mapeo de normalización inicial (para notas base antes de sufijos)
// Soporta la traducción de notación alemana y la conversión a sostenidos estándar.
const normalizeNote = (noteStr) => {
  if (!noteStr) return '';
  // Convertimos a mayúscula para simplificar, manteniendo las alteraciones
  let n = noteStr.charAt(0).toUpperCase() + noteStr.slice(1);
  
  // Normalización alemana
  if (n === 'H') n = 'B';
  else if (n === 'B') n = 'Bb';
  
  // Tabla de equivalencias a sostenidos
  const enharmonics = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#'
  };

  return enharmonics[n] || n;
};

/**
 * Parsea un acorde en formato string ("G#m7/B") a sus componentes.
 * @param {string} chordStr El texto del acorde.
 * @returns {object} { root, suffix, bass } donde root y bass están normalizados a sostenidos.
 */
export const parseChord = (chordStr) => {
  // Regex para capturar: Raíz (A-G, opcional H, con opcional # o b), sufijo (resto antes del /), opcional /Bajo
  const chordRegex = /^([A-H][#b]?)(.*?)(?:\/([A-H][#b]?))?$/;
  const match = chordStr.match(chordRegex);
  
  if (!match) {
    // Fallback por si hay un formato de acorde muy inusual, devolvemos como root
    return { root: chordStr, suffix: '', bass: null };
  }

  const root = normalizeNote(match[1]);
  const suffix = match[2] || '';
  const bass = match[3] ? normalizeNote(match[3]) : null;

  return { root, suffix, bass };
};

/**
 * Reconstruye un acorde desde su objeto parseado.
 * @param {object} chordObj { root, suffix, bass }
 * @returns {string} El acorde en texto.
 */
export const stringifyChord = ({ root, suffix, bass }) => {
  return `${root}${suffix}${bass ? '/' + bass : ''}`;
};

/**
 * Normaliza una clave ({key: ...})
 */
const normalizeKey = (keyStr) => {
  let root = keyStr;
  let mode = '';
  if (keyStr.endsWith('m')) {
    root = keyStr.slice(0, -1);
    mode = 'm';
  }
  return normalizeNote(root) + mode;
};

/**
 * Convierte un texto ChordPro a un objeto Song (AST).
 * @param {string} text Contenido del archivo .cho
 * @returns {object} AST Song
 */
export const parseChordPro = (text) => {
  const lines = text.split(/\r?\n/);
  
  const song = {
    metadata: {
      title: 'Canción sin título',
      artist: 'Artista desconocido',
      key: 'C'
    },
    lines: []
  };

  let inChorus = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();

    // Líneas vacías
    if (trimmedLine === '') {
      song.lines.push({
        type: 'empty',
        elements: []
      });
      continue;
    }

    // Directivas {directiva: valor} o {directiva}
    if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
      const directiveContent = trimmedLine.slice(1, -1).trim();
      const colonIndex = directiveContent.indexOf(':');
      
      let name, value;
      if (colonIndex !== -1) {
        name = directiveContent.slice(0, colonIndex).trim().toLowerCase();
        value = directiveContent.slice(colonIndex + 1).trim();
      } else {
        name = directiveContent.toLowerCase();
        value = '';
      }

      // Procesar metadatos
      if (name === 'title') {
        song.metadata.title = value;
      } else if (name === 'artist') {
        song.metadata.artist = value;
      } else if (name === 'key') {
        song.metadata.key = normalizeKey(value);
      } else if (name === 'capo') {
        song.metadata.capo = parseInt(value, 10);
      } else if (name === 'comment' || name === 'c') {
        song.lines.push({
          type: 'comment',
          elements: [{ type: 'text', value }]
        });
      } else if (name === 'chorus' || name === 'soc') {
        inChorus = true;
      } else if (name === 'eoc') {
        inChorus = false;
      } else if (name === 'tab' || name === 't') { // Alternativa para tab
        song.lines.push({
          type: 'tab',
          elements: [{ type: 'text', value }]
        });
      }
      
      continue; // No añadir como línea de letra
    }

    // Procesa líneas con acordes o texto normal
    const elements = [];
    
    // Capturamos la tablatura usando regex o asumiendo que si inChorus no afecta a la captura de espacios iniciales.
    let currentIndex = 0;
    
    // Capturar espacios iniciales
    const leadingSpacesMatch = rawLine.match(/^(\s+)/);
    if (leadingSpacesMatch) {
      elements.push({ type: 'space', value: leadingSpacesMatch[1] });
      currentIndex = leadingSpacesMatch[1].length;
    }

    let currentText = '';
    
    while (currentIndex < rawLine.length) {
      const char = rawLine[currentIndex];

      if (char === '[') {
        // Encontramos un acorde. Guardar texto previo si lo hay.
        if (currentText) {
          elements.push({ type: 'text', value: currentText });
          currentText = '';
        }

        const endBracket = rawLine.indexOf(']', currentIndex);
        if (endBracket !== -1) {
          const chordRaw = rawLine.substring(currentIndex + 1, endBracket);
          // Parseamos y normalizamos el acorde, luego lo guardamos como string en el AST
          const parsedChord = parseChord(chordRaw);
          elements.push({ 
            type: 'chord', 
            value: stringifyChord(parsedChord) 
          });
          currentIndex = endBracket + 1;
        } else {
          // Si no hay cierre, tratamos el corchete como texto normal
          currentText += '[';
          currentIndex++;
        }
      } else {
        currentText += char;
        currentIndex++;
      }
    }

    if (currentText) {
      elements.push({ type: 'text', value: currentText });
    }

    song.lines.push({
      type: inChorus ? 'chorus' : 'verse',
      elements
    });
  }

  return song;
};
