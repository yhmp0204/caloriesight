import type { FoodItem, ExerciseType } from '../types';

export const FOOD_DB: FoodItem[] = [
  // 主食
  {name:"白米ごはん（1膳）",cal:252,p:4,f:1,c:56,cat:"主食",emoji:"🍚"},
  // 丼物
  {name:"親子丼",cal:650,p:28,f:15,c:95,cat:"丼物",emoji:"🍚"},
  {name:"牛丼",cal:720,p:22,f:24,c:105,cat:"丼物",emoji:"🥩"},
  {name:"カレーライス",cal:750,p:18,f:22,c:110,cat:"丼物",emoji:"🍛"},
  {name:"チャーハン",cal:580,p:14,f:18,c:85,cat:"丼物",emoji:"🍳"},
  {name:"天丼",cal:700,p:18,f:20,c:110,cat:"丼物",emoji:"🍤"},
  {name:"海鮮丼",cal:520,p:30,f:8,c:80,cat:"丼物",emoji:"🐟"},
  {name:"カツ丼",cal:800,p:28,f:28,c:95,cat:"丼物",emoji:"🐷"},
  // 麺類
  {name:"ラーメン（醤油）",cal:480,p:18,f:12,c:70,cat:"麺類",emoji:"🍜"},
  {name:"ラーメン（味噌）",cal:550,p:20,f:18,c:68,cat:"麺類",emoji:"🍜"},
  {name:"ラーメン（豚骨）",cal:600,p:22,f:22,c:65,cat:"麺類",emoji:"🍜"},
  {name:"つけ麺",cal:620,p:22,f:15,c:90,cat:"麺類",emoji:"🍜"},
  {name:"焼きそば",cal:520,p:12,f:18,c:75,cat:"麺類",emoji:"🍝"},
  {name:"うどん（かけ）",cal:320,p:10,f:2,c:65,cat:"麺類",emoji:"🍲"},
  {name:"ざるそば",cal:340,p:12,f:2,c:68,cat:"麺類",emoji:"🍲"},
  {name:"パスタ（ミートソース）",cal:590,p:20,f:15,c:85,cat:"麺類",emoji:"🍝"},
  {name:"パスタ（カルボナーラ）",cal:680,p:22,f:28,c:78,cat:"麺類",emoji:"🍝"},
  // 定食
  {name:"鮭の塩焼き定食",cal:550,p:30,f:12,c:75,cat:"定食",emoji:"🐟"},
  {name:"唐揚げ定食",cal:780,p:32,f:28,c:85,cat:"定食",emoji:"🍗"},
  {name:"生姜焼き定食",cal:700,p:28,f:22,c:88,cat:"定食",emoji:"🐷"},
  {name:"ハンバーグ定食",cal:720,p:26,f:28,c:80,cat:"定食",emoji:"🍔"},
  {name:"刺身定食",cal:480,p:32,f:8,c:65,cat:"定食",emoji:"🐟"},
  {name:"トンカツ定食",cal:850,p:30,f:35,c:90,cat:"定食",emoji:"🐷"},
  {name:"焼き魚定食",cal:520,p:28,f:10,c:72,cat:"定食",emoji:"🐟"},
  // 軽食・コンビニ
  {name:"おにぎり（鮭）",cal:180,p:5,f:2,c:38,cat:"軽食",emoji:"🍙"},
  {name:"おにぎり（ツナマヨ）",cal:220,p:6,f:6,c:36,cat:"軽食",emoji:"🍙"},
  {name:"おにぎり（梅）",cal:170,p:3,f:1,c:38,cat:"軽食",emoji:"🍙"},
  {name:"サンドイッチ（ハムチーズ）",cal:350,p:14,f:12,c:42,cat:"軽食",emoji:"🥪"},
  {name:"サラダチキン",cal:120,p:24,f:2,c:1,cat:"軽食",emoji:"🍗"},
  {name:"肉まん",cal:250,p:8,f:8,c:36,cat:"軽食",emoji:"🥟"},
  {name:"カップ麺",cal:380,p:8,f:14,c:52,cat:"軽食",emoji:"🍜"},
  // 汁物
  {name:"味噌汁",cal:45,p:3,f:1,c:6,cat:"汁物",emoji:"🥣"},
  {name:"豚汁",cal:120,p:6,f:5,c:12,cat:"汁物",emoji:"🥣"},
  {name:"けんちん汁",cal:90,p:4,f:3,c:10,cat:"汁物",emoji:"🥣"},
  // サラダ・副菜
  {name:"グリーンサラダ",cal:30,p:1,f:0,c:6,cat:"サラダ",emoji:"🥗"},
  {name:"ポテトサラダ",cal:180,p:3,f:10,c:20,cat:"サラダ",emoji:"🥗"},
  {name:"冷奴",cal:80,p:7,f:4,c:3,cat:"副菜",emoji:"🧊"},
  {name:"納豆",cal:100,p:8,f:5,c:6,cat:"副菜",emoji:"🫘"},
  {name:"卵焼き",cal:150,p:10,f:10,c:3,cat:"副菜",emoji:"🍳"},
  {name:"ほうれん草のおひたし",cal:25,p:3,f:0,c:3,cat:"副菜",emoji:"🥬"},
  {name:"きんぴらごぼう",cal:80,p:1,f:3,c:12,cat:"副菜",emoji:"🥕"},
  // パン
  {name:"食パン（1枚）",cal:160,p:5,f:3,c:28,cat:"パン",emoji:"🍞"},
  {name:"クロワッサン",cal:230,p:4,f:13,c:24,cat:"パン",emoji:"🥐"},
  {name:"メロンパン",cal:380,p:6,f:12,c:62,cat:"パン",emoji:"🍈"},
  // 飲料
  {name:"コーヒー（ブラック）",cal:5,p:0,f:0,c:1,cat:"飲料",emoji:"☕"},
  {name:"カフェラテ",cal:120,p:5,f:4,c:15,cat:"飲料",emoji:"☕"},
  {name:"オレンジジュース",cal:90,p:1,f:0,c:22,cat:"飲料",emoji:"🍊"},
  {name:"プロテインシェイク",cal:150,p:25,f:2,c:8,cat:"飲料",emoji:"🥤"},
  {name:"ビール（350ml）",cal:140,p:1,f:0,c:10,cat:"飲料",emoji:"🍺"},
  {name:"牛乳（200ml）",cal:130,p:7,f:7,c:10,cat:"飲料",emoji:"🥛"},
  // おやつ・デザート
  {name:"プロテインバー",cal:200,p:20,f:8,c:18,cat:"おやつ",emoji:"🍫"},
  {name:"バナナ",cal:86,p:1,f:0,c:22,cat:"果物",emoji:"🍌"},
  {name:"りんご",cal:60,p:0,f:0,c:16,cat:"果物",emoji:"🍎"},
  {name:"みかん",cal:45,p:1,f:0,c:11,cat:"果物",emoji:"🍊"},
  {name:"ヨーグルト",cal:65,p:4,f:3,c:5,cat:"乳製品",emoji:"🥛"},
  {name:"アイスクリーム",cal:200,p:3,f:10,c:24,cat:"おやつ",emoji:"🍦"},
  {name:"チョコレート（板1/4）",cal:140,p:2,f:8,c:14,cat:"おやつ",emoji:"🍫"},
  {name:"ポテトチップス（小袋）",cal:170,p:2,f:10,c:18,cat:"おやつ",emoji:"🥔"},
  {name:"どら焼き",cal:250,p:5,f:3,c:50,cat:"おやつ",emoji:"🥮"},
  {name:"シュークリーム",cal:220,p:4,f:12,c:24,cat:"おやつ",emoji:"🧁"},
  {name:"大福",cal:230,p:4,f:0,c:52,cat:"おやつ",emoji:"🍡"},
];

