export class ScoreSystem {
  private score: number = 0;
  private coins: number = 0;
  private xp: number = 0;
  private highScore: number = 0;

  constructor() {
    this.highScore = parseInt(localStorage.getItem('slashBurst_highScore') || '0', 10);
  }

  addScore(base: number, multiplier: number): number {
    const gained = base * multiplier;
    this.score += gained;
    return gained;
  }

  addCoins(amount: number): void {
    this.coins += amount;
  }

  addXp(amount: number): void {
    this.xp += amount;
  }

  getScore(): number {
    return this.score;
  }

  getCoins(): number {
    return this.coins;
  }

  getXp(): number {
    return this.xp;
  }

  getHighScore(): number {
    return this.highScore;
  }

  isNewHighScore(): boolean {
    return this.score > this.highScore;
  }

  finalize(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('slashBurst_highScore', this.highScore.toString());
    }
  }

  reset(): void {
    this.score = 0;
    this.coins = 0;
    this.xp = 0;
  }
}
