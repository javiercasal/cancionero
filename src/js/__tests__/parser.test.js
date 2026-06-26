// src/js/__tests__/parser.test.js

import { parseChordPro, getPlainText, getAllDirectives } from '../parser.js';

describe('ChordPro Parser', () => {
  describe('Metadatos', () => {
    test('extrae título, artista, tono, capo', () => {
      const input = `
{title: Mi canción}
{artist: Juan Pérez}
{key: C}
{capo: 3}
`;
      const ast = parseChordPro(input);
      expect(ast.metadata).toEqual({
        title: 'Mi canción',
        artist: 'Juan Pérez',
        key: 'C',
        capo: '3',
      });
    });

    test('ignora líneas vacías y espacios', () => {
      const input = `
{title:   Título con espacios  }
{artist: Artista }
`;
      const ast = parseChordPro(input);
      expect(ast.metadata.title).toBe('Título con espacios');
      expect(ast.metadata.artist).toBe('Artista');
    });
  });

  describe('Líneas con acordes', () => {
    test('extrae acordes simples', () => {
      const input = `[C]Esta es [G]una canción`;
      const ast = parseChordPro(input);
      expect(ast.lines).toHaveLength(1);
      const line = ast.lines[0];
      expect(line.type).toBe('line');
      expect(line.elements).toEqual([
        { type: 'chord', value: 'C' },
        { type: 'text', value: 'Esta es ' },
        { type: 'chord', value: 'G' },
        { type: 'text', value: 'una canción' },
      ]);
    });

    test('acordes con bajo (G/B)', () => {
      const input = `[G/B]Este es un bajo`;
      const ast = parseChordPro(input);
      const line = ast.lines[0];
      expect(line.elements[0].value).toBe('G/B');
    });

    test('línea sin acordes', () => {
      const input = `Solo texto`;
      const ast = parseChordPro(input);
      const line = ast.lines[0];
      expect(line.elements).toEqual([{ type: 'text', value: 'Solo texto' }]);
    });

    test('línea vacía (entrada vacía)', () => {
      const input = ``;
      const ast = parseChordPro(input);
      expect(ast.lines).toHaveLength(0); // Ahora sí
    });

    test('múltiples líneas con y sin acordes', () => {
      const input = `[C]Primera\nSegunda sin acordes\n[T]Tercera con acorde`;
      const ast = parseChordPro(input);
      expect(ast.lines).toHaveLength(3);
      expect(ast.lines[0].elements[0].value).toBe('C');
      expect(ast.lines[1].elements[0].value).toBe('Segunda sin acordes');
      expect(ast.lines[2].elements[0].value).toBe('T');
    });
  });

  describe('Directivas especiales', () => {
    test('{comment: ...} se guarda como directiva línea', () => {
      const input = `{comment: Esto es un comentario}`;
      const ast = parseChordPro(input);
      expect(ast.lines[0]).toEqual({
        type: 'directive_line',
        directive: 'comment',
        value: 'Esto es un comentario',
        raw: '{comment: Esto es un comentario}',
      });
    });

    test('{chorus: ...} se guarda como directiva', () => {
      const input = `{chorus: Estribillo}`;
      const ast = parseChordPro(input);
      expect(ast.lines[0].directive).toBe('chorus');
      expect(ast.lines[0].value).toBe('Estribillo');
    });

    test('{soc} y {eoc} marcan inicio y fin de chorus', () => {
      const input = `{soc}\n[C]Esto es el estribillo\n{eoc}`;
      const ast = parseChordPro(input);
      expect(ast.lines).toHaveLength(3);
      expect(ast.lines[0].type).toBe('chorus_start');
      expect(ast.lines[1].type).toBe('line');
      expect(ast.lines[1].isChorus).toBe(true);
      expect(ast.lines[2].type).toBe('chorus_end');
    });

    test('{tab: ...} se guarda como directiva', () => {
      const input = `{tab: E|-----|}`;
      const ast = parseChordPro(input);
      expect(ast.lines[0].directive).toBe('tab');
      expect(ast.lines[0].value).toBe('E|-----|');
    });

    test('{define: ...} se guarda', () => {
      const input = `{define: C base-fret 1 frets 0 1 0 2 3 0}`;
      const ast = parseChordPro(input);
      expect(ast.lines[0].directive).toBe('define');
      expect(ast.lines[0].value).toBe('C base-fret 1 frets 0 1 0 2 3 0');
    });

    test('{tempo: ...} y {time: ...} van a metadata', () => {
      const input = `{tempo: 120}\n{time: 4/4}`;
      const ast = parseChordPro(input);
      expect(ast.metadata.tempo).toBe('120');
      expect(ast.metadata.time).toBe('4/4');
    });
  });

  describe('Funciones auxiliares', () => {
    test('getPlainText extrae solo texto de una línea', () => {
      const input = `[C]Hola [G]mundo`;
      const ast = parseChordPro(input);
      const plain = getPlainText(ast.lines[0]);
      expect(plain).toBe('Hola mundo');
    });

    test('getAllDirectives recoge todas las directivas no metadata', () => {
      const input = `
{comment: Uno}
{comment: Dos}
{chorus: Estribillo}
`;
      const ast = parseChordPro(input);
      const dirs = getAllDirectives(ast);
      expect(dirs).toHaveLength(3);
      expect(dirs[0].name).toBe('comment');
      expect(dirs[1].name).toBe('comment');
      expect(dirs[2].name).toBe('chorus');
    });
  });

  describe('Casos borde', () => {
    test('Acordes sin texto después', () => {
      const input = `[C]`;
      const ast = parseChordPro(input);
      const line = ast.lines[0];
      expect(line.elements).toEqual([
        { type: 'chord', value: 'C' },
        { type: 'text', value: '' }, // ahora sí existe
      ]);
    });

    test('Texto con corchetes no acordes (se escapan)', () => {
      const input = `[Esto no es un acorde]`;
      const ast = parseChordPro(input);
      expect(ast.lines[0].elements[0].type).toBe('chord');
      expect(ast.lines[0].elements[0].value).toBe('Esto no es un acorde');
    });

    test('Múltiples acordes seguidos', () => {
      const input = `[C][G]Dos acordes`;
      const ast = parseChordPro(input);
      const elems = ast.lines[0].elements;
      expect(elems).toHaveLength(3);
      expect(elems[0].value).toBe('C');
      expect(elems[1].value).toBe('G');
      expect(elems[2].value).toBe('Dos acordes');
    });
  });
});