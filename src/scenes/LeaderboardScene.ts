import Phaser from 'phaser';
import { ensureSignedIn } from '../services/AuthService';
import {
  fetchLeaderboard,
  getDisplayName,
  updateDisplayName,
  type LeaderboardEntry,
} from '../services/LeaderboardService';
import { isFirebaseConfigured } from '../firebase';
import { isPortraitLayout } from '../utils/layout';
import { showDomInput } from '../utils/domInput';

export class LeaderboardScene extends Phaser.Scene {
  private statusText?: Phaser.GameObjects.Text;
  private listContainer?: Phaser.GameObjects.Container;
  private portrait = false;
  private loading = false;

  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.portrait = isPortraitLayout(w, h);
    const portrait = this.portrait;
    const cx = w / 2;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a8bb0, 0x2a8bb0, 0x145a78, 0x145a78, 1);
    bg.fillRect(0, 0, w, h);

    this.add.text(cx, portrait ? 36 : 40, 'ランキング', {
      fontFamily: 'Arial Black, Arial',
      fontSize: portrait ? '32px' : '36px',
      color: '#ffe566',
      stroke: '#c04000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(cx, portrait ? 68 : 76, 'ベストスコア TOP 20', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#d0eaf5',
    }).setOrigin(0.5);

    this.statusText = this.add.text(cx, portrait ? 96 : 104, '読み込み中…', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#b8dcec',
    }).setOrigin(0.5);

    this.listContainer = this.add.container(0, 0);

    const btnY = portrait ? h - 52 : h - 46;
    const btnH = portrait ? 44 : 48;
    const gap = 8;
    const sideBtnW = Math.min(100, (w - gap * 4) / 3);

    this.createActionButton(
      cx - sideBtnW * 1.5 - gap,
      btnY,
      sideBtnW,
      btnH,
      0x3a7a90,
      0x4a9ab0,
      'タイトル',
      () => this.scene.start('TitleScene')
    );

    this.createActionButton(
      cx - sideBtnW / 2,
      btnY,
      sideBtnW,
      btnH,
      0x4a6a80,
      0x5a7a90,
      '名前変更',
      () => {
        void this.changeDisplayName();
      }
    );

    this.createActionButton(
      cx + sideBtnW / 2 + gap,
      btnY,
      sideBtnW,
      btnH,
      0x2a8a60,
      0x3aaa70,
      '更新',
      () => {
        void this.loadLeaderboard();
      }
    );

    if (isFirebaseConfigured()) {
      void this.loadLeaderboard();
    } else {
      this.statusText?.setText('Firebase 未設定のため\nランキングを表示できません');
    }

    this.cameras.main.fadeIn(200);
  }

  private async changeDisplayName(): Promise<void> {
    const name = await showDomInput({
      label: 'ランキング用の名前',
      placeholder: '8文字以内',
      defaultValue: getDisplayName(),
      maxLength: 8,
      submitLabel: '変更',
    });

    if (!name) {
      return;
    }

    this.statusText?.setText('名前を更新中…');
    await ensureSignedIn();
    const ok = await updateDisplayName(name);

    if (!ok) {
      this.statusText?.setText('名前の更新に失敗しました');
      return;
    }

    await this.loadLeaderboard();
  }

  private async loadLeaderboard(): Promise<void> {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.statusText?.setText('読み込み中…');
    this.listContainer?.removeAll(true);

    try {
      // 閲覧は名前不要。自分の行ハイライト用にログインだけ試みる
      const user = await ensureSignedIn();
      if (user) {
        this.registry.set('firebaseUid', user.uid);
      }

      const entries = await fetchLeaderboard(20);
      this.renderEntries(entries);
    } catch (error) {
      console.error('[LeaderboardScene] load failed:', error);
      this.statusText?.setText('ランキングの取得に失敗しました');
    } finally {
      this.loading = false;
    }
  }

  private renderEntries(entries: LeaderboardEntry[]): void {
    if (!this.listContainer || !this.statusText) {
      return;
    }

    this.listContainer.removeAll(true);
    this.statusText.setText('');

    const w = this.scale.width;
    const h = this.scale.height;
    const portrait = this.portrait;
    const padX = portrait ? 16 : 48;
    const top = portrait ? 118 : 128;
    const bottom = portrait ? h - 100 : h - 96;

    if (entries.length === 0) {
      this.statusText.setText('まだ記録がありません\nはじめてスコアを登録しよう！');
      return;
    }

    const rowH = Math.min(36, (bottom - top) / entries.length);
    const rowW = w - padX * 2;
    const currentUid = this.registry.get('firebaseUid') as string | undefined;

    entries.forEach((entry, index) => {
      const y = top + index * rowH + rowH / 2;
      const isTop = entry.rank <= 3;
      const isSelf = currentUid === entry.uid;

      const rowBg = this.add.graphics();
      rowBg.fillStyle(isSelf ? 0x3a8a60 : index % 2 === 0 ? 0x1a5a78 : 0x165068, isTop ? 0.55 : 0.35);
      rowBg.fillRoundedRect(padX, y - rowH * 0.42, rowW, rowH * 0.84, 8);

      const rankColor =
        entry.rank === 1 ? '#ffe566' : entry.rank === 2 ? '#d0d0d0' : entry.rank === 3 ? '#d4a574' : '#ffffff';

      this.listContainer!.add(rowBg);
      this.listContainer!.add(
        this.add.text(padX + 22, y, `${entry.rank}`, {
          fontFamily: 'Arial Black, Arial',
          fontSize: portrait ? '16px' : '18px',
          color: rankColor,
        }).setOrigin(0.5)
      );
      this.listContainer!.add(
        this.add.text(padX + (portrait ? 52 : 58), y, entry.displayName, {
          fontFamily: 'Arial',
          fontSize: portrait ? '14px' : '16px',
          color: isSelf ? '#aaffcc' : '#ffffff',
          stroke: '#1a4a60',
          strokeThickness: 2,
        }).setOrigin(0, 0.5)
      );
      this.listContainer!.add(
        this.add.text(w - padX - 12, y, `${entry.bestScore}`, {
          fontFamily: 'Arial Black, Arial',
          fontSize: portrait ? '18px' : '20px',
          color: '#ffe566',
        }).setOrigin(1, 0.5)
      );
    });
  }

  private createActionButton(
    x: number,
    cy: number,
    btnW: number,
    btnH: number,
    color: number,
    hover: number,
    label: string,
    onClick: () => void
  ): void {
    const btnY = cy - btnH / 2;

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x, btnY, btnW, btnH, 10);
    bg.setInteractive(new Phaser.Geom.Rectangle(x, btnY, btnW, btnH), Phaser.Geom.Rectangle.Contains);

    const text = this.add.text(x + btnW / 2, cy, label, {
      fontFamily: 'Arial Black, Arial',
      fontSize: btnW < 110 ? '15px' : '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(hover, 1);
      bg.fillRoundedRect(x, btnY, btnW, btnH, 10);
      text.setScale(1.05);
    });
    bg.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(x, btnY, btnW, btnH, 10);
      text.setScale(1);
    });
    bg.on('pointerup', onClick);
  }
}
