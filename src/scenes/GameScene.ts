import Phaser from 'phaser';
import { Goldfish, GoldfishType } from '../entities/Goldfish';
import { ComboSystem } from '../systems/ComboSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { BgmManager } from '../systems/BgmManager';
import { showDamageNumber } from '../effects/DamageNumber';
import { screenShake } from '../effects/ScreenShake';
import { spawnSplash, spawnScoopRing, spawnSparkles } from '../effects/Particles';
import { isTouchDevice } from '../utils/device';
import { isPortraitLayout } from '../utils/layout';

const GAME_DURATION = 60000;
const MAX_POI = 5;
const LUCKY_CHANCE = 0.1;
const LUCKY_MULTIPLIER = 3;
const SCOOP_RADIUS_BURST = 1.4;
const TOUCH_HIT_SCALE = 1.45;

export class GameScene extends Phaser.Scene {
  private fishList: Goldfish[] = [];
  private comboSystem!: ComboSystem;
  private scoreSystem!: ScoreSystem;
  private spawnSystem!: SpawnSystem;

  private poi = MAX_POI;
  private scoopedCount = 0;
  private scoopedByType: Partial<Record<GoldfishType, number>> = {};
  private gameTimer = GAME_DURATION;
  private isGameOver = false;

  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;
  private poiText!: Phaser.GameObjects.Text;
  private labelText!: Phaser.GameObjects.Text;
  private burstOverlay!: Phaser.GameObjects.Graphics;
  private comboGaugeBg!: Phaser.GameObjects.Graphics;
  private comboGaugeFill!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.fishList = [];
    this.poi = MAX_POI;
    this.scoopedCount = 0;
    this.scoopedByType = {};
    this.gameTimer = GAME_DURATION;
    this.isGameOver = false;

    this.comboSystem = new ComboSystem();
    this.scoreSystem = new ScoreSystem();
    this.spawnSystem = new SpawnSystem();

    this.createBackground();
    this.createUI();
    this.createBurstOverlay();

