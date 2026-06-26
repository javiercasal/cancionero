// parser.js

// ---------- CONSTANTES Y UTILIDADES PARA ACORDES ----------

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const GERMAN_TO_EN = {
  'H': 'B',
};

const FLAT_TO_SHARP = {
  'Bb': 'A#',
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Ebb': 'D',
  'Abb': 'G',
  'Bbb': 'A',
  'B': 'A#',
};

function normalizeRoot(root, isBass = false) {
  if (!root) return root;
  if (GERMAN_TO_EN[root]) return GERMAN_TO_EN[root];
  if (!isBass && FLAT_TO_SHARP[root]) return FLAT_TO_SHARP[root];
  if (!isBass && root.includes('b')) {
    const match = root.match(/^([A-G])b(.*)$/);
    if (match) {
      const note = match[1];
      const rest = match[2];
      const naturalIndex = NOTE_NAMES.indexOf(note);
      if (naturalIndex !== -1) {
        const sharpIndex = (naturalIndex - 1 + 12) % 12;
        const sharpNote = NOTE_NAMES[sharpIndex];
        return sharpNote + rest;
      }
    }
  }
  return root;
}

export function parseChord(chordStr) {
  if (!chordStr) return null;
  chordStr = chordStr.trim();

  let rootPart, bassPart = null;
  const slashIndex = chordStr.indexOf('/');
  if (slashIndex !== -1) {
    rootPart = chordStr.substring(0, slashIndex);
    bassPart = chordStr.substring(slashIndex + 1);
    bassPart = normalizeRoot(bassPart, true);
  } else {
    rootPart = chordStr;
  }

  const match = rootPart.match(/^([A-H][#b]?)(.*)$/);
  if (!match) {
    const normalized = normalizeRoot(rootPart, false);
    return { root: normalized, suffix: '', bass: bassPart || null };
  }

  let root = match[1];
  const suffix = match[2] || '';
  root = normalizeRoot(root, false);

  return {
    root,
    suffix,
    bass: bassPart || null,
  };
}

export function stringifyChord(chordObj) {
  if (!chordObj) return '';
  let result = chordObj.root + (chordObj.suffix || '');
  if (chordObj.bass) {
    result += '/' + chordObj.bass;
  }
  return result;
}

// ---------- PARSER DE CANCIONES COMPLETAS ----------

const DIRECTIVE_PATTERNS = {
  title: /^\{title\s*:\s*(.+?)\}$/i,
  artist: /^\{artist\s*:\s*(.+?)\}$/i,
  key: /^\{key\s*:\s*(.+?)\}$/i,
  capo: /^\{capo\s*:\s*(.+?)\}$/i,
  comment: /^\{comment\s*:\s*(.+?)\}$/i,
  chorus: /^\{chorus\s*:\s*(.+?)\}$/i,
  soc: /^\{soc\}$/i,
  eoc: /^\{eoc\}$/i,
  tab: /^\{tab\s*:\s*(.+?)\}$/i,
  // NUEVAS directivas para tablatura
  sot: /^\{sot\}$/i,
  eot: /^\{eot\}$/i,
  define: /^\{define\s*:\s*(.+?)\}$/i,
  tempo: /^\{tempo\s*:\s*(.+?)\}$/i,
  time: /^\{time\s*:\s*(.+?)\}$/i,
};

const METADATA_DIRECTIVES = ['title', 'artist', 'key', 'capo', 'tempo', 'time'];

function parseLineWithChords(line) {
  const elements = [];
  let remaining = line;
  let lastIndex = 0;
  const chordRegex = /\[([^\]]+)\]/g;
  let match;

  while ((match = chordRegex.exec(remaining)) !== null) {
    const chordText = match[1].trim();
    const before = remaining.slice(lastIndex, match.index);
    if (before) {
      elements.push({ type: 'text', value: before });
    }
    const chordObj = parseChord(chordText);
    const normalizedChord = chordObj ? stringifyChord(chordObj) : chordText;
    elements.push({ type: 'chord', value: normalizedChord });
    lastIndex = match.index + match[0].length;
  }

  const after = remaining.slice(lastIndex);
  elements.push({ type: 'text', value: after });

  return elements;
}

function parseDirective(line) {
  const trimmed = line.trim();
  for (const [name, pattern] of Object.entries(DIRECTIVE_PATTERNS)) {
    const match = trimmed.match(pattern);
    if (match) {
      return { type: 'directive', name, value: match[1] ? match[1].trim() : null };
    }
  }
  return null;
}

export function parseChordPro(text) {
  if (!text || text.trim() === '') {
    return { metadata: {}, lines: [] };
  }

  const lines = text.split(/\r?\n/);
  const metadata = {};
  const parsedLines = [];
  let inChorus = false;
  let inTab = false; // <-- NUEVO: estado para tablatura

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Líneas vacías
    if (trimmed === '') {
      // Si estamos dentro de una tablatura, la línea vacía también se marca como tab
      parsedLines.push({
        type: inTab ? 'tab' : 'line',
        elements: [{ type: 'text', value: '' }],
        isChorus: inChorus,
      });
      continue;
    }

    const directive = parseDirective(trimmed);
    if (directive) {
      // Metadatos
      if (METADATA_DIRECTIVES.includes(directive.name)) {
        let value = directive.value;
        if (directive.name === 'key') {
          const chordObj = parseChord(value);
          if (chordObj) {
            value = stringifyChord(chordObj);
          }
        }
        metadata[directive.name] = value;
        continue;
      }

      // Inicio / Fin de Chorus
      if (directive.name === 'soc') {
        inChorus = true;
        parsedLines.push({ type: 'chorus_start' });
        continue;
      }
      if (directive.name === 'eoc') {
        inChorus = false;
        parsedLines.push({ type: 'chorus_end' });
        continue;
      }

      // --- NUEVO: Inicio / Fin de Tablatura ---
      if (directive.name === 'sot') {
        inTab = true;
        // No agregamos línea al AST (es solo un marcador)
        continue;
      }
      if (directive.name === 'eot') {
        inTab = false;
        // No agregamos línea al AST
        continue;
      }

      // Otras directivas (comment, tab, define, tempo, time, etc.)
      parsedLines.push({
        type: 'directive_line',
        directive: directive.name,
        value: directive.value,
        raw: trimmed,
      });
      continue;
    }

    // Línea normal (con posible contenido y acordes)
    const elements = parseLineWithChords(raw);
    parsedLines.push({
      type: inTab ? 'tab' : 'line', // <-- Si estamos en tab, se marca como 'tab'
      elements,
      isChorus: inChorus,
    });
  }

  // Si no hay líneas pero el input no está vacío, añadir una línea vacía (fallback)
  if (parsedLines.length === 0 && text && text.trim() !== '') {
    parsedLines.push({
      type: 'line',
      elements: [{ type: 'text', value: '' }],
      isChorus: false,
    });
  }

  return {
    metadata,
    lines: parsedLines,
  };
}

// Alias para compatibilidad (si se usa en otro lado)
export const parseChordProLegacy = parseChordPro;

// Funciones auxiliares para extraer información del AST
export function getPlainText(line) {
  if (line.type !== 'line' && line.type !== 'tab') return '';
  return line.elements
    .filter(el => el.type === 'text')
    .map(el => el.value)
    .join('');
}

export function getAllDirectives(ast) {
  return ast.lines
    .filter(line => line.type === 'directive_line')
    .map(line => ({ name: line.directive, value: line.value }));
}