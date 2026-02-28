import { createWriteStream, mkdirSync } from 'fs';
import { get } from 'https';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const modelsDir = join(__dirname, '..', 'public', 'models');
mkdirSync(modelsDir, { recursive: true });

const BASE = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const FILES = [
    'tiny_face_detector_model-shard1',
    'tiny_face_detector_model-weights_manifest.json',
];

async function download(filename) {
    const url = `${BASE}/${filename}`;
    const dest = join(modelsDir, filename);
    return new Promise((resolve, reject) => {
        const file = createWriteStream(dest);
        get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                get(res.headers.location, (r) => r.pipe(file).on('finish', resolve).on('error', reject));
            } else {
                res.pipe(file).on('finish', resolve).on('error', reject);
            }
        }).on('error', reject);
    });
}

for (const f of FILES) {
    process.stdout.write(`Downloading ${f}... `);
    await download(f);
    console.log('done');
}
console.log('All model files downloaded to public/models/');
