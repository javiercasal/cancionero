import { formatChord, formatKey } from './notation.js';
import { getPlainText } from './parser.js'; // <-- Asegúrate de que esta función esté exportada en parser.js

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
  title.textContent = song.metadata.title || 'Sin título';
  header.appendChild(title);

  const artist = document.createElement('h2');
  artist.className = 'song-artist text-muted h5';
  artist.textContent = song.metadata.artist || '';
  header.appendChild(artist);

  container.appendChild(header);

  // Renderizar Cuerpo (Letra y Acordes)
  const body = document.createElement('main');
  body.className = 'song-body';

  // Usamos un bucle for para poder agrupar líneas de tablatura
  let i = 0;
  while (i < song.lines.length) {
    const line = song.lines[i];

    // ---- AGREGADO: manejo de bloques de tablatura ----
    if (line.type === 'tab') {
      // Recolectar todas las líneas 'tab' consecutivas
      let tabContent = '';
      while (i < song.lines.length && song.lines[i].type === 'tab') {
        const text = getPlainText(song.lines[i]); // extrae el texto sin acordes
        tabContent += text + '\n';
        i++;
      }
      // Eliminar el último salto de línea sobrante
      tabContent = tabContent.trimEnd();

      // Crear un bloque <pre> con la tablatura completa
      const pre = document.createElement('pre');
      pre.className = 'tab-block font-monospace bg-light p-2 rounded border';
      pre.textContent = tabContent;
      body.appendChild(pre);
      continue; // Ya hemos avanzado i, continuar al siguiente ciclo
    }
    // ---- FIN DEL AGREGADO ----

    // Manejar líneas vacías (si las hay, aunque no se generan en el parser)
    if (line.type === 'empty') {
      const brDiv = document.createElement('div');
      brDiv.className = 'song-line empty-line';
      brDiv.style.height = '1.5em';
      body.appendChild(brDiv);
      i++;
      continue;
    }

    // Líneas normales (con o sin acordes)
    const lineDiv = document.createElement('div');
    lineDiv.className = `song-line ${line.type}-line`;

    if (line.isChorus) {
      lineDiv.classList.add('ps-3', 'border-start', 'border-3', 'border-primary', 'my-1');
    } else if (line.type === 'comment') {
      lineDiv.classList.add('fst-italic', 'text-muted', 'my-2');
    }

    // Elementos de la línea
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