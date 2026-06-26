import { parseChordPro } from './parser.js';
import { transposeSong } from './transpose.js';
import { renderSong } from './renderer.js';
import { alignChords } from './align.js';
import { initUI } from './ui.js';

// Estado global de la aplicación
const state = {
  originalSong: null,
  currentSong: null,
  transposeSteps: 0
};

// API Pública para permitir extensiones o acceso desde la consola
window.cancionero = {
  hooks: {
    onBeforeRender: [],
    onAfterRender: [],
    onTranspose: [],
  },
  
  registerHook(hookName, callback) {
    if (this.hooks[hookName]) {
      this.hooks[hookName].push(callback);
    }
  },

  getSong() {
    return state.currentSong;
  },

  transpose(steps, isReset = false) {
    if (!state.originalSong) return;

    if (isReset) {
      state.transposeSteps = 0;
    } else {
      state.transposeSteps += steps;
    }

    // Aplicar transposición sobre la canción ORIGINAL para evitar errores por acumulación
    state.currentSong = transposeSong(state.originalSong, state.transposeSteps);
    
    // Llamar a hooks
    this.hooks.onTranspose.forEach(cb => cb(state.currentSong));

    this.render();
  },

  render() {
    if (!state.currentSong) return;

    const container = document.getElementById('song-container');
    if (!container) return;

    // Hook onBeforeRender
    let songToRender = state.currentSong;
    this.hooks.onBeforeRender.forEach(cb => {
      songToRender = cb(songToRender) || songToRender;
    });

    // 1. Renderizar DOM
    renderSong(songToRender, container);

    // 2. Alinear Acordes usando medición real de texto (Range API)
    // Se usa requestAnimationFrame para asegurar que el navegador ha calculado las fuentes
    requestAnimationFrame(() => {
      alignChords(container);
      
      // Hook onAfterRender
      this.hooks.onAfterRender.forEach(cb => cb(container));
    });
  },
  
  loadFromText(text) {
    state.originalSong = parseChordPro(text);
    state.currentSong = state.originalSong;
    state.transposeSteps = 0;
    this.render();
  }
};

const init = () => {
  // Configurar UI
  initUI(
    (steps, isReset) => window.cancionero.transpose(steps, isReset),
    (isVisible) => {
      // Si se vuelven a mostrar los acordes, asegurarse de que estén alineados
      if (isVisible) {
        requestAnimationFrame(() => {
          alignChords(document.getElementById('song-container'));
        });
      }
    }
  );

  // Intentar cargar la canción desde el script incrustado en el HTML generado
  const scriptTag = document.getElementById('original-chordpro');
  if (scriptTag) {
    let content = scriptTag.textContent;
    // Si era JSON, parsearlo, si era texto crudo, usarlo directamente.
    // Según la especificación "contenido ChordPro original (el texto crudo)".
    window.cancionero.loadFromText(content);
  }

  // Reflujo de alineación si se redimensiona la ventana (puede cambiar fuentes o wrap)
  window.addEventListener('resize', () => {
    alignChords(document.getElementById('song-container'));
  });
};

// Inicialización
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
