import Phaser from 'phaser';

export type BgmKey = 'bgm_title' | 'bgm_game';

/**
 * シーン横断で BGM を切り替える薄いラッパー。
 * ブラウザの自動再生ロック解除を待ってから再生する。
 */
export class BgmManager {
  private static currentKey: BgmKey | null = null;
  private static pending: { key: BgmKey; volume: number } | null = null;

  static play(scene: Phaser.Scene, key: BgmKey, volume = 0.35): void {
    const sound = scene.sound;

    if (!scene.cache.audio.exists(key)) {
      console.warn(`[BgmManager] audio not loaded: ${key}`);
      return;
    }

    if (this.currentKey === key) {
      const existing = sound.get(key);
      if (existing?.isPlaying) return;
    }

    const start = () => {
      sound.stopAll();
      this.currentKey = key;
      this.pending = null;
      sound.play(key, { loop: true, volume });
    };

    if (sound.locked) {
      this.pending = { key, volume };
      // 解除後に1回だけ再生
      sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        if (this.pending) {
          const p = this.pending;
          this.pending = null;
          sound.stopAll();
          this.currentKey = p.key;
          sound.play(p.key, { loop: true, volume: p.volume });
        }
      });
      sound.unlock();
      return;
    }

    start();
  }

  static stop(scene: Phaser.Scene): void {
    this.pending = null;
    scene.sound.stopAll();
    this.currentKey = null;
  }
}
