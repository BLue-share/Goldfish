import Phaser from 'phaser';

export function spawnSplash(scene: Phaser.Scene, x: number, y: number, success: boolean): void {
  const color = success ? 0xaaddff : 0xffffff;
  const count = success ? 10 : 5;

  for (let i = 0; i < count; i++) {
    const drop = scene.add.graphics();
    drop.fillStyle(color, 0.85);
    drop.fillCircle(0, 0, 3 + Math.random() * 4);
    drop.setPosition(x, y);
    drop.setDepth(90);

    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 140;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 40;
    const startTime = scene.time.now;
    const duration = 350 + Math.random() * 200;

    const updateFn = () => {
      const t = (scene.time.now - startTime) / duration;
      if (t >= 1) {
        drop.destroy();
        scene.events.off('update', updateFn);
        return;
      }
      drop.x = x + vx * t;
      drop.y = y + vy * t + 180 * t * t;
      drop.setAlpha(1 - t);
      drop.setScale(1 - t * 0.4);
    };

    scene.events.on('update', updateFn);
  }
}

export function spawnScoopRing(scene: Phaser.Scene, x: number, y: number, radius: number): void {
  const ring = scene.add.graphics();
  ring.setPosition(x, y);
  ring.setDepth(95);
  ring.lineStyle(3, 0xffffff, 0.9);
  ring.strokeCircle(0, 0, radius * 0.4);

  scene.tweens.add({
    targets: ring,
    alpha: 0,
    scale: 2.2,
    duration: 280,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });
}

export function spawnSparkles(scene: Phaser.Scene, x: number, y: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const spark = scene.add.graphics();
    spark.fillStyle(0xffe066, 1);
    spark.fillCircle(0, 0, 3);
    spark.setPosition(x, y);
    spark.setDepth(92);

    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 60;
    const tx = x + Math.cos(angle) * dist;
    const ty = y + Math.sin(angle) * dist - 20;

    scene.tweens.add({
      targets: spark,
      x: tx,
      y: ty,
      alpha: 0,
      scale: 0.3,
      duration: 400 + Math.random() * 200,
      ease: 'Cubic.easeOut',
      onComplete: () => spark.destroy(),
    });
  }
}
