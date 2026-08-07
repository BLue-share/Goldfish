import Phaser from 'phaser';
import { BgmManager } from '../systems/BgmManager';
import { ensureSignedIn } from '../services/AuthService';
import { isFirebaseConfigured } from '../firebase';
import { isTouchDevice } from '../utils/device';
import { isPortraitLayout } from '../utils/layout';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const portrait = isPortraitLayout(w, h);

    const g = this.add.graphics();
    g.fillGradientStyle(0x2a8bb0, 0x2a8bb0, 0x145a78, 0x145a78, 1);
    g.fillRect(0, 0, w, h);

    if (this.textures.exists('wakin')) {
      this.add.image(portrait ? w * 0.22 : 150, portrait ? h * 0.14 : 120, 'wakin')
        .setScale(portrait ? 0.28 : 0.35)
        .setAlpha(0.9);
    }
    if (this.textures.exists('demekin')) {
      this.add.image(portrait ? w * 0.8 : 650, portrait ? h * 0.72 : 480, 'demekin')
        .setScale(portrait ? 0.26 : 0.32)
        .setAlpha(0.85)
        .setFlipX(true);
    }

    const title = this.add.text(cx, portrait ? h * 0.22 : 150, '金魚すくい', {
      fontFamily: 'Arial Black, Arial',
      fontSize: portrait ? '52px' : '64px',
      color: '#ffe566',
      stroke: '#c04000',
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.04 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(cx, portrait ? h * 0.32 : 220, 'タップで金魚をすくえ！', {
      fontFamily: 'Arial',
      fontSize: portrait ? '20px' : '22px',
      color: '#e8f6ff',
    }).setOrigin(0.5);

    this.add.text(cx, portrait ? h * 0.37 : 255, '空振りするとポイが破れるよ', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#b8dcec',
    }).setOrigin(0.5);

    const touch = isTouchDevice();
    const btnW = Math.min(portrait ? w * 0.7 : 240, 280);
    const btnH = touch || portrait ? 64 : 56;
    const btnX = cx - btnW / 2;

    this.createButton(btnX, portrait ? h * 0.46 : 305, btnW, btnH, 0xff5533, 0xff7744, 'はじめる', 26, () => {
      BgmManager.play(this, 'bgm_title', 0.3);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('GameScene');
      });
    });

    const subBtnH = portrait ? 52 : 48;
    const subBtnW = portrait ? Math.min(150, w * 0.42) : 160;
    const subGap = 12;
    const subRowY = portrait ? h * 0.56 : 385;
    const subLeftX = cx - subBtnW - subGap / 2;
    const subRightX = cx + subGap / 2;

    this.createButton(subLeftX, subRowY, subBtnW, subBtnH, 0x3a7a90, 0x4a9ab0, '得点表', 18, () => {
      this.scene.start('ScoreTableScene');
    });

    this.createButton(subRightX, subRowY, subBtnW, subBtnH, 0x3a7a90, 0x4a9ab0, 'ランキング', 18, () => {
      this.scene.start('LeaderboardScene');
    });

    if (isFirebaseConfigured()) {
      void ensureSignedIn().then((user) => {
        if (user) {
          this.registry.set('firebaseUid', user.uid);
        }
      });
    }

    const highScore = localStorage.getItem('slashBurst_highScore') || '0';
    this.add.text(cx, portrait ? h * 0.68 : 470, `ベストスコア: ${highScore}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#d0eaf5',
    }).setOrigin(0.5);

    this.add.text(cx, portrait ? h * 0.74 : 510, '更紗和金が最高得点！', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#9ec8d8',
    }).setOrigin(0.5);

    const hint = this.add.text(cx, portrait ? h * 0.9 : 575, '画面をタップでBGM開始', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#8eb8c8',
    }).setOrigin(0.5);

    const tryPlayTitleBgm = () => {
      BgmManager.play(this, 'bgm_title', 0.35);
      hint.setText('');
    };

    this.input.on('pointerdown', tryPlayTitleBgm);
    tryPlayTitleBgm();

    this.cameras.main.fadeIn(300);
  }

  private createButton(
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    hover: number,
    label: string,
    fontSize: number,
    onClick: () => void
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x, y, w, h, 12);
    bg.setInteractive(new Phaser.Geom.Rectangle(x, y, w, h), Phaser.Geom.Rectangle.Contains);

    const text = this.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: 'Arial Black, Arial',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(hover, 1);
      bg.fillRoundedRect(x, y, w, h, 12);
      text.setScale(1.06);
    });
    bg.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(x, y, w, h, 12);
      text.setScale(1);
    });
    bg.on('pointerup', onClick);
  }
}
