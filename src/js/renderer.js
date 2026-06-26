import { formatChord, formatKey } from './notation.js';

/**
 * Renderiza la canción completa en un contenedor del DOM.
 * @param {object} song Árbol AST de la canción.
 * @param {HTMLElement} container Contenedor donde renderizar.
 */
export const renderSong = (song, container) => {
  // Limpiar contenedor
  container.innerHTML = '';

  // Renderizar Cabecera
  const header = document.createElement('header');
  header.className = 'song-header mb-4';

  const title = document.createElement('h1');
  title.className = 'song-title';
  title.textContent = song.metadata.title;
  header.appendChild(title);

  const artist = document.createElement('h2');
  artist.className = 'song-artist text-muted h5';
  artist.textContent = song.metadata.artist;
  header.appendChild(artist);


  container.appendChild(header);

  // Renderizar Cuerpo (Letra y Acordes)
  const body = document.createElement('main');
  body.className = 'song-body';

  song.lines.forEach(line => {
    // Si la línea está vacía, insertar un salto de línea
    if (line.type === 'empty') {
      const brDiv = document.createElement('div');
      brDiv.className = 'song-line empty-line';
      brDiv.style.height = '1.5em';
      body.appendChild(brDiv);
      return;
    }

    const lineDiv = document.createElement('div');
    lineDiv.className = `song-line ${line.type}-line`;

    if (line.type === 'chorus') {
      lineDiv.classList.add('ps-3', 'border-start', 'border-3', 'border-primary', 'my-1');
    } else if (line.type === 'tab') {
      lineDiv.classList.add('font-monospace', 'bg-light', 'p-2', 'rounded');
    } else if (line.type === 'comment') {
      lineDiv.classList.add('fst-italic', 'text-muted', 'my-2');
    }

    // Elementos de la línea
    line.elements.forEach(el => {
      if (el.type === 'text' || el.type === 'space') {
        const textSpan = document.createElement('span');
        textSpan.className = 'text-segment';
        // Reemplazar espacios por espacios no rompibles explícitamente no es necesario 
        // porque white-space: nowrap y pre-wrap en CSS lo manejarán, pero aseguramos
        // el texto literal.
        textSpan.textContent = el.value;
        lineDiv.appendChild(textSpan);
      } else if (el.type === 'chord') {
        // Envoltura del acorde (width 0, in-line)
        const wrapper = document.createElement('span');
        wrapper.className = 'chord-wrapper';
        
        // El acorde en sí (position absolute)
        const chordSpan = document.createElement('span');
        chordSpan.className = 'chord fw-bold text-primary';
        chordSpan.textContent = formatChord(el.value);
        
        wrapper.appendChild(chordSpan);
        lineDiv.appendChild(wrapper);
      }
    });

    body.appendChild(lineDiv);
  });

  container.appendChild(body);
};
