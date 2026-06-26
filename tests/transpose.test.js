import { transposeNote, transposeChordString, transposeKey } from '../src/js/transpose.js';

describe('Módulo de Transposición', () => {
  test('Transpone notas individuales correctamente', () => {
    expect(transposeNote('C', 2)).toBe('D');
    expect(transposeNote('E', 1)).toBe('F');
    expect(transposeNote('B', 1)).toBe('C'); // Cruce de octava
    expect(transposeNote('C', -1)).toBe('B');
  });

  test('Transpone acordes complejos con raíz y bajo', () => {
    // C#m7(b5)/E + 2 semitonos -> D#m7(b5)/F#
    expect(transposeChordString('C#m7(b5)/E', 2)).toBe('D#m7(b5)/F#');
    
    // G/H (Sol con bajo en Si natural) - 2 semitonos -> F/A
    expect(transposeChordString('G/H', -2)).toBe('F/A');
  });

  test('Calcula la nueva tonalidad y la sugerencia de capo', () => {
    // Si pasamos de C a D (+2 semitonos) -> Capo 2
    expect(transposeKey('C', 2)).toEqual({ newKey: 'D', suggestedCapo: 2 });
    
    // Si pasamos de G a F (-2 semitonos) -> -2 mod 12 = 10
    expect(transposeKey('G', -2)).toEqual({ newKey: 'F', suggestedCapo: 10 });

    // Modos menores
    expect(transposeKey('Am', 3)).toEqual({ newKey: 'Cm', suggestedCapo: 3 });
  });
});
