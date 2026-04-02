# 🍽️ CalorieSight

AI画像認識を活用したカロリー収支管理PWAアプリ

## 概要

食事の写真を撮るだけでAIがカロリーを自動推定。日々のカロリー収支を見える化し、健康的なダイエットを支援します。

## 機能

- **📸 AI食事認識** — Gemini Vision APIで写真からカロリーを自動推定
- **📊 カロリー収支ダッシュボード** — 目標に対する進捗をリアルタイム表示
- **⚖️ 体重管理** — 7日移動平均グラフで推移を可視化
- **🏃 運動記録** — METsベースで消費カロリーを自動計算
- **💧 生活習慣トラッキング** — 水分・睡眠の記録
- **🔥 ストリーク** — 連続記録日数の可視化
- **🤖 AIコーチング** — Claude Sonnet 4.6による週次アドバイス（予定）

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/your-username/caloriesight.git
cd caloriesight
```

### 2. 依存パッケージをインストール

```bash
npm install
```

### 3. 環境変数を設定

```bash
cp .env.example .env
```

`.env` ファイルを編集してAPIキーを設定してください：

```
VITE_GEMINI_API_KEY=your-gemini-api-key-here
VITE_CLAUDE_API_KEY=your-claude-api-key-here
```

**APIキーの取得先：**
- Gemini API: https://aistudio.google.com/apikey
- Claude API: https://console.anthropic.com/

> ⚠️ APIキーが未設定でもデモモードで動作します。

### 4. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで http://localhost:5173/caloriesight/ を開きます。

### 5. ビルド & デプロイ

```bash
# ビルド
npm run build

# GitHub Pagesにデプロイ
npm run deploy
```

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React + TypeScript + Vite |
| スタイリング | CSS Variables（Tailwind移行予定） |
| グラフ | Recharts |
| データ永続化 | IndexedDB（Dexie.js） |
| PWA | vite-plugin-pwa |
| AI食事認識（メイン） | Gemini 2.5 Flash Vision API |
| AI食事認識（FB） | Claude Haiku 4.5 |
| AIコーチング | Claude Sonnet 4.6 |
| バーコード | QuaggaJS / ZXing（実装予定） |
| 食品DB | OpenFoodFacts API + 内蔵日本食DB |
| ホスティング | GitHub Pages |

## プロジェクト構成

```
caloriesight/
├── public/              # 静的ファイル（アイコン等）
├── src/
│   ├── components/      # 再利用可能なUIコンポーネント
│   ├── data/
│   │   ├── db.ts        # IndexedDB定義（Dexie.js）
│   │   └── foods.ts     # 日本食データベース（60品目+）
│   ├── pages/
│   │   ├── Dashboard.tsx    # ホーム画面
│   │   ├── MealRecord.tsx   # 食事記録画面
│   │   ├── WeightTracker.tsx # 体重管理画面
│   │   ├── ExerciseTracker.tsx # 運動記録画面
│   │   ├── HabitTracker.tsx # 生活習慣画面
│   │   └── Settings.tsx     # 設定画面
│   ├── services/
│   │   ├── vision.ts    # Vision API（Gemini/Claude）
│   │   ├── barcode.ts   # OpenFoodFacts連携
│   │   ├── calories.ts  # カロリー計算ロジック
│   │   └── coaching.ts  # AIコーチング
│   ├── types/
│   │   └── index.ts     # TypeScript型定義
│   ├── utils/
│   │   └── date.ts      # 日付ユーティリティ
│   ├── App.tsx          # メインアプリケーション
│   ├── main.tsx         # エントリーポイント
│   └── index.css        # グローバルスタイル
├── .env.example         # 環境変数テンプレート
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 月額コスト

| 項目 | コスト |
|------|-------|
| Gemini API（無料枠内） | ¥0 |
| Claude API（週次コーチング） | 約¥15/月 |
| GitHub Pages | ¥0 |
| **合計** | **約¥15/月** |

## ライセンス

MIT
