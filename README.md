# Generador de Cancionero Estático (HTML + Bootstrap)

Este es un proyecto completamente autónomo y estático que convierte archivos de canciones en formato ChordPro (`.cho`) a HTML estilizado con Bootstrap 5.3.2.

## Características Principales

*   **100% Estático:** No requiere backend ni base de datos.
*   **Sin Dependencias Externas:** Bootstrap se incluye de manera local para un funcionamiento 100% offline.
*   **Transposición Dinámica:** Cambia de tono en tiempo real directamente en el navegador (Vanilla JavaScript).
*   **Alineación Perfecta:** Utiliza la API Range del DOM para posicionar los acordes de forma precisa, soportando fuentes proporcionales sin que se descuadre.
*   **Preparado para Imprimir:** Cuenta con estilos `@media print` que ocultan los botones y fuerzan márgenes y colores óptimos.
*   **Soporte de Notación:** Permite elegir entre notación Latina (Do, Re, Mi), Inglesa (C, D, E) y Alemana (C, D, E, F, G, A, H, B=Bb).

## Requisitos

Para **ver** o **usar** el cancionero generado, sólo necesitas un navegador web moderno.
Para **generar** el cancionero a partir de los archivos ChordPro, necesitas:
*   Node.js (versión >= 14)

## Estructura del Proyecto

*   `src/canciones/`: Carpeta donde se guardan los archivos `.cho`.
*   `src/js/` y `src/css/`: Lógica del sistema y estilos personalizados.
*   `src/assets/bootstrap/`: Archivos de Bootstrap 5.3.2.
*   `src/config.js`: Archivo de configuración central.
*   `dist/`: Carpeta generada que contiene los archivos HTML listos para ser publicados en GitHub Pages o cualquier servidor web, incluyendo `index.html`.
*   `generador/build.mjs`: Script en Node para generar la carpeta `dist`.

## Uso (Generación)

1. Abre una terminal en la raíz del proyecto.
2. Agrega o modifica tus canciones en la carpeta `src/canciones/` usando formato `.cho`.
3. Ejecuta el generador usando npm:
   ```bash
   npm run build
   ```
4. Los archivos estáticos se habrán creado en la carpeta `dist/`.
5. Abre `dist/index.html` en tu navegador para ver el resultado.

## Pruebas

Para ejecutar las pruebas automatizadas (Jest):

```bash
npm install
npm test
```

## Configuración Personalizada

Puedes modificar el archivo `src/config.js` para personalizar:
*   **Notación por defecto:** latino, inglés, alemán.
*   **Tema inicial:** claro u oscuro.
*   **Tamaño de fuente:** Ajustable.
*   **Textos (i18n):** Para internacionalización.

## Formato Soportado (ChordPro)

Se soportan las directivas principales:
* `{title: ...}`, `{artist: ...}`, `{key: ...}`, `{capo: ...}`
* `{comment: ...}` o `{c: ...}` para comentarios.
* `{chorus}` o `{soc}` y `{eoc}` para demarcar estribillos.
* `{tab}` o `{t: ...}` para tablaturas monoespaciadas.

Cualquier directiva no soportada es ignorada silenciosamente. La notación alemana dentro de los corchetes (ej. `[H]`) es validada y convertida a la base (Si natural).
