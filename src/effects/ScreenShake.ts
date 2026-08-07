import Phaser from 'phaser';

export function screenShake(scene: Phaser.Scene, intensity: number = 4, duration: number = 80): void {
  scene.cameras.main.shake(duration, intensity / 1000);
}

export function screenFlash(scene: Phaser.Scene, color: number = 0xffffff, duration: number = 100): void {
  scene.cameras.main.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff, false);
}
