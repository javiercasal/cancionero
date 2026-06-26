import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

// Simulamos un entorno para que parser.js pueda importar config.js si es necesario
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Importamos el parser y renderer
import { parseChordPro } from '../src/js/parser.js';
import { renderSong } from '../src/js/renderer.js';

const SRC_DIR = path.join(projectRoot, 'src');
const DIST_DIR = path.join(projectRoot, 'dist');
const CANCIONES_SRC = path.join(SRC_DIR, 'canciones');
const CANCIONES_DIST = path.join(DIST_DIR, 'canciones');

async function build() {
  console.log('Iniciando generación de cancionero estático...');

  // Asegurar estructura de directorios dist
  await fs.mkdir(DIST_DIR, { recursive: true });
  await fs.mkdir(CANCIONES_DIST, { recursive: true });

  // Copiar assets
  await fs.cp(path.join(SRC_DIR, 'assets'), path.join(DIST_DIR, 'assets'), { recursive: true });
  await fs.cp(path.join(SRC_DIR, 'css'), path.join(DIST_DIR, 'css'), { recursive: true });
  await fs.cp(path.join(SRC_DIR, 'js'), path.join(DIST_DIR, 'js'), { recursive: true });
  await fs.copyFile(path.join(SRC_DIR, 'config.js'), path.join(DIST_DIR, 'config.js'));

  // Leer plantilla
  const templateStr = await fs.readFile(path.join(SRC_DIR, 'template.html'), 'utf8');

  // Leer archivos .cho
  const files = await fs.readdir(CANCIONES_SRC);
  const choFiles = files.filter(f => f.endsWith('.cho'));

  const songList = [];

  // Función simple para empaquetar los módulos ES locales en un solo script
  // para evitar errores de CORS al abrir los archivos HTML con file:///
  const inlineJS = async () => {
    const modules = [
      'config.js',
      'js/parser.js',
      'js/notation.js',
      'js/transpose.js',
      'js/align.js',
      'js/renderer.js',
      'js/ui.js',
      'js/main.js'
    ];
    let bundled = '';
    for (const mod of modules) {
      let code = await fs.readFile(path.join(SRC_DIR, mod), 'utf8');
      // Eliminar imports
      code = code.replace(/^import\s+.*?from\s+['"].*?['"];?$/gm, '');
      // Eliminar exports
      code = code.replace(/^export\s+default\s+/gm, 'const config = ');
      code = code.replace(/^export\s+const\s+/gm, 'const ');
      bundled += `\n/* --- ${mod} --- */\n${code}\n`;
    }
    // Envolver todo en un IIFE para no ensuciar el scope global (excepto window.cancionero)
    return `<script>\n(() => {\n${bundled}\n})();\n</script>`;
  };

  const bundledScript = await inlineJS();

  for (const file of choFiles) {
    try {
      const filePath = path.join(CANCIONES_SRC, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      const ast = parseChordPro(content);
      const { title, artist } = ast.metadata;

      // Pre-renderizar DOM
      const dom = new JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>');
      global.document = dom.window.document;
      const container = dom.window.document.getElementById('container');
      renderSong(ast, container);
      const preRenderedHtml = container.innerHTML;

      // Crear HTML inyectando datos
      let html = templateStr
        .replace(/\{\{TITLE\}\}/g, title || 'Sin Título')
        .replace(/\{\{ARTIST\}\}/g, artist || 'Desconocido')
        .replace(/\{\{CHORDPRO\}\}/g, content)
        .replace(/<!-- El contenido se inyectará aquí o será renderizado dinámicamente -->/g, preRenderedHtml)
        // Reemplazar la carga del módulo externo por el bundle local para evitar CORS
        .replace(/<script type="module" src="\.\.\/js\/main\.js"><\/script>/, bundledScript);

      const outFileName = file.replace('.cho', '.html');
      await fs.writeFile(path.join(CANCIONES_DIST, outFileName), html);

      songList.push({
        title: title || 'Sin Título',
        artist: artist || 'Desconocido',
        url: `canciones/${outFileName}`
      });

      console.log(`Generado: ${outFileName}`);
    } catch (e) {
      console.error(`Error procesando ${file}:`, e.message);
    }
  }

  // Ordenar lista
  songList.sort((a, b) => a.title.localeCompare(b.title));

  // Generar index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="es" data-bs-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Índice - Cancionero</title>
  <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
</head>
<body class="bg-body-tertiary">
  <div class="container py-5">
    <h1 class="mb-4 text-center">🎶 Cancionero</h1>
    
    <div class="row justify-content-center mb-4">
      <div class="col-md-8">
        <input type="text" id="searchInput" class="form-control form-control-lg" placeholder="Buscar por título o artista...">
      </div>
    </div>

    <div class="row justify-content-center">
      <div class="col-md-8">
        <ul class="list-group shadow-sm" id="songList">
          ${songList.map(song => `
            <li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center song-item" data-search="${song.title.toLowerCase()} ${song.artist.toLowerCase()}">
              <a href="${song.url}" class="text-decoration-none text-body stretched-link w-100">
                <strong>${song.title}</strong> <span class="text-muted ms-2">- ${song.artist}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  </div>

  <script>
    document.getElementById('searchInput').addEventListener('input', function(e) {
      const term = e.target.value.toLowerCase();
      const items = document.querySelectorAll('.song-item');
      items.forEach(item => {
        const text = item.getAttribute('data-search');
        if (text.includes(term)) {
          item.classList.remove('d-none');
          item.classList.add('d-flex');
        } else {
          item.classList.remove('d-flex');
          item.classList.add('d-none');
        }
      });
    });
  </script>
</body>
</html>`;

  await fs.writeFile(path.join(DIST_DIR, 'index.html'), indexHtml);
  console.log('¡Generación completada! Índice creado en dist/index.html');
}

build().catch(err => {
  console.error("Error crítico durante la generación:", err);
  process.exit(1);
});