export const FOOD_CATEGORIES = [...new Set(FOOD_DB.map(f => f.cat))];

export const EXERCISE_DB: ExerciseType[] = [
  { name: 'ウォーキング', mets: 3.5, icon: '🚶' },
  { name: 'ジョギング', mets: 7.0, icon: '🏃' },
  { name: 'テニス', mets: 7.3, icon: '🎾' },
  { name: 'サイクリング', mets: 6.8, icon: '🚴' },
  { name: '水泳', mets: 8.0, icon: '🏊' },
  { name: '筋トレ', mets: 5.0, icon: '🏋️' },
  { name: 'ヨガ', mets: 3.0, icon: '🧘' },
  { name: 'ストレッチ', mets: 2.5, icon: '🤸' },
  { name: 'ダンス', mets: 5.5, icon: '💃' },
  { name: '階段昇降', mets: 4.0, icon: '🪜' },
  { name: '卓球', mets: 4.0, icon: '🏓' },
  { name: 'バドミントン', mets: 5.5, icon: '🏸' },
  { name: 'サッカー', mets: 7.0, icon: '⚽' },
  { name: '野球', mets: 5.0, icon: '⚾' },
  { name: 'ゴルフ', mets: 3.5, icon: '⛳' },
  { name: 'ハイキング', mets: 6.0, icon: '🥾' },
  { name: '縄跳び', mets: 10.0, icon: '🤾' },
  { name: 'ピラティス', mets: 3.0, icon: '🧘' },
];