    BgmManager.play(this, 'bgm_game', 0.28);
    this.input.mouse?.disableContextMenu();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleTap(pointer.worldX, pointer.worldY);
    });
  }

  private get W(): number {
    return this.scale.width;
  }

  private get H(): number {
    return this.scale.height;
  }

  private createBackground(): void {
    const w = this.W;
    const h = this.H;
    const g = this.add.graphics();
    g.fillGradientStyle(0x3aa0c8, 0x3aa0c8, 0x1a6a8a, 0x1a6a8a, 1);
    g.fillRect(0, 0, w, h);

    g.lineStyle(2, 0xffffff, 0.08);
    for (let y = 40; y < h - 20; y += 36) {
      g.beginPath();
      g.moveTo(20, y);
      for (let x = 40; x < w - 20; x += 40) {
        g.lineTo(x, y + Math.sin(x * 0.05 + y) * 4);
      }
      g.strokePath();
    }

    // Soft bottom sand（枠線は描かない＝画面端の境界を消す）
    g.fillStyle(0xc9b896, 0.28);
    g.fillEllipse(w / 2, h + 10, w * 1.05, 100);
  }

  private createUI(): void {
    const w = this.W;
    const h = this.H;
    const portrait = isPortraitLayout(w, h);
    const topY = portrait ? 36 : 28;
    const bottomCombo = portrait ? h - 70 : h - 40;
    const bottomMult = portrait ? h - 100 : h - 70;
    const gaugeY = portrait ? h - 36 : h - 20;

    this.scoreText = this.add.text(w / 2, topY, 'すくった: 0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: portrait ? '22px' : '26px',
      color: '#ffffff',
      stroke: '#1a4a60',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(200);

    this.timerText = this.add.text(w - 40, topY, '60', {
      fontFamily: 'Arial Black, Arial',
      fontSize: portrait ? '22px' : '24px',
      color: '#ffe566',
      stroke: '#1a4a60',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200);

    this.comboText = this.add.text(w / 2, bottomCombo, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#88eeff',
      stroke: '#1a4a60',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    this.multiplierText = this.add.text(w / 2, bottomMult, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '32px',
      color: '#ff7744',
      stroke: '#1a4a60',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200);

    this.labelText = this.add.text(w / 2, h * 0.42, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '56px',
      color: '#ffd700',
      stroke: '#c04000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    this.poiText = this.add.text(24, topY, this.getPoiDisplay(), {
      fontFamily: 'Arial',
      fontSize: portrait ? '18px' : '20px',
      color: '#fff8e8',
      stroke: '#1a4a60',
      strokeThickness: 3,
    }).setOrigin(0, 0.5).setDepth(200);

    this.comboGaugeBg = this.add.graphics().setDepth(199);
    this.comboGaugeFill = this.add.graphics().setDepth(199);
    this.drawComboGauge(0, gaugeY);
  }

  private createBurstOverlay(): void {
    this.burstOverlay = this.add.graphics();
    this.burstOverlay.setDepth(150);
    this.burstOverlay.setAlpha(0);
    this.burstOverlay.disableInteractive();
  }

  private getPoiDisplay(): string {
    return 'ポイ ' + '●'.repeat(this.poi) + '○'.repeat(MAX_POI - this.poi);
  }

  private drawComboGauge(ratio: number, gaugeY?: number): void {
    const w = this.W;
    const h = this.H;
    const y = gaugeY ?? (isPortraitLayout(w, h) ? h - 36 : h - 20);
    const gx = w * 0.12;
    const gw = w * 0.76;
    const gh = 8;

    this.comboGaugeBg.clear();
    this.comboGaugeBg.fillStyle(0x1a4a60, 0.7);
    this.comboGaugeBg.fillRoundedRect(gx, y, gw, gh, 4);

    this.comboGaugeFill.clear();
    if (ratio > 0) {
      const color = ratio > 0.7 ? 0x66ffaa : ratio > 0.3 ? 0x66ddff : 0xffcc66;
      this.comboGaugeFill.fillStyle(color, 1);
      this.comboGaugeFill.fillRoundedRect(gx, y, gw * ratio, gh, 4);
    }
  }

  private handleTap(x: number, y: number): void {
    if (this.isGameOver) return;

    const comboState = this.comboSystem.getState();
    const touchScale = isTouchDevice() ? TOUCH_HIT_SCALE : 1;
    const radiusScale = (comboState.isBurst ? SCOOP_RADIUS_BURST : 1) * touchScale;

    let best: Goldfish | null = null;
    let bestDist = Infinity;

    for (const fish of this.fishList) {
      if (fish.scooped) continue;
      const dx = x - fish.x;
      const dy = y - fish.y;
      const r = fish.config.hitRadius * radiusScale;
      const distSq = dx * dx + dy * dy;
      if (distSq <= r * r && distSq < bestDist) {
        bestDist = distSq;
        best = fish;
      }
    }

    if (best) {
      this.scoopFish(best, x, y);
    } else {
      this.missScoop(x, y, comboState.isBurst);
    }
  }

  private scoopFish(fish: Goldfish, tapX: number, tapY: number): void {
    if (fish.scooped) return;
    fish.scooped = true;

    const comboState = this.comboSystem.getState();
    const isLucky = comboState.isBurst || Math.random() < LUCKY_CHANCE;
    const baseScore = fish.config.score * (isLucky ? LUCKY_MULTIPLIER : 1);

    spawnScoopRing(this, tapX, tapY, fish.config.hitRadius);
    spawnSplash(this, fish.x, fish.y, true);
    spawnSparkles(this, fish.x, fish.y, isLucky ? 6 : 4);
    screenShake(this, isLucky ? 2.5 : 1.5, 40);

    const newCombo = this.comboSystem.hit(this.time.now);
    const gained = this.scoreSystem.addScore(baseScore, newCombo.multiplier);
    this.scoreSystem.addCoins(fish.config.coinReward);
    this.scoopedCount++;
    const type = fish.config.type;
    this.scoopedByType[type] = (this.scoopedByType[type] ?? 0) + 1;

    showDamageNumber(this, fish.x, fish.y - 24, gained, isLucky);

    if (newCombo.milestoneBonus > 0) {
      this.scoreSystem.addScore(newCombo.milestoneBonus, 1);
    }

    if (fish.config.rank <= 5) {
      this.showFishName(fish.x, fish.y + 18, fish.config.name);
    }

    if (newCombo.labelJustReached) {
      this.showComboLabel(newCombo.label);
    }

    this.scoreText.setText(`すくった: ${this.scoopedCount}　${this.scoreSystem.getScore()}点`);

    this.tweens.add({
      targets: fish,
      y: fish.y - 80,
      alpha: 0,
      scale: 0.4,
      duration: 280,
      ease: 'Back.easeIn',
      onComplete: () => {
        const idx = this.fishList.indexOf(fish);
        if (idx !== -1) this.fishList.splice(idx, 1);
        fish.destroy();
      },
    });
  }

  private missScoop(x: number, y: number, isBurst: boolean): void {
    spawnSplash(this, x, y, false);
    spawnScoopRing(this, x, y, 36);
    this.comboSystem.reset();

    if (isBurst) return;

    this.poi--;
    this.poiText.setText(this.getPoiDisplay());
    screenShake(this, 5, 90);

    if (this.poi <= 0) {
      this.showComboLabel('ポイ破れ…');
      this.endGame();
    }
  }

  update(time: number, delta: number): void {
    if (this.isGameOver) return;

    this.gameTimer -= delta;
    if (this.gameTimer <= 0) {
      this.endGame();
      return;
    }
    this.timerText.setText(Math.ceil(this.gameTimer / 1000).toString());

    const w = this.W;
    const h = this.H;

    const spawns = this.spawnSystem.update(delta);
    if (spawns) {
      for (const config of spawns) {
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft
          ? Phaser.Math.Between(-30, 40)
          : Phaser.Math.Between(w - 40, w + 30);
        const y = Phaser.Math.Between(Math.floor(h * 0.12), Math.floor(h * 0.72));
        const fish = new Goldfish(this, x, y, config);
        fish.setSwimDirection(fromLeft ? 1 : -1);
        this.fishList.push(fish);
      }
    }

    for (let i = this.fishList.length - 1; i >= 0; i--) {
      const fish = this.fishList[i];
      if (fish.scooped) continue;
      fish.update(time, delta);
      if (fish.isOutOfTank()) {
        fish.destroy();
        this.fishList.splice(i, 1);
      }
    }

    const comboState = this.comboSystem.update(time, delta);
    this.updateComboUI(comboState, time);

    if (comboState.isBurst) {
      this.burstOverlay.clear();
      this.burstOverlay.fillStyle(0xffe066, 0.025 + Math.sin(time * 0.006) * 0.01);
      this.burstOverlay.fillRect(0, 0, w, h);
      this.burstOverlay.setAlpha(1);
    } else {
      this.burstOverlay.setAlpha(0);
    }
  }

  private showFishName(x: number, y: number, name: string): void {
    const text = this.add.text(x, y, name, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffe566',
      stroke: '#1a4a60',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 700,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  private showComboLabel(label: string): void {
    this.tweens.killTweensOf(this.labelText);
    this.labelText.setText(label);
    this.labelText.setFontSize(36);
    this.labelText.setAlpha(0.9);
    this.labelText.setScale(0.7);
    this.labelText.setPosition(this.W / 2, this.H * 0.4);

    this.tweens.add({
      targets: this.labelText,
      scale: 1,
      duration: 160,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.labelText,
          alpha: 0,
          duration: 500,
          delay: 250,
          ease: 'Power2',
        });
      },
    });
  }

  private updateComboUI(comboState: ReturnType<ComboSystem['getState']>, time: number): void {
    if (comboState.count > 0) {
      this.comboText.setText(`${comboState.count} れんぞく`);
      this.comboText.setAlpha(1);

      if (comboState.multiplier > 1) {
        this.multiplierText.setText(`×${comboState.multiplier}`);
        this.multiplierText.setAlpha(1);
        this.multiplierText.setScale(1 + Math.sin(time * 0.01) * 0.05);
      } else {
        this.multiplierText.setAlpha(0);
      }

      const elapsed = time - comboState.lastHitTime;
      this.drawComboGauge(Math.max(0, 1 - elapsed / 1500));
    } else {
      this.comboText.setAlpha(0);
      this.multiplierText.setAlpha(0);
      this.drawComboGauge(0);
    }
  }

  private endGame(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.scoreSystem.finalize();
    BgmManager.stop(this);

    this.fishList.forEach((f) => f.destroy());
    this.fishList = [];

    const resultData = {
      score: this.scoreSystem.getScore(),
      coins: this.scoreSystem.getCoins(),
      scooped: this.scoopedCount,
      scoopedByType: { ...this.scoopedByType },
      highScore: this.scoreSystem.getHighScore(),
      isNewHighScore: this.scoreSystem.isNewHighScore(),
      poiBroken: this.poi <= 0,
    };
    this.registry.set('resultData', resultData);

    this.time.delayedCall(600, () => {
      this.scene.start('ResultScene', resultData);
    });
  }
}
