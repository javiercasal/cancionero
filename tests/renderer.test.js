/**
 * @jest-environment jsdom
 */

import { renderSong } from '../src/js/renderer.js';

describe('Renderer', () => {
  test('no lanza error con canción vacía', () => {
    const container = document.createElement('div');
    const song = { metadata: {}, lines: [] };
    expect(() => renderSong(song, container)).not.toThrow();
  });

  test('agrupa líneas de tablatura en un solo bloque', () => {
    const container = document.createElement('div');
    const song = {
      metadata: { title: 'Test', artist: 'Artist' },
      lines: [
        { type: 'tab', elements: [{ type: 'text', value: 'e|-----|' }] },
        { type: 'tab', elements: [{ type: 'text', value: 'B|-----|' }] },
        { type: 'line', elements: [{ type: 'text', value: 'Letra normal' }] },
      ]
    };
    renderSong(song, container);
    // Verificar que el body tiene 2 hijos: el pre y la línea normal
    const body = container.querySelector('main');
    expect(body).not.toBeNull();
    const children = body.children;
    expect(children.length).toBe(2);
    // El primero debe ser un <pre> con clase tab-block
    const pre = children[0];
    expect(pre.tagName).toBe('PRE');
    expect(pre.className).toContain('tab-block');
    // El contenido del pre debe ser "e|-----|\nB|-----|"
    expect(pre.textContent).toBe('e|-----|\nB|-----|');
  });
});