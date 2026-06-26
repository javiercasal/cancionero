/**
 * Módulo de Alineación de Acordes.
 * Recalcula la posición horizontal de cada acorde midiendo el texto real
 * usando la API Range del DOM para soportar fuentes proporcionales y ligaduras.
 */

/**
 * Calcula el ancho de un texto dentro de un nodo de texto.
 * Extraído para poder ser mockeado en tests si es necesario.
 * @param {Text} textNode Nodo de texto a medir.
 * @param {number} offset Número de caracteres desde el inicio.
 * @returns {number} Ancho en píxeles.
 */
export const measureTextWidth = (textNode, offset) => {
  // Si estamos en un entorno sin getBoundingClientRect (ej. jsdom simplificado), devolver 0 (o mockear)
  if (!document.createRange) return 0;
  
  const range = document.createRange();
  try {
    // textNode puede ser dividido o múltiple, por simplificación
    // el renderer debe asegurar que el texto previo al acorde sea un único nodo de texto contiguo.
    range.setStart(textNode, 0);
    range.setEnd(textNode, offset);
    const rect = range.getBoundingClientRect();
    return rect.width;
  } catch (e) {
    console.warn("No se pudo medir el texto:", e);
    return 0;
  }
};

/**
 * Recorre el contenedor de la canción y alinea todos los acordes.
 * @param {HTMLElement} container Contenedor donde se renderizó la canción.
 */
export const alignChords = (container) => {
  // Buscar todas las líneas que contengan acordes
  const lines = container.querySelectorAll('.song-line');
  
  lines.forEach(line => {
    // Los contenedores de acordes están dentro de la línea
    const chordWrappers = line.querySelectorAll('.chord-wrapper');
    if (chordWrappers.length === 0) return;

    let accumulatedWidth = 0;

    // Para una alineación perfecta, medimos desde el principio de la línea hasta la posición de cada acorde.
    // Como las líneas están generadas secuencialmente: <span class="text-segment">texto</span><span class="chord-wrapper">...</span>
    
    // Iteramos por los nodos hijos de la línea
    const childNodes = Array.from(line.childNodes);
    
    childNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.classList.contains('text-segment')) {
          // Medimos el texto de este segmento
          const textNode = node.firstChild; // Asumimos que dentro de text-segment solo hay texto
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            accumulatedWidth += measureTextWidth(textNode, textNode.length);
          }
        } else if (node.classList.contains('chord-wrapper')) {
          // Asignamos la posición acumulada al contenedor absoluto
          node.style.left = `${accumulatedWidth}px`;
        }
      }
    });
  });
};
