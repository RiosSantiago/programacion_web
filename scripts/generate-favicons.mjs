/**
 * Genera los favicons del sitio a partir del logo real (logo_prueba-removebg-preview.webp).
 * - Recorta el margen transparente del logo (trim) para que se vea grande y nítido en la pestaña.
 * - Exporta favicon-16..512px PNG a public/ + favicon.png + apple-touch-icon.png.
 *
 * Uso: node scripts/generate-favicons.mjs
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { cwd } from 'process';

const LOGO_SRC = path.join(cwd(), 'public', 'images', 'logo_prueba-removebg-preview.webp');
const OUT_DIR = path.join(cwd(), 'public');
const SIZES = [16, 32, 48, 64, 128, 192, 256, 384, 512];
const TRIM_THRESHOLD = 10;

if (!fs.existsSync(LOGO_SRC)) {
  console.error(`No se encontró el logo en: ${LOGO_SRC}`);
  process.exit(1);
}

const trimmed = await sharp(LOGO_SRC).trim({ threshold: TRIM_THRESHOLD }).metadata();
const sourceMax = Math.max(trimmed.width, trimmed.height);
console.log(`Logo recortado: ${trimmed.width}x${trimmed.height}`);

// Genera un PNG cuadrado de `size`x`size` con el logo centrado sobre fondo transparente.
// Nunca escala más allá de la resolución original para que no se vea borroso.
async function renderFavicon(size) {
  const contentSize = Math.min(size, sourceMax);
  const body = await sharp(LOGO_SRC)
    .trim({ threshold: TRIM_THRESHOLD })
    .resize({
      width: contentSize,
      height: contentSize,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const meta = await sharp(body).metadata();
  const padX = Math.floor((size - meta.width) / 2);
  const padY = Math.floor((size - meta.height) / 2);

  return sharp(body)
    .extend({
      top: padY,
      bottom: size - meta.height - padY,
      left: padX,
      right: size - meta.width - padX,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(OUT_DIR, `favicon-${size}x${size}.png`));
}

for (const size of SIZES) {
  await renderFavicon(size);
  console.log(`✓ favicon-${size}x${size}.png`);
}

// favicon.png (fallback clásico)
await sharp(LOGO_SRC)
  .trim({ threshold: TRIM_THRESHOLD })
  .resize({
    width: 256,
    height: 256,
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(path.join(OUT_DIR, 'favicon.png'));
console.log('✓ favicon.png');

// apple-touch-icon.png: fondo blanco sólido (iOS pinta de negro las PNG transparentes)
await sharp(LOGO_SRC)
  .trim({ threshold: TRIM_THRESHOLD })
  .resize({
    width: 192,
    height: 192,
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .png()
  .toFile(path.join(OUT_DIR, 'apple-touch-icon.png'));
console.log('✓ apple-touch-icon.png');

console.log('\nListo. Borra la caché del navegador (Ctrl+Shift+R) y el favicon se verá con el logo real.');
