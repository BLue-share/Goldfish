import { GoldfishConfig, GOLDFISH_DATA, GOLDFISH_SPAWN_WEIGHT, GoldfishType } from '../entities/Goldfish';

const ALL_TYPES = Object.keys(GOLDFISH_DATA) as GoldfishType[];

export class SpawnSystem {
  private waveTimer = 0;
  private waveDuration = 6000;
  private waveNumber = 0;
  private spawnTimer = 0;
  private spawnInterval = 1100;

  update(delta: number): GoldfishConfig[] | null {
    this.spawnTimer += delta;
    this.waveTimer += delta;

    if (this.waveTimer >= this.waveDuration) {
      this.waveTimer = 0;
      this.waveNumber++;
      this.adjustDifficulty();
    }

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      return this.generateSpawnGroup();
    }

    return null;
  }

  private adjustDifficulty(): void {
    this.spawnInterval = Math.max(450, 1100 - this.waveNumber * 70);
  }

  private generateSpawnGroup(): GoldfishConfig[] {
    const fish: GoldfishConfig[] = [];
    const count = Math.min(4, 1 + Math.floor(this.waveNumber / 2) + (Math.random() < 0.4 ? 1 : 0));
    const n = Math.max(1, Math.min(4, count));

    for (let i = 0; i < n; i++) {
      fish.push(this.pickFish());
    }

    return fish;
  }

  private pickFish(): GoldfishConfig {
    // 高得点ほど稀。波が進むと上位種の出現が少し増える
    const rareBoost = Math.min(this.waveNumber * 0.4, 4);
    let total = 0;
    const weights: { type: GoldfishType; w: number }[] = [];

    for (const type of ALL_TYPES) {
      const base = GOLDFISH_SPAWN_WEIGHT[type];
      const rank = GOLDFISH_DATA[type].rank;
      // rank が小さい（上位）ほど rareBoost で増えやすい
      const w = base + (rank <= 3 ? rareBoost : rank <= 6 ? rareBoost * 0.4 : 0);
      weights.push({ type, w });
      total += w;
    }

    let roll = Math.random() * total;
    for (const { type, w } of weights) {
      roll -= w;
      if (roll <= 0) {
        return { ...GOLDFISH_DATA[type] };
      }
    }

    return { ...GOLDFISH_DATA.demekin };
  }

  reset(): void {
    this.waveTimer = 0;
    this.waveNumber = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1100;
  }
}
