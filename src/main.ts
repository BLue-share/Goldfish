import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { ScoreTableScene } from './scenes/ScoreTableScene';
import { getGameSize } from './utils/layout';

const initialSize = getGameSize();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: initialSize.width,
  height: initialSize.height,
  parent: 'game-container',
  backgroundColor: '#1a6a8a',
  scene: [BootScene, TitleScene, GameScene, ResultScene, ScoreTableScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  input: {
    activePointers: 3,
    windowEvents: true,
  },
  scale: {
    // 論理解像度を画面比に合わせるため、FITでも画面いっぱいに表示される
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: initialSize.width,
    height: initialSize.height,
    expandParent: true,
    autoRound: true,
  },
  audio: {
    disableWebAudio: false,
  },
  banner: false,
};

const game = new Phaser.Game(config);

let lastPortrait = initialSize.height > initialSize.width;
let lastAspect = initialSize.width / initialSize.height;

const applySize = () => {
  const size = getGameSize();
  const portrait = size.height > size.width;
  const aspect = size.width / size.height;
  const orientationChanged = portrait !== lastPortrait;
  const aspectChanged = Math.abs(aspect - lastAspect) > 0.04;
  const sizeChanged =
    Math.abs(game.scale.width - size.width) > 8 ||
    Math.abs(game.scale.height - size.height) > 8;

  if (orientationChanged || aspectChanged || sizeChanged) {
    lastPortrait = portrait;
    lastAspect = aspect;
    game.scale.resize(size.width, size.height);

    const active = game.scene.getScenes(true)[0];
    if (active) {
      const key = active.scene.key;
      if (key === 'BootScene') {
        game.scale.refresh();
        return;
      }
      const data = key === 'ResultScene' ? game.registry.get('resultData') : undefined;
      // 向き・画面比が大きく変わったときだけシーン再構築
      if (orientationChanged || aspectChanged) {
        game.scene.stop(key);
        game.scene.start(key, data);
      }
    }
  }

  game.scale.refresh();
};

window.addEventListener('resize', applySize);
window.addEventListener('orientationchange', () => {
  window.setTimeout(applySize, 150);
  window.setTimeout(applySize, 400);
});

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', applySize);
}

document.addEventListener(
  'touchmove',
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);

document.addEventListener('gesturestart', (e) => e.preventDefault());
