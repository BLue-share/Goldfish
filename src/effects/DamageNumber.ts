import Phaser from 'phaser';

export function showDamageNumber(
  scene: Phaser.Scene,
  x: number,
  y: number,
  damage: number,
  isCritical: boolean
): void {
  const fontSize = isCritical ? 30 : Math.min(22 + Math.floor(damage / 40), 28);
  const color = isCritical ? '#ffe566' : '#ffffff';
  const strokeColor = isCritical ? '#aa6600' : '#000000';

  const text = scene.add.text(x, y, damage.toString(), {
    fontFamily: 'Arial Black, Arial',
    fontSize: `${fontSize}px`,
    color,
    stroke: strokeColor,
    strokeThickness: isCritical ? 4 : 3,
    fontStyle: 'bold',
  });
  text.setOrigin(0.5);
  text.setDepth(100);

  text.setScale(0);
  scene.tweens.add({
    targets: text,
    scale: { from: 0, to: isCritical ? 1.25 : 1.15 },
    duration: 90,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: text,
        scale: 1,
        y: y - 48,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => text.destroy(),
      });
    },
  });
}
