/**
 * Configuración global del Cancionero.
 * Todas las configuraciones personalizables se encuentran aquí.
 */
export default {
  // Cómo se mostrarán las notas: 'latino' (Do, Re, Mi), 'ingles' (C, D, E), 'aleman' (C, D, E, F, G, A, H)
  notation: 'latino',   
  
  // Preferencia para alteraciones si no está en la armadura original de la tonalidad: 'sharps' (sostenidos), 'flats' (bemoles)
  accidentalPreference: 'sharps', 
  
  // Tonalidad por defecto si el archivo .cho no tiene directiva {key: ...}
  defaultKey: 'C',      
  
  // Tamaño base en píxeles para la letra
  fontSize: 18,         
  
  // Tema inicial de la interfaz: 'claro' o 'oscuro'
  theme: 'claro',       
  
  // Límite de semitonos a transponer (evita bucles excesivos, típicamente 11)
  maxTransposeSteps: 11, 
  
  // Indica si debe calcularse y mostrarse la sugerencia de Capo al transponer
  showCapo: true,       
  
  // Textos y etiquetas (soporte básico para internacionalización futura)
  i18n: {               
    up: 'Subir medio tono',
    down: 'Bajar medio tono',
    darkMode: 'Modo oscuro',
    showChords: 'Mostrar acordes',
    hideChords: 'Ocultar acordes'
  }
};
