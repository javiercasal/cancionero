import { parseChordPro, parseChord } from '../src/js/parser.js';

describe('Parser de Acordes', () => {
  test('Normaliza la notación alemana H y B a B y Bb', () => {
    expect(parseChord('H')).toEqual({ root: 'B', suffix: '', bass: null });
    expect(parseChord('Hm')).toEqual({ root: 'B', suffix: 'm', bass: null });
    expect(parseChord('B')).toEqual({ root: 'A#', suffix: '', bass: null }); // 'Bb' normalizado a 'A#' en sostenidos
  });

  test('Maneja acordes con alteraciones (b y #) y los convierte a sostenidos', () => {
    expect(parseChord('Db')).toEqual({ root: 'C#', suffix: '', bass: null });
    expect(parseChord('Eb')).toEqual({ root: 'D#', suffix: '', bass: null });
    expect(parseChord('F#m7')).toEqual({ root: 'F#', suffix: 'm7', bass: null });
  });

  test('Extrae correctamente raíz, sufijo y bajo', () => {
    expect(parseChord('C#m7(b5)/E')).toEqual({ root: 'C#', suffix: 'm7(b5)', bass: 'E' });
    expect(parseChord('G/H')).toEqual({ root: 'G', suffix: '', bass: 'B' }); // H es Si natural
  });
});

describe('Parser de ChordPro', () => {
  const sample = `
{title: Test Song}
{artist: Test Artist}
{key: H}

[H]Hola [E]mundo
  [A]Con espacios al inicio
`;

  test('Extrae metadatos correctamente', () => {
    const ast = parseChordPro(sample);
    expect(ast.metadata.title).toBe('Test Song');
    expect(ast.metadata.artist).toBe('Test Artist');
    expect(ast.metadata.key).toBe('B'); // H se normaliza a B
  });

  test('Genera líneas con texto y acordes', () => {
    const ast = parseChordPro(sample);
    const verseLines = ast.lines.filter(l => l.type === 'verse');
    
    // Línea 1: "[H]Hola [E]mundo"
    expect(verseLines[0].elements).toEqual([
      { type: 'chord', value: 'B' },
      { type: 'text', value: 'Hola ' },
      { type: 'chord', value: 'E' },
      { type: 'text', value: 'mundo' }
    ]);

    // Línea 2: "  [A]Con espacios..."
    expect(verseLines[1].elements[0]).toEqual({ type: 'space', value: '  ' });
    expect(verseLines[1].elements[1]).toEqual({ type: 'chord', value: 'A' });
  });
});
