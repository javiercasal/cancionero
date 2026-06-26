import { formatNote } from '../src/js/notation.js';

describe('Módulo de Notación', () => {
  test('Formatea notas en sistema Latino', () => {
    expect(formatNote('C', 'latino', 'sharps')).toBe('Do');
    expect(formatNote('C#', 'latino', 'sharps')).toBe('Do#');
    
    // Con preferencia de bemoles
    expect(formatNote('A#', 'latino', 'flats')).toBe('Sib');
    expect(formatNote('D#', 'latino', 'flats')).toBe('Mib');
  });

  test('Formatea notas en sistema Alemán', () => {
    expect(formatNote('C', 'aleman', 'sharps')).toBe('C');
    expect(formatNote('B', 'aleman', 'sharps')).toBe('H');
    
    // Con preferencia de bemoles, A# -> Bb, que en alemán se escribe 'B'
    expect(formatNote('A#', 'aleman', 'flats')).toBe('B');
  });

  test('Mantiene sostenidos por defecto en inglés si no se especifica otra cosa', () => {
    expect(formatNote('F#', 'ingles', 'sharps')).toBe('F#');
    expect(formatNote('A#', 'ingles', 'flats')).toBe('Bb');
  });
});
