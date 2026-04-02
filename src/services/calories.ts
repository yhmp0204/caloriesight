import type { UserProfile } from '../types';

/**
 * 基礎代謝量 (BMR) - Mifflin-St Jeor式
 */
export function calcBMR(p: UserProfile): number {
  if (!p.weight || !p.height || !p.age) return 0;
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  return Math.round(p.gender === 'female' ? base - 161 : base + 5);
}

/**
 * 総消費カロリー (TDEE)
 */
export function calcTDEE(p: UserProfile): number {
  return Math.round(calcBMR(p) * (p.activityLevel || 1.2));
}

/**
 * 日々の目標摂取カロリー
 * 目標体重と期限から自動計算（1日の赤字上限500kcal）
 */
export function calcDailyTarget(p: UserProfile): number {
  if (!p.targetWeight || !p.targetDate || !p.weight) return calcTDEE(p);

  const daysLeft = Math.max(1, (new Date(p.targetDate).getTime() - Date.now()) / 86400000);
  const kgToLose = p.weight - p.targetWeight;

  if (kgToLose <= 0) return calcTDEE(p); // 増量目標の場合はTDEEそのまま

  // 1kg = 7,700kcal の赤字が必要。1日の赤字上限は500kcal（安全ガード）
  const dailyDeficit = Math.min(500, (kgToLose * 7700) / daysLeft);
  return Math.round(calcTDEE(p) - dailyDeficit);
}

/**
 * 運動消費カロリー (METs)
 * 消費kcal = METs × 体重(kg) × 時間(h)
 */
export function calcExerciseCalories(
  mets: number,
  weightKg: number,
  durationMin: number
): number {
  return Math.round(mets * weightKg * (durationMin / 60));
}

/**
 * 目標到達日の推定
 */
export function estimateTargetDate(p: UserProfile, dailyDeficit: number): Date | null {
  if (!p.targetWeight || !p.weight || dailyDeficit <= 0) return null;
  const kgToLose = p.weight - p.targetWeight;
  if (kgToLose <= 0) return null;
  const daysNeeded = (kgToLose * 7700) / dailyDeficit;
  const target = new Date();
  target.setDate(target.getDate() + Math.ceil(daysNeeded));
  return target;
}
