import { formatChord } from './notation.js';
import { getPlainText } from './parser.js';

/**
 * Renderiza la canción completa en un contenedor del DOM.
 * @param {object} song Árbol AST de la canción.
 * @param {HTMLElement} container Contenedor donde renderizar.
 */
export const renderSong = (song, container) => {
  container.innerHTML = '';

  // Cabecera
  const header = document.createElement('header');
  header.className = 'song-header mb-4';
  const title = document.createElement('h1');
  title.className = 'song-title';
  title.textContent = song.metadata.title || 'Sin título';
  header.appendChild(title);
  const artist = document.createElement('h2');
  artist.className = 'song-artist text-muted h5';
  artist.textContent = song.metadata.artist || '';
  header.appendChild(artist);
  container.appendChild(header);

  // Cuerpo
  const body = document.createElement('main');
  body.className = 'song-body';

  let i = 0;
  while (i < song.lines.length) {
    const line = song.lines[i];

    // ---- Ignorar líneas especiales que no deben renderizarse ----
    if (
      line.type === 'directive_line' ||
      line.type === 'chorus_start' ||
      line.type === 'chorus_end'
    ) {
      i++;
      continue;
    }

    // ---- Bloque de tablatura (agrupado) ----
    if (line.type === 'tab') {
      let tabContent = '';
      while (i < song.lines.length && song.lines[i].type === 'tab') {
        tabContent += getPlainText(song.lines[i]) + '\n';
        i++;
      }
      tabContent = tabContent.trimEnd();
      const pre = document.createElement('pre');
      pre.className = 'tab-block font-monospace bg-light p-2 rounded border';
      pre.textContent = tabContent;
      body.appendChild(pre);
      continue;
    }

    // ---- Líneas normales (con o sin acordes) ----
    // Asegurar que elements exista (fallback)
    if (!line.elements) {
      line.elements = [{ type: 'text', value: '' }];
    }

    const lineDiv = document.createElement('div');
    lineDiv.className = `song-line ${line.type}-line`;

    // Aplicar clase si es estribillo
    if (line.isChorus) {
      lineDiv.classList.add('ps-3', 'border-start', 'border-3', 'border-primary', 'my-1');
    }

    // Si es comentario, estilo cursiva
    if (line.type === 'comment') {
      lineDiv.classList.add('fst-italic', 'text-muted', 'my-2');
    }

    // Recorrer elementos de la línea
    line.elements.forEach(el => {
      if (el.type === 'text' || el.type === 'space') {
        const textSpan = document.createElement('span');
        textSpan.className = 'text-segment';
        textSpan.textContent = el.value;
        lineDiv.appendChild(textSpan);
      } else if (el.type === 'chord') {
        const wrapper = document.createElement('span');
        wrapper.className = 'chord-wrapper';
        const chordSpan = document.createElement('span');
        chordSpan.className = 'chord fw-bold text-primary';
        chordSpan.textContent = formatChord(el.value);
        wrapper.appendChild(chordSpan);
        lineDiv.appendChild(wrapper);
      }
    });

    body.appendChild(lineDiv);
    i++;
  }

  container.appendChild(body);
};