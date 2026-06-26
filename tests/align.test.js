/**
 * @jest-environment jsdom
 */
import { alignChords, measureTextWidth } from '../src/js/align.js';

describe('Alineación de acordes', () => {
  let container;

  beforeEach(() => {
    // Configurar un DOM simulado para las pruebas
    container = document.createElement('div');
    container.id = 'song-container';

    // Línea de ejemplo: "Hola [C]mundo"
    const line = document.createElement('div');
    line.className = 'song-line verse-line';

    const textSpan1 = document.createElement('span');
    textSpan1.className = 'text-segment';
    textSpan1.textContent = 'Hola ';
    
    const chordWrapper = document.createElement('span');
    chordWrapper.className = 'chord-wrapper';
    
    const chord = document.createElement('span');
    chord.className = 'chord';
    chord.textContent = 'C';
    chordWrapper.appendChild(chord);

    const textSpan2 = document.createElement('span');
    textSpan2.className = 'text-segment';
    textSpan2.textContent = 'mundo';

    line.appendChild(textSpan1);
    line.appendChild(chordWrapper);
    line.appendChild(textSpan2);

    container.appendChild(line);
    document.body.appendChild(container);

    // Mockear la API Range para jsdom
    document.createRange = () => ({
      setStart: () => {},
      setEnd: () => {},
      getBoundingClientRect: () => ({ width: 50 }) // Supongamos que "Hola " mide 50px
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Calcula la posición correcta del acorde basado en el ancho del texto', () => {
    alignChords(container);
    
    const chordSpan = container.querySelector('.chord');
    // Como mockeamos que el ancho es 50, esperamos que el left sea 50px
    expect(chordSpan.style.left).toBe('50px');
  });
});
