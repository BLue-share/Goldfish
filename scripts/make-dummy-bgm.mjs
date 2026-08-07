import fs from 'fs';
import path from 'path';

function writeToneWav(filePath, frequency, durationSec, volume = 0.08) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // soft sine + quiet 5th for a slightly more musical dummy loop
    const sample =
      Math.sin(2 * Math.PI * frequency * t) * 0.7 +
      Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.3;
    const fade = Math.min(1, t * 4, (durationSec - t) * 4);
    const value = Math.max(-1, Math.min(1, sample * volume * fade));
    buffer.writeInt16LE(Math.floor(value * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
  console.log('wrote', filePath, buffer.length);
}

const dir = 'public/assets/audio';
fs.mkdirSync(dir, { recursive: true });

// Title: warmer lower tone loop (~4s)
writeToneWav(path.join(dir, 'bgm_title.wav'), 220, 4, 0.06);
// Game: brighter tone loop (~3s)
writeToneWav(path.join(dir, 'bgm_game.mp3'), 330, 3, 0.05);

fs.mkdirSync('assets/audio', { recursive: true });
fs.copyFileSync(path.join(dir, 'bgm_title.wav'), 'assets/audio/bgm_title.wav');
fs.copyFileSync(path.join(dir, 'bgm_game.mp3'), 'assets/audio/bgm_game.mp3');
