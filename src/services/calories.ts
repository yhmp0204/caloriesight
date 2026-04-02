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
 * 目標期限に間に合わせるための目標摂取カロリー（制限なし）
 * ※現実的でない値になることがある
 */
export function calcRawDailyTarget(p: UserProfile): number {
  if (!p.targetWeight || !p.targetDate || !p.weight) return calcTDEE(p);
  const daysLeft = Math.max(1, (new Date(p.targetDate).getTime() - Date.now()) / 86400000);
  const kgToLose = p.weight - p.targetWeight;
  if (kgToLose <= 0) return calcTDEE(p);
  const dailyDeficit = (kgToLose * 7700) / daysLeft;
  return Math.round(calcTDEE(p) - dailyDeficit);
}

/**
 * 健康セーフの目標摂取カロリー（1日の赤字上限500kcal）
 * ダッシュボードの日常管理にはこちらを使用
 */
export function calcDailyTarget(p: UserProfile): number {
  if (!p.targetWeight || !p.targetDate || !p.weight) return calcTDEE(p);
  const daysLeft = Math.max(1, (new Date(p.targetDate).getTime() - Date.now()) / 86400000);
  const kgToLose = p.weight - p.targetWeight;
  if (kgToLose <= 0) return calcTDEE(p);
  const dailyDeficit = Math.min(500, (kgToLose * 7700) / daysLeft);
  return Math.round(calcTDEE(p) - dailyDeficit);
}

/**
 * 健康ペース（-500kcal/日）で減量した場合の推定到達日
 */
export function calcSafeEstimatedDate(p: UserProfile): string | null {
  if (!p.targetWeight || !p.weight) return null;
  const kgToLose = p.weight - p.targetWeight;
  if (kgToLose <= 0) return null;
  const daysNeeded = (kgToLose * 7700) / 500;
  const target = new Date();
  target.setDate(target.getDate() + Math.ceil(daysNeeded));
  return target.toISOString().slice(0, 10);
}

/**
 * 目標設定の危険度判定
 */
export function assessGoalSafety(p: UserProfile): {
  level: 'safe' | 'caution' | 'danger';
  message: string;
  weeklyLoss: number;
} {
  if (!p.targetWeight || !p.targetDate || !p.weight) {
    return { level: 'safe', message: '', weeklyLoss: 0 };
  }
  const daysLeft = Math.max(1, (new Date(p.targetDate).getTime() - Date.now()) / 86400000);
  const kgToLose = p.weight - p.targetWeight;
  if (kgToLose <= 0) return { level: 'safe', message: '', weeklyLoss: 0 };

  const weeklyLoss = (kgToLose / daysLeft) * 7;
  const rawTarget = calcRawDailyTarget(p);
  const bmr = calcBMR(p);

  if (rawTarget < bmr || weeklyLoss > 1.0) {
    return {
      level: 'danger',
      message: `週${weeklyLoss.toFixed(1)}kgペースは体に負担がかかります。期限の延長をおすすめします。`,
      weeklyLoss,
    };
  }
  if (weeklyLoss > 0.5) {
    return {
      level: 'caution',
      message: `週${weeklyLoss.toFixed(1)}kgペースはやや速めです。体調を見ながら進めましょう。`,
      weeklyLoss,
    };
  }
  return {
    level: 'safe',
    message: `週${weeklyLoss.toFixed(1)}kgペースは健康的な範囲です。`,
    weeklyLoss,
  };
}

/**
 * 運動消費カロリー (METs)
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
