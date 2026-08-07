import Phaser from 'phaser';

/** 1位が最高得点。順位どおりに score を設定 */
export type GoldfishType =
  | 'sarasa_wakin'      // 1 更紗和金
  | 'wakin'             // 2 和金
  | 'comet'             // 3 コメット
  | 'ryukin'            // 4 琉金
  | 'shubunkin'         // 5 朱文金
  | 'calico_ryukin'     // 6 キャリコ琉金
  | 'bristol_shubunkin' // 7 ブリストル朱文金
  | 'azumanishiki'      // 8 東錦
  | 'tancho'            // 9 丹頂
  | 'demekin';          // 10 出目金

export interface GoldfishConfig {
  type: GoldfishType;
  name: string;
  rank: number;
  size: number;
  displayScale: number;
  score: number;
  coinReward: number;
  speed: number;
  hitRadius: number;
}

export const GOLDFISH_DATA: Record<GoldfishType, GoldfishConfig> = {
  sarasa_wakin: {
    type: 'sarasa_wakin',
    name: '更紗和金',
    rank: 1,
    size: 24,
    displayScale: 0.42,
    score: 100,
    coinReward: 12,
    speed: 75,
    hitRadius: 46,
  },
  wakin: {
    type: 'wakin',
    name: '和金',
    rank: 2,
    size: 22,
    displayScale: 0.4,
    score: 85,
    coinReward: 10,
    speed: 80,
    hitRadius: 48,
  },
  comet: {
    type: 'comet',
    name: 'コメット',
    rank: 3,
    size: 20,
    displayScale: 0.4,
    score: 70,
    coinReward: 8,
    speed: 130,
    hitRadius: 44,
  },
  ryukin: {
    type: 'ryukin',
    name: '琉金',
    rank: 4,
    size: 26,
    displayScale: 0.44,
    score: 55,
    coinReward: 7,
    speed: 55,
    hitRadius: 52,
  },
  shubunkin: {
    type: 'shubunkin',
    name: '朱文金',
    rank: 5,
    size: 22,
    displayScale: 0.4,
    score: 45,
    coinReward: 6,
    speed: 85,
    hitRadius: 48,
  },
  calico_ryukin: {
    type: 'calico_ryukin',
    name: 'キャリコ琉金',
    rank: 6,
    size: 25,
    displayScale: 0.44,
    score: 35,
    coinReward: 5,
    speed: 58,
    hitRadius: 50,
  },
  bristol_shubunkin: {
    type: 'bristol_shubunkin',
    name: 'ブリストル朱文金',
    rank: 7,
    size: 23,
    displayScale: 0.42,
    score: 28,
    coinReward: 4,
    speed: 90,
    hitRadius: 48,
  },
  azumanishiki: {
    type: 'azumanishiki',
    name: '東錦',
    rank: 8,
    size: 24,
    displayScale: 0.42,
    score: 20,
    coinReward: 3,
    speed: 60,
    hitRadius: 50,
  },
  tancho: {
    type: 'tancho',
    name: '丹頂',
    rank: 9,
    size: 23,
    displayScale: 0.42,
    score: 14,
    coinReward: 2,
    speed: 65,
    hitRadius: 48,
  },
  demekin: {
    type: 'demekin',
    name: '出目金',
    rank: 10,
    size: 22,
    displayScale: 0.42,
    score: 8,
    coinReward: 1,
    speed: 50,
    hitRadius: 52,
  },
};

/** 出現重み（高得点ほど稀） */
export const GOLDFISH_SPAWN_WEIGHT: Record<GoldfishType, number> = {
  sarasa_wakin: 3,
  wakin: 6,
  comet: 9,
  ryukin: 12,
  shubunkin: 14,
  calico_ryukin: 12,
  bristol_shubunkin: 11,
  azumanishiki: 10,
  tancho: 12,
  demekin: 18,
};

export class Goldfish extends Phaser.GameObjects.Container {
  public config: GoldfishConfig;
  public scooped = false;

  private sprite: Phaser.GameObjects.Image;
  private vx: number;
  private phase: number;
  private facing: number;
  private baseScale: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: GoldfishConfig) {
    super(scene, x, y);
    this.config = config;
    this.phase = Math.random() * Math.PI * 2;
    this.facing = Math.random() < 0.5 ? 1 : -1;
    this.vx = config.speed * this.facing * (0.85 + Math.random() * 0.3);
    this.baseScale = config.displayScale;

    this.sprite = scene.add.image(0, 0, config.type);
    this.sprite.setOrigin(0.5);
    this.add(this.sprite);
    this.applyFacing();
    this.setDepth(50);

    scene.add.existing(this);
  }

  private applyFacing(): void {
    // 画像は右向き前提。左向きは反転。
    this.sprite.setScale(this.baseScale * this.facing, this.baseScale);
  }

  setSwimDirection(dir: 1 | -1): void {
    this.facing = dir;
    this.vx = Math.abs(this.vx) * dir;
    this.applyFacing();
  }

  containsPoint(worldX: number, worldY: number): boolean {
    const dx = worldX - this.x;
    const dy = worldY - this.y;
    return dx * dx + dy * dy <= this.config.hitRadius * this.config.hitRadius;
  }

  update(time: number, delta: number): void {
    const dt = delta / 1000;
    const maxX = this.scene.scale.width - 40;

    this.x += this.vx * dt;
    this.y += Math.sin(time * 0.003 + this.phase) * 28 * dt;

    if (this.x < 40) {
      this.x = 40;
      this.vx = Math.abs(this.vx);
      this.facing = 1;
      this.applyFacing();
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = -Math.abs(this.vx);
      this.facing = -1;
      this.applyFacing();
    }

    this.rotation = Math.sin(time * 0.008 + this.phase) * 0.12;
    const wiggle = 1 + Math.sin(time * 0.01 + this.phase) * 0.04;
    this.sprite.setScale(this.baseScale * this.facing, this.baseScale * wiggle);
  }

  isOutOfTank(): boolean {
    return this.y < -60 || this.y > this.scene.scale.height + 60;
  }
}
