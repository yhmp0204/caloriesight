// ── 食事タイプ ──
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// ── AI認識のソース ──
export type MealSource = 'barcode' | 'ai_gemini' | 'ai_claude' | 'manual';

// ── 食事記録 ──
export interface Meal {
  id?: number;
  date: string;          // YYYY-MM-DD
  mealType: MealType;
  dishName: string;
  emoji: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  source: MealSource;
  confidence: number;    // 0-1
  photoBlob?: Blob;
  createdAt: number;
}

// ── 体重記録 ──
export interface BodyRecord {
  id?: number;
  date: string;
  weight: number;
  bodyFatPct: number | null;
}

// ── 運動記録 ──
export interface Exercise {
  id?: number;
  date: string;
  activity: string;
  durationMin: number;
  mets: number;
  caloriesBurned: number;
}

// ── 生活習慣 ──
export interface HabitRecord {
  id?: number;
  date: string;
  water: number;     // ml
  sleep: number;     // hours
}

// ── ユーザープロフィール ──
export interface UserProfile {
  id?: number;
  height: number;        // cm
  age: number;
  weight: number;        // kg
  gender: 'male' | 'female';
  activityLevel: number; // 1.2-1.725
  targetWeight: number;
  targetDate: string;
}

// ── 食品データベースのアイテム ──
export interface FoodItem {
  name: string;
  cal: number;
  p: number;   // protein
  f: number;   // fat
  c: number;   // carbs
  cat: string;
  emoji: string;
}

// ── AI認識結果 ──
export interface AIRecognitionResult extends FoodItem {
  confidence: number;
}

// ── 運動種目マスタ ──
export interface ExerciseType {
  name: string;
  mets: number;
  icon: string;
}

// ── Vision APIプロバイダー ──
export type VisionProvider = 'gemini' | 'claude';

// ── Vision APIレスポンス ──
export interface VisionResponse {
  items: AIRecognitionResult[];
  provider: VisionProvider;
  rawResponse?: unknown;
}
