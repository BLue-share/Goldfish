import Phaser from 'phaser';
import { BgmManager } from '../systems/BgmManager';
import { ensureSignedIn } from '../services/AuthService';
import {
  getDisplayName,
  setDisplayName,
  submitBestScore,
} from '../services/LeaderboardService';
import { isFirebaseConfigured } from '../firebase';
import { GOLDFISH_DATA, GoldfishType } from '../entities/Goldfish';
import { isPortraitLayout } from '../utils/layout';
import { showDomInput } from '../utils/domInput';

interface ResultData {
  score: number;
  coins: number;
  scooped: number;
  scoopedByType?: Partial<Record<GoldfishType, number>>;
  highScore: number;
  isNewHighScore: boolean;
  poiBroken: boolean;
}

export class ResultScene extends Phaser.Scene {
  private rankStatusText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ResultScene' });
  }

  create(data: ResultData): void {
    if (!data || data.score === undefined) {
      data = this.registry.get('resultData') as ResultData;
    }
    if (data) {
      this.registry.set('resultData', data);
    }

    BgmManager.stop(this);

    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const portrait = isPortraitLayout(w, h);

    const g = this.add.graphics();
    g.fillGradientStyle(0x2a8bb0, 0x2a8bb0, 0x145a78, 0x145a78, 1);
    g.fillRect(0, 0, w, h);

    const header = data?.isNewHighScore
      ? '新記録！'
      : data?.poiBroken
        ? 'ポイ破れ…'
        : 'おしまい';
    const headerColor = data?.isNewHighScore ? '#ffe566' : '#ffffff';

    const headerText = this.add.text(cx, portrait ? 50 : 70, header, {
      fontFamily: 'Arial Black, Arial',
      fontSize: portrait ? '32px' : '36px',
      color: headerColor,
      stroke: '#1a4a60',
      strokeThickness: 5,
    }).setOrigin(0.5);

    if (data?.isNewHighScore) {
      this.tweens.add({
        targets: headerText,
        scale: { from: 1, to: 1.08 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const scoreDisplay = this.add.text(cx, portrait ? 110 : 130, '0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: portrait ? '42px' : '48px',
      color: '#ffffff',
      stroke: '#1a4a60',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0,
      to: data?.score ?? 0,
      duration: 1400,
      ease: 'Power2',
      onUpdate: (tween) => {
        scoreDisplay.setText(`${Math.floor(tween.getValue() ?? 0)} 点`);
      },
    });

    this.add.text(cx, portrait ? 160 : 175, `すくった: ${data?.scooped ?? 0} 匹`, {
      fontFamily: 'Arial',
      fontSize: portrait ? '14px' : '16px',
      color: '#d0eaf5',
    }).setOrigin(0.5);

    this.add.text(cx, portrait ? 185 : 200, `ベスト: ${data?.highScore ?? 0}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#9ec8d8',
    }).setOrigin(0.5);

    const showRankStatus = isFirebaseConfigured() && Boolean(data?.isNewHighScore);
    if (showRankStatus) {
      this.rankStatusText = this.add.text(cx, portrait ? 208 : 222, '', {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#aaffcc',
        align: 'center',
        wordWrap: { width: Math.min(w - 32, 360) },
      }).setOrigin(0.5);
      void this.submitRankingScore(data.score);
    }

    this.drawCatchList(data?.scoopedByType ?? {}, portrait, showRankStatus);

    const btnY = portrait ? h - 90 : h - 80;
    const btnW = portrait ? Math.min(150, w * 0.38) : 140;
    const gap = 16;
    const retryX = cx - btnW - gap / 2;
    const titleX = cx + gap / 2;

    this.makeButton(retryX, btnY, btnW, 50, 0xff5533, 0xff7744, 'もう一回', () => {
      this.scene.start('GameScene');
    });
    this.makeButton(titleX, btnY, btnW, 50, 0x3a7a90, 0x4a9ab0, 'タイトル', () => {
      this.scene.start('TitleScene');
    });

    this.cameras.main.fadeIn(300);
  }

  private async submitRankingScore(score: number): Promise<void> {
    if (!this.rankStatusText) {
      return;
    }

    this.rankStatusText.setText('ランキング送信中…');

    try {
      if (!getDisplayName()) {
        // リザルト表示直後のタッチがダイアログに干渉しないよう少し待つ
        await new Promise((r) => window.setTimeout(r, 200));
        const name = await showDomInput({
          label: '新記録！ランキング用の名前',
          placeholder: '8文字以内',
          maxLength: 8,
          game: this.game,
        });
        if (!name) {
          this.rankStatusText.setText('名前未設定のため送信しませんでした');
          return;
        }
        setDisplayName(name);
      }

      const user = await ensureSignedIn();
      if (!user) {
        this.rankStatusText.setText('ログインに失敗しました。再試行してください');
        return;
      }

      this.registry.set('firebaseUid', user.uid);
      const result = await submitBestScore(score, user);

      switch (result.status) {
        case 'updated':
          this.rankStatusText.setText('ランキングを更新しました！');
          break;
        case 'unchanged':
          this.rankStatusText.setText('すでに同じ以上の記録があります');
          break;
        case 'no-name':
          this.rankStatusText.setText('名前未設定のため送信できません');
          break;
        case 'no-user':
          this.rankStatusText.setText('ログインに失敗しました。再試行してください');
          break;
        case 'not-configured':
          this.rankStatusText.setText('ランキング設定がありません');
          break;
        default:
          this.rankStatusText.setText('ランキングを送信できませんでした');
          break;
      }
    } catch (error) {
      console.error('[ResultScene] submitRankingScore failed:', error);
      this.rankStatusText.setText('ランキング送信に失敗しました');
    }
  }

  private makeButton(
    x: number,
    y: number,
    bw: number,
    bh: number,
    color: number,
    hover: number,
    label: string,
    onClick: () => void
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x, y, bw, bh, 10);
    bg.setInteractive(new Phaser.Geom.Rectangle(x, y, bw, bh), Phaser.Geom.Rectangle.Contains);

    this.add.text(x + bw / 2, y + bh / 2, label, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(hover, 1);
      bg.fillRoundedRect(x, y, bw, bh, 10);
    });
    bg.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(x, y, bw, bh, 10);
    });
    bg.on('pointerup', onClick);
  }

  private drawCatchList(
    scoopedByType: Partial<Record<GoldfishType, number>>,
    portrait: boolean,
    showRankStatus = false
  ): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    // ランキング送信メッセージと「すくった種類」が重ならないよう下げる
    const offsetY = showRankStatus ? (portrait ? 28 : 32) : 0;

    this.add.text(cx, (portrait ? 220 : 230) + offsetY, 'すくった種類', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#ffe566',
    }).setOrigin(0.5);

    const caught = Object.entries(GOLDFISH_DATA)
      .map(([type, config]) => ({
        type: type as GoldfishType,
        name: config.name,
        rank: config.rank,
        count: scoopedByType[type as GoldfishType] ?? 0,
      }))
      .filter((e) => e.count > 0)
      .sort((a, b) => a.rank - b.rank);

    if (caught.length === 0) {
      this.add.text(cx, (portrait ? 360 : 320) + offsetY, '一匹もすくれなかった…', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#b8dcec',
      }).setOrigin(0.5);
      return;
    }

    const cols = portrait ? Math.min(3, caught.length) : Math.min(5, caught.length);
    const cellW = portrait ? w / cols - 8 : 140;
    const cellH = portrait ? 100 : 90;
    const startX = cx - ((cols - 1) * cellW) / 2;
    const startY = (portrait ? 280 : 275) + offsetY;
    const maxRows = portrait ? 4 : 3;

    caught.slice(0, cols * maxRows).forEach((entry, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;

      if (y > h - 140) return;

      if (this.textures.exists(entry.type)) {
        this.add.image(x, y - 8, entry.type).setScale(portrait ? 0.18 : 0.22).setOrigin(0.5);
      }

      this.add.text(x, y + 28, entry.name, {
        fontFamily: 'Arial',
        fontSize: portrait ? '11px' : '12px',
        color: '#ffffff',
        stroke: '#1a4a60',
        strokeThickness: 2,
      }).setOrigin(0.5);

      this.add.text(x, y + 44, `×${entry.count}`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '16px',
        color: '#ffe566',
        stroke: '#1a4a60',
        strokeThickness: 3,
      }).setOrigin(0.5);
    });
  }
}
