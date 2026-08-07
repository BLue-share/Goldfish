# 金魚すくい

タップで金魚をすくう、お祭り風カジュアルゲーム。

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで表示された URL を開く。

## ビルド

```bash
npm run build
```

## 遊び方

- **タップ**: 金魚をすくう
- **空振り**: ポイの耐久が減る（5回で破れ）
- 連続成功で倍率アップ（うまい！→上手い！→名人！→神業！）
- 20連続で「大ポイ」：すくい範囲拡大＆空振りしても破れない（5秒）
- 赤金魚 / 黒金魚（速い） / 出目金（レア・高得点）

## 金魚の得点（高い順）

| 順位 | 種類 | 得点 |
|------|------|------|
| 1 | 更紗和金 | 100 |
| 2 | 和金 | 85 |
| 3 | コメット | 70 |
| 4 | 琉金 | 55 |
| 5 | 朱文金 | 45 |
| 6 | キャリコ琉金 | 35 |
| 7 | ブリストル朱文金 | 28 |
| 8 | 東錦 | 20 |
| 9 | 丹頂 | 14 |
| 10 | 出目金 | 8 |

高得点の種類ほど出現率が低いです。

金魚スプライト画像は `public/assets/sprites/` にあります。

## BGM
BGM: VSQ plus+
配置先（Viteが配信するのはこちら）:

- タイトル: `public/assets/audio/bgm_title.mp3`
- ゲーム: `public/assets/audio/bgm_game.mp3`

`src/scenes/BootScene.ts` の `load.audio` 拡張子と一致させてください。  
差し替え後はブラウザをハードリロード（Ctrl+Shift+R）してください。

## 技術スタック

- Phaser 3
- TypeScript
- Vite

## GitHub Pages 公開

公開 URL: `https://<GitHubユーザー名>.github.io/Goldfish/`

1. このリポジトリを GitHub の `Goldfish` に push
2. **Settings → Pages → Source** を **GitHub Actions** にする
3. `main`（または `master`）への push で自動デプロイ

ワークフロー: `.github/workflows/deploy.yml`

