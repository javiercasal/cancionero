/**
 * Módulo de UI.
 * Configura los eventos de los controles de la interfaz y gestiona el modo oscuro.
 */
import config from '../config.js';

export const initUI = (onTranspose, onToggleChords) => {
  // Configuración del tema (Modo Oscuro/Claro)
  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.textContent = theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
    }
  };

  // Inicializar tema
  let currentTheme = config.theme === 'oscuro' ? 'dark' : 'light';
  applyTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(currentTheme);
    });
  }

  // Controles de Transposición
  const btnUp = document.getElementById('btn-transpose-up');
  const btnDown = document.getElementById('btn-transpose-down');
  const btnReset = document.getElementById('btn-transpose-reset');

  if (btnUp) btnUp.addEventListener('click', () => onTranspose(1));
  if (btnDown) btnDown.addEventListener('click', () => onTranspose(-1));
  if (btnReset) btnReset.addEventListener('click', () => onTranspose(0, true)); // true indica reset

  // Visibilidad de Acordes
  const btnToggleChords = document.getElementById('btn-toggle-chords');
  let chordsVisible = true;

  if (btnToggleChords) {
    btnToggleChords.addEventListener('click', () => {
      chordsVisible = !chordsVisible;
      
      if (chordsVisible) {
        document.body.classList.remove('hide-chords');
        btnToggleChords.textContent = config.i18n.hideChords || 'Ocultar acordes';
      } else {
        document.body.classList.add('hide-chords');
        btnToggleChords.textContent = config.i18n.showChords || 'Mostrar acordes';
      }
      
      onToggleChords(chordsVisible);
    });
  }
};
