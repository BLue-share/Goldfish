import Phaser from 'phaser';
import { GOLDFISH_DATA, GoldfishType } from '../entities/Goldfish';

export const FISH_TEXTURE_KEYS = Object.keys(GOLDFISH_DATA) as GoldfishType[];

/** Vite の base（本番は /Goldfish/）を付与して GitHub Pages でも解決できるようにする */
function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${path.replace(/^\//, '')}`;
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a6a8a);
    this.add.text(width / 2, height / 2 - 20, '金魚すくい', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      color: '#ffe566',
    }).setOrigin(0.5);

    this.add.rectangle(width / 2, height / 2 + 40, 260, 16, 0x0d3a4a);
    const bar = this.add.rectangle(width / 2 - 130, height / 2 + 40, 0, 12, 0xffe566).setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 260 * value;
    });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error('[BootScene] load failed:', file.key, file.url);
    });

    for (const key of FISH_TEXTURE_KEYS) {
      this.load.image(key, assetUrl(`assets/sprites/${key}.png`));
    }

    this.load.audio('bgm_title', assetUrl('assets/audio/bgm_title.mp3'));
    this.load.audio('bgm_game', assetUrl('assets/audio/bgm_game.mp3'));
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
