// Quick test of pixel analysis algorithm using sharp (available in node)
// Tests what position the canvas analysis would return for actor images

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const images = [
    'actors/Polotican.png',
    'actors/Robot.png',
    'actors/Scientist.png',
    'actors/Artist.png',
];

for (const img of images) {
    const imgPath = join(publicDir, img);
    const raw = readFileSync(imgPath);

    // Get image info
    const meta = await sharp(raw).metadata();
    const w = Math.round(meta.width * Math.min(1, 128 / Math.max(meta.width, meta.height)));
    const h = Math.round(meta.height * Math.min(1, 128 / Math.max(meta.width, meta.height)));

    // Resize and get raw RGBA pixels
    const { data } = await sharp(raw)
        .resize(w, h)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const searchHeight = Math.round(h * 0.55);
    let totalWeight = 0, weightX = 0, weightY = 0, visible = 0;

    for (let y = 0; y < searchHeight; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
            if (a < 20) continue;
            visible++;
            const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
            const lightness = (max + min) / 2;
            const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));
            const bias = 1 - (y / searchHeight) * 0.3;
            const weight = (a / 255) * (0.3 + sat * 0.7) * bias;
            totalWeight += weight;
            weightX += x * weight;
            weightY += y * weight;
        }
    }

    const cx = totalWeight > 0 ? weightX / totalWeight / w : 0.5;
    const cy = totalWeight > 0 ? weightY / totalWeight / h : 0.2;

    console.log(`${img}: ${meta.width}x${meta.height} → canvas ${w}x${h}, visible=${visible}, position=${Math.round(cx * 100)}% ${Math.round(cy * 100)}%`);
}
