import Phaser from 'phaser';
import { GOLDFISH_DATA } from '../entities/Goldfish';
import { isPortraitLayout } from '../utils/layout';

export class ScoreTableScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ScoreTableScene' });
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const portrait = isPortraitLayout(w, h);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a8bb0, 0x2a8bb0, 0x145a78, 0x145a78, 1);
    bg.fillRect(0, 0, w, h);

    if (portrait) {
      this.createPortraitLayout(w, h);
    } else {
      this.createLandscapeLayout(w, h);
    }

    this.cameras.main.fadeIn(200);
  }

  /** スマホ縦長: 1行1種のシンプルなリスト */
  private createPortraitLayout(w: number, h: number): void {
    const cx = w / 2;
    const list = Object.values(GOLDFISH_DATA).sort((a, b) => a.rank - b.rank);

    this.add.text(cx, 36, '得点表', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '32px',
      color: '#ffe566',
      stroke: '#c04000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(cx, 68, 'すくうとこの点数が入ります', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#d0eaf5',
    }).setOrigin(0.5);

    const padX = 20;
    const top = 92;
    const bottom = h - 88;
    const rowH = (bottom - top) / list.length;
    const rowW = w - padX * 2;

    list.forEach((fish, i) => {
      const y = top + i * rowH + rowH / 2;
      const isTop = fish.rank <= 3;
      const rowTop = y - rowH * 0.42;
      const rowHeight = rowH * 0.84;

      const rowBg = this.add.graphics();
      rowBg.fillStyle(i % 2 === 0 ? 0x1a5a78 : 0x165068, isTop ? 0.5 : 0.3);
      rowBg.fillRoundedRect(padX, rowTop, rowW, rowHeight, 10);

      // 順位
      this.add.text(padX + 28, y, `${fish.rank}`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '20px',
        color: isTop ? '#ffe566' : '#ffffff',
      }).setOrigin(0.5);

      // アイコン
      if (this.textures.exists(fish.type)) {
        const iconScale = Math.min(0.16, (rowHeight * 0.7) / 256);
        this.add.image(padX + 70, y, fish.type).setScale(iconScale).setOrigin(0.5);
      }

      // 名前（左寄せ・中央寄せ縦）
      this.add.text(padX + 100, y - 8, fish.name, {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#ffffff',
        stroke: '#1a4a60',
        strokeThickness: 2,
      }).setOrigin(0, 0.5);

      // 出現ラベル（名前の下）
      this.add.text(padX + 100, y + 12, rarityLabel(fish.rank), {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: rarityColor(fish.rank),
      }).setOrigin(0, 0.5);

      // 得点（右端固定）
      this.add.text(w - padX - 16, y, `${fish.score}`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '22px',
        color: '#ffe566',
      }).setOrigin(1, 0.5);

      this.add.text(w - padX - 16, y + 16, '点', {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#d0eaf5',
      }).setOrigin(1, 0.5);
    });

    this.createBackButton(cx, h - 52, Math.min(240, w * 0.6), 44);
  }

  /** PC・横向き */
  private createLandscapeLayout(w: number, h: number): void {
    const cx = w / 2;
    const list = Object.values(GOLDFISH_DATA).sort((a, b) => a.rank - b.rank);
    const pad = 48;

    this.add.text(cx, 36, '得点表', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      color: '#ffe566',
      stroke: '#c04000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(cx, 72, 'すくうとこの点数が入ります（連続で倍率UP）', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#d0eaf5',
    }).setOrigin(0.5);

    const headerY = 105;
    this.add.text(pad + 8, headerY, '順位', { fontFamily: 'Arial', fontSize: '13px', color: '#9ec8d8' });
    this.add.text(pad + 150, headerY, '金魚', { fontFamily: 'Arial', fontSize: '13px', color: '#9ec8d8' });
    this.add.text(w - pad - 180, headerY, '得点', { fontFamily: 'Arial', fontSize: '13px', color: '#9ec8d8' });
    this.add.text(w - pad - 70, headerY, '出現', { fontFamily: 'Arial', fontSize: '13px', color: '#9ec8d8' });

    const line = this.add.graphics();
    line.lineStyle(1, 0xffffff, 0.25);
    line.lineBetween(pad, headerY + 18, w - pad, headerY + 18);

    const rowH = 38;
    const startY = 148;
    const rowWidth = w - pad * 2;

    list.forEach((fish, i) => {
      const y = startY + i * rowH;
      const isTop = fish.rank <= 3;

      const rowBg = this.add.graphics();
      rowBg.fillStyle(i % 2 === 0 ? 0x1a5a78 : 0x165068, isTop ? 0.45 : 0.28);
      rowBg.fillRoundedRect(pad, y - 16, rowWidth, 34, 6);

      this.add.text(pad + 12, y, `${fish.rank}`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '18px',
        color: isTop ? '#ffe566' : '#ffffff',
      }).setOrigin(0, 0.5);

      if (this.textures.exists(fish.type)) {
        this.add.image(pad + 110, y, fish.type).setScale(0.14).setOrigin(0.5);
      }

      this.add.text(pad + 150, y, fish.name, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#1a4a60',
        strokeThickness: 2,
      }).setOrigin(0, 0.5);

      this.add.text(w - pad - 160, y, `${fish.score}`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '18px',
        color: '#ffe566',
      }).setOrigin(0.5);

      this.add.text(w - pad - 50, y, rarityLabel(fish.rank), {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: rarityColor(fish.rank),
      }).setOrigin(0.5);
    });

    this.createBackButton(cx, h - 46, 200, 48);
  }

  private createBackButton(cx: number, cy: number, btnW: number, btnH: number): void {
    const btnX = cx - btnW / 2;
    const btnY = cy - btnH / 2;

    const backBg = this.add.graphics();
    backBg.fillStyle(0x3a7a90, 1);
    backBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
    backBg.setInteractive(new Phaser.Geom.Rectangle(btnX, btnY, btnW, btnH), Phaser.Geom.Rectangle.Contains);

    const backText = this.add.text(cx, cy, 'タイトルへ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    backBg.on('pointerover', () => {
      backBg.clear();
      backBg.fillStyle(0x4a9ab0, 1);
      backBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
      backText.setScale(1.05);
    });
    backBg.on('pointerout', () => {
      backBg.clear();
      backBg.fillStyle(0x3a7a90, 1);
      backBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
      backText.setScale(1);
    });
    backBg.on('pointerup', () => {
      this.scene.start('TitleScene');
    });
  }
}

function rarityLabel(rank: number): string {
  if (rank <= 2) return 'とても稀';
  if (rank <= 4) return '稀';
  if (rank <= 7) return '普通';
  return 'よく出る';
}

function rarityColor(rank: number): string {
  if (rank <= 2) return '#ff8866';
  if (rank <= 4) return '#ffcc66';
  if (rank <= 7) return '#aaddff';
  return '#88eebb';
}
