import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * 金魚スプライトの背景透過処理。
 * 入力: assets/sprites-raw/*.png（未処理の元画像）
 * 出力: assets/sprites/ および public/assets/sprites/
 *
 * 使い方:
 *   node scripts/process-fish.mjs
 * 入力ディレクトリを変える場合:
 *   FISH_SRC=path/to/raw node scripts/process-fish.mjs
 */
const srcDir = process.env.FISH_SRC || 'assets/sprites-raw';
const outDir = 'assets/sprites';
const pubDir = 'public/assets/sprites';

const files = [
  'sarasa_wakin',
  'wakin',
  'comet',
  'ryukin',
  'shubunkin',
  'calico_ryukin',
  'bristol_shubunkin',
  'azumanishiki',
  'tancho',
  'demekin',
];

function isCyanBackground(r, g, b) {
  const cyanBias = g - r > 12 && b - r > 12;
  const pale = g > 210 && b > 210 && r > 160 && r < 240;
  return pale && cyanBias;
}

if (!fs.existsSync(srcDir)) {
  console.error(`入力ディレクトリが見つかりません: ${srcDir}`);
  console.error('未処理PNGを assets/sprites-raw/ に置くか、FISH_SRC でパスを指定してください。');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(pubDir, { recursive: true });

for (const name of files) {
  const input = path.join(srcDir, `${name}.png`);
  if (!fs.existsSync(input)) {
    console.warn('skip (not found):', input);
    continue;
  }

  const output = path.join(outDir, `${name}.png`);
  const img = sharp(input).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isCyanBackground(r, g, b)) {
      const cyanStrength = Math.min(g - r, b - r);
      if (cyanStrength > 20) {
        data[i + 3] = 0;
      } else {
        data[i + 3] = Math.floor(((20 - cyanStrength) / 8) * 255);
      }
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(output);

  fs.copyFileSync(output, path.join(pubDir, `${name}.png`));
  console.log(name, fs.statSync(output).size);
}

console.log('synced to', pubDir);
