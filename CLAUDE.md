# CLAUDE.md - CalorieSight プロジェクトコンテキスト

## プロジェクト概要

CalorieSight は AI画像認識を活用したカロリー収支管理PWAアプリ。
食事の写真を撮るだけでAIがカロリーを自動推定し、日々のカロリー収支を見える化する。

**開発者:** やまさき（前田道路㈱ 横浜営業所 勤務、事務・経理職）
**開発スキル:** Python, VBA, HTML/JS（Number Sums というPWAパズルゲームの開発経験あり）
**注意:** プログラミング専門家ではないため、わかりやすい説明を心がけること

## 設計思想・大原則

1. 「消費カロリー − 摂取カロリー」の収支管理が核
2. **8割の精度で毎日続けられること**を最優先（完璧さより継続性）
3. 週単位で帳尻が合えばOKという柔軟な設計
4. 「自分の体を自分でコントロールできている」実感を積み重ねることが目的
5. 体重比較ランキング、極端な目標設定、「失敗」表現は意図的に排除

## 技術スタック（確定済み）

| レイヤー | 技術 | 選定理由 |
|---------|------|---------|
| フロントエンド | React + TypeScript + Vite | Number Sumsの延長線で習得可能 |
| スタイリング | CSS Variables（インライン） | Tailwind移行は将来検討 |
| グラフ | Recharts | 体重推移・カロリーチャートに使用 |
| データ永続化 | IndexedDB（Dexie.js） | ローカル完結、サーバー不要 |
| PWA | vite-plugin-pwa | Service Worker自動生成 |
| ホスティング | GitHub Pages | 無料。Number Sumsと同じ運用 |

## API構成（2社のみに統一）

| 用途 | プロバイダー | モデル | 備考 |
|------|------------|--------|------|
| 食事写真認識（メイン） | Google Gemini API | Gemini 2.5 Flash | 無料枠250回/日で運用 |
| 食事写真認識（フォールバック） | Anthropic Claude API | Haiku 4.5 | Gemini障害時のみ |
| 週次AIコーチング | Anthropic Claude API | Sonnet 4.6 | 月4回程度 |
| 食品DB（バーコード&商品名検索） | OpenFoodFacts API | - | 完全無料 |
| 運動カロリー | 内蔵METsデータ | - | API不要 |

**APIキー管理:** 環境変数ではなく**アプリ内設定画面からlocalStorageに保存**する方式。
GitHub Push Protectionでブロックされた経験から、ビルド時にJSに埋め込まない設計に変更済み。

## コスト（月額約¥15〜¥50）

- Gemini無料枠内で食事認識: ¥0
- Claude API（週次コーチング）: 約¥15/月
- GitHub Pages: ¥0
- OpenFoodFacts: ¥0

## ファイル構成

```
src/
├── types/index.ts          # 全型定義（Meal, BodyRecord, Exercise, HabitRecord, UserProfile等）
├── data/
│   ├── db.ts               # Dexie.js IndexedDB定義 & ヘルパー関数
│   └── foods.ts            # 日本食DB（60品目+）& 運動METsDB（18種目）
├── services/
│   ├── apikeys.ts          # APIキー管理（localStorage）
│   ├── vision.ts           # Vision API（Gemini→Claude自動フォールバック）
│   ├── barcode.ts          # OpenFoodFacts（バーコード検索 & 商品名テキスト検索）
│   ├── calories.ts         # BMR/TDEE/目標計算（安全版&生版の2種類）
│   └── coaching.ts         # Claude Sonnet 週次AIコーチング
├── utils/
│   └── date.ts             # 日付ユーティリティ
├── pages/
│   ├── Dashboard.tsx        # ホーム（カロリーリング、PFC、週間チャート、ストリーク）
│   ├── MealRecord.tsx       # 食事記録（AI認識、DB検索、API商品検索、手入力の4モード）
│   ├── WeightTracker.tsx    # 体重管理（7日移動平均グラフ）
│   ├── ExerciseTracker.tsx  # 運動記録（METsベース）
│   ├── HabitTracker.tsx     # 水分・睡眠トラッキング、ストリーク
│   └── Settings.tsx         # プロフィール、目標（2種類の目標カロリー表示）、APIキー設定
├── App.tsx                  # メインシェル（タブナビゲーション）
├── main.tsx                 # エントリーポイント
└── index.css                # グローバルCSS（CSS Variables定義）
```

