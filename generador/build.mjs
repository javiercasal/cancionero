import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import * as esbuild from 'esbuild';
import { parseChordPro } from '../src/js/parser.js';
import { renderSong } from '../src/js/renderer.js';

// Directorios
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const CANCIONES_DIR = path.join(SRC_DIR, 'canciones');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ASSETS_SRC = path.join(SRC_DIR, 'assets');
const ASSETS_DIST = path.join(DIST_DIR, 'assets');
const CSS_SRC = path.join(SRC_DIR, 'css');
const CSS_DIST = path.join(DIST_DIR, 'css');
const TEMPLATE_PATH = path.join(SRC_DIR, 'template.html');

// --- Configurar JSDOM para que `document` esté disponible globalmente ---
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

async function copyAssets() {
  console.log('Copiando assets...');
  try {
    await fs.cp(ASSETS_SRC, ASSETS_DIST, { recursive: true, force: true });
    await fs.cp(CSS_SRC, CSS_DIST, { recursive: true, force: true });
    console.log('✅ Assets copiados correctamente.');
  } catch (err) {
    console.error('❌ Error al copiar assets:', err);
    throw err;
  }
}

async function build() {
  console.log('🚀 Iniciando generación del cancionero...');

  // 1. Preparar directorios de salida
  await fs.mkdir(DIST_DIR, { recursive: true });
  await fs.mkdir(ASSETS_DIST, { recursive: true });
  await fs.mkdir(CSS_DIST, { recursive: true });

  // 2. Copiar assets y CSS
  await copyAssets();

  // 3. Empaquetar JavaScript con esbuild (UNA SOLA VEZ)
  console.log('📦 Empaquetando JavaScript con esbuild...');
  const bundle = await esbuild.build({
    entryPoints: [path.join(SRC_DIR, 'js', 'main.js')],
    bundle: true,
    format: 'iife',
    globalName: 'Cancionero',
    platform: 'browser',
    target: 'es2020',
    write: false,
    minify: false,
    sourcemap: false,
  });
  const bundledScript = bundle.outputFiles[0].text;

  // 4. Leer la plantilla HTML
  console.log('📄 Cargando plantilla HTML...');
  let template = await fs.readFile(TEMPLATE_PATH, 'utf-8');

  // 5. Obtener lista de archivos .cho desde src/canciones/
  console.log(`📂 Buscando archivos .cho en ${CANCIONES_DIR}...`);
  let choFiles = [];
  try {
    const allFiles = await fs.readdir(CANCIONES_DIR);
    choFiles = allFiles.filter(f => f.endsWith('.cho'));
  } catch (err) {
    console.error(`❌ No se pudo leer el directorio ${CANCIONES_DIR}:`, err.message);
    console.log('💡 Asegúrate de que la carpeta "src/canciones/" existe y contiene archivos .cho.');
    process.exit(1);
  }

  if (choFiles.length === 0) {
    console.warn('⚠️ No se encontraron archivos .cho en', CANCIONES_DIR);
    console.log('🏁 Generación finalizada sin canciones.');
    return;
  }

  console.log(`✅ Encontrados ${choFiles.length} archivo(s) .cho.`);

  // 6. Procesar cada archivo .cho
  for (const choFile of choFiles) {
    const choPath = path.join(CANCIONES_DIR, choFile);
    console.log(`🎵 Procesando: ${choFile}`);

    let chordProContent;
    try {
      chordProContent = await fs.readFile(choPath, 'utf-8');
    } catch (err) {
      console.error(`❌ No se pudo leer ${choFile}:`, err.message);
      continue;
    }

    // Parsear y renderizar
    const song = parseChordPro(chordProContent);
    // Crear un contenedor usando el documento global (gracias a JSDOM)
    const container = document.createElement('div');
    container.id = 'song-container';
    renderSong(song, container);

    // Extraer metadatos
    const title = song.metadata.title || path.basename(choFile, '.cho');
    const artist = song.metadata.artist || 'Desconocido';

    // Generar HTML final
    let html = template
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{ARTIST\}\}/g, artist)
      .replace('<!-- {{RENDERED_SONG}} -->', container.innerHTML)
      .replace('<!-- {{CHORDPRO_DATA}} -->', chordProContent)
      .replace('<!-- {{BUNDLED_JS}} -->', `<script>${bundledScript}</script>`);

    // Guardar archivo
    const outputFileName = choFile.replace(/\.cho$/, '.html');
    const outputPath = path.join(DIST_DIR, outputFileName);
    await fs.writeFile(outputPath, html);
    console.log(`✅ ${outputFileName} generado correctamente.`);
  }

  console.log('🎉 Generación completada.');
}

// Ejecutar el build
build().catch(err => {
  console.error('❌ Error durante el build:', err);
  process.exit(1);
});