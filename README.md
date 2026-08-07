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
3. Actions タブから **Deploy to GitHub Pages** を手動実行（`workflow_dispatch`）

ワークフロー: `.github/workflows/deploy.yml`

## Firebase Hosting + ランキング

Firestore にベストスコアを保存し、タイトル画面の **ランキング** から TOP 20 を表示します。

### 初回セットアップ

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
2. **Hosting** / **Firestore** / **Authentication（匿名）** を有効化
3. Web アプリを追加し、設定値を `.env` にコピー（`.env.example` 参照）
4. `.firebaserc` の `your-firebase-project-id` を実際のプロジェクト ID に変更
5. ローカルで Firestore ルールをデプロイ:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

### GitHub Actions 用 Secrets

| Secret | 内容 |
|--------|------|
| `FIREBASE_PROJECT_ID` | Firebase プロジェクト ID |
| `FIREBASE_SERVICE_ACCOUNT` | サービスアカウント JSON 全文 |
| `VITE_FIREBASE_API_KEY` | Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | authDomain |
| `VITE_FIREBASE_PROJECT_ID` | projectId |
| `VITE_FIREBASE_STORAGE_BUCKET` | storageBucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
| `VITE_FIREBASE_APP_ID` | appId |

`main` / `master` への push で `.github/workflows/firebase-deploy.yml` が Firebase Hosting へ自動デプロイします。

### ローカル開発

```bash
cp .env.example .env
# .env に Firebase 設定を記入
npm run dev
```

Firebase 未設定でもゲーム本体は動作します（ランキング機能のみ無効）。