## 実装済み機能

- [x] プロフィール設定（身長・体重・年齢・性別・活動レベル）
- [x] 目標設定（目標体重・期限）
- [x] BMR / TDEE / 目標摂取カロリー自動計算
- [x] 目標カロリー2種類表示（期限通り vs 健康セーフ）
- [x] 安全性判定（safe / caution / danger）
- [x] カロリー収支ダッシュボード（プログレスリング、週間棒グラフ）
- [x] PFCバランスドーナツチャート
- [x] 食事記録 - AI写真認識（Gemini Vision、デモモード付き）
- [x] 食事記録 - 内蔵日本食DB検索（60品目+、カテゴリフィルター）
- [x] 食事記録 - OpenFoodFacts 商品名API検索
- [x] 食事記録 - 手入力（料理名+カロリー+PFC任意）
- [x] 食事記録 - 量の調整スライダー（50%〜200%）
- [x] 体重記録 & 7日移動平均グラフ
- [x] 運動記録（18種目、METsベース消費カロリー計算）
- [x] 水分摂取トラッキング（ワンタップ追加）
- [x] 睡眠時間トラッキング
- [x] 連続記録ストリーク表示
- [x] 週間サマリー（習慣タブ）
- [x] APIキーをアプリ内設定から入力（localStorage保存）
- [x] PWA対応（オフラインキャッシュ、ホーム画面追加）
- [x] GitHub Pagesデプロイ済み（https://yhmp0204.github.io/caloriesight/）

## 未実装・今後のTODO

- [ ] バーコードスキャン（QuaggaJS / ZXing）- UIボタンはあるがComing Soon状態
- [ ] 週次AIコーチング画面（coaching.ts は実装済みだがUIページ未作成）
- [ ] プッシュ通知（食事記録リマインダー）
- [ ] データエクスポート（CSV）
- [ ] 食事記録の編集・削除機能
- [ ] 体重記録の削除機能
- [ ] Supabase移行（クラウド同期・マルチデバイス）
- [ ] Tailwind CSS移行
- [ ] コード分割（chunkが500KB超過の警告あり）

## ビルド & デプロイ

```bash
# 開発
npm run dev

# ビルド（TypeScriptチェック + Viteビルド + PWA生成）
npm run build

# GitHub Pagesデプロイ
npm run deploy

# Windows環境ではrollupモジュールの追加が必要
npm install @rollup/rollup-win32-x64-msvc
```

## デプロイ先

- リポジトリ: https://github.com/yhmp0204/caloriesight
- 公開URL: https://yhmp0204.github.io/caloriesight/
- base path: `/caloriesight/`（vite.config.tsで設定済み）

## カロリー計算ロジック

- **BMR:** Mifflin-St Jeor式（10×体重 + 6.25×身長 - 5×年齢 ± 性別補正）
- **TDEE:** BMR × 活動レベル係数（1.2〜1.725）
- **目標摂取（安全版）:** TDEE - min(500, 必要赤字/日) ← ダッシュボードで使用
- **目標摂取（生版）:** TDEE - 必要赤字/日 ← 設定画面で参考表示
- **運動消費:** METs × 体重(kg) × 時間(h)
- 1kg減量 = 7,700kcal の累積赤字

## UI/UXの注意点

- ダークテーマ（--bg: #0F1117）ベース
- モバイルファーストのレイアウト
- タブバーは画面下固定（スマホの親指で届く位置）
- iPhoneノッチ対応（viewport-fit=cover, safe-area-inset）
- 色の使い分け: 摂取=warn(黄)、消費=ok(緑)、残り=pri(青)、P=青、F=黄、C=緑

## 重要な設計判断の経緯

1. **PWA選択理由:** Number Sumsの経験を活かせる。ネイティブアプリ化は将来検討
2. **Gemini選択理由:** 無料枠が太い（250回/日）、日本食の認識精度が期待できる
3. **フォールバックをClaude Haikuにした理由:** APIプロバイダーを2社に統一（GPT-4o miniだと3社管理になる）
4. **APIキーをlocalStorage方式にした理由:** .env方式だとビルド時にJSに埋め込まれ、GitHub Push Protectionにブロックされた
5. **目標カロリー2種類表示:** ユーザーからの要望。「期限通り（無制限）」と「健康セーフ（-500kcal上限）」を並べて比較できるように
