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

// Configurar JSDOM para Node
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

  await fs.mkdir(DIST_DIR, { recursive: true });
  await fs.mkdir(ASSETS_DIST, { recursive: true });
  await fs.mkdir(CSS_DIST, { recursive: true });

  await copyAssets();

  // Empaquetar JavaScript como IIFE (sin export)
  console.log('📦 Empaquetando JavaScript con esbuild (IIFE)...');
  const bundle = await esbuild.build({
    entryPoints: [path.join(SRC_DIR, 'js', 'main.js')],
    bundle: true,
    format: 'iife',          // <-- FORZAR IIFE
    platform: 'browser',
    target: 'es2020',
    write: false,
    minify: false,
    sourcemap: false,
    globalName: 'Cancionero', // Opcional
  });

  const bundledScript = bundle.outputFiles[0].text;

  // Leer plantilla
  console.log('📄 Cargando plantilla HTML...');
  let template = await fs.readFile(TEMPLATE_PATH, 'utf-8');

  // Buscar archivos .cho
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

    const song = parseChordPro(chordProContent);
    const container = document.createElement('div');
    container.id = 'song-container';
    renderSong(song, container);

    const title = song.metadata.title || path.basename(choFile, '.cho');
    const artist = song.metadata.artist || 'Desconocido';

    let html = template
      .replace('{{TITLE}}', title)
      .replace('{{ARTIST}}', artist)
      .replace('{{RENDERED_SONG}}', container.innerHTML)
      .replace('{{CHORDPRO_DATA}}', chordProContent)
      .replace('{{BUNDLED_JS}}', `<script>${bundledScript}</script>`);

    const outputFileName = choFile.replace(/\.cho$/, '.html');
    const outputPath = path.join(DIST_DIR, outputFileName);
    await fs.writeFile(outputPath, html);
    console.log(`✅ ${outputFileName} generado correctamente.`);
  }

  console.log('🎉 Generación completada.');
}

build().catch(err => {
  console.error('❌ Error durante el build:', err);
  process.exit(1);
});