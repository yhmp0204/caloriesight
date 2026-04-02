/**
 * AIコーチング - Claude Sonnet 4.6 で週次アドバイスを生成
 */

import type { Meal, BodyRecord, Exercise, HabitRecord, UserProfile } from '../types';
import { getClaudeKey } from './apikeys';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

interface WeeklyData {
  meals: Meal[];
  bodyRecords: BodyRecord[];
  exercises: Exercise[];
  habits: HabitRecord[];
  profile: UserProfile;
}

export async function generateWeeklyReport(data: WeeklyData): Promise<string> {
  const apiKey = getClaudeKey();
  if (!apiKey) {
    return generateOfflineReport(data);
  }

  const summary = buildWeeklySummary(data);

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `あなたは親切で知識豊富な管理栄養士です。
ユーザーの1週間の食事・運動・体重・生活習慣データを分析し、
具体的で実行可能なアドバイスを日本語で提供してください。
ポジティブな言葉を使い、改善点は優しく伝えてください。
回答は500文字以内にまとめてください。`,
        messages: [{
          role: 'user',
          content: `今週のデータを分析して、来週のアドバイスをお願いします。\n\n${summary}`,
        }],
      }),
    });

    if (!response.ok) throw new Error('API error');

    const result = await response.json();
    return result.content?.[0]?.text || generateOfflineReport(data);
  } catch {
    return generateOfflineReport(data);
  }
}

function buildWeeklySummary(data: WeeklyData): string {
  const { meals, bodyRecords, exercises, habits, profile } = data;

  const avgCal = meals.length > 0
    ? Math.round(meals.reduce((s, m) => s + m.calories, 0) / 7)
    : 0;
  const avgP = meals.length > 0
    ? Math.round(meals.reduce((s, m) => s + m.protein, 0) / 7)
    : 0;

  const totalExCal = exercises.reduce((s, e) => s + e.caloriesBurned, 0);
  const avgWater = habits.length > 0
    ? Math.round(habits.reduce((s, h) => s + h.water, 0) / habits.length)
    : 0;
  const avgSleep = habits.length > 0
    ? (habits.reduce((s, h) => s + h.sleep, 0) / habits.length).toFixed(1)
    : '0';

  const weightStart = bodyRecords[0]?.weight || profile.weight;
  const weightEnd = bodyRecords[bodyRecords.length - 1]?.weight || profile.weight;
  const weightChange = (weightEnd - weightStart).toFixed(1);

  return `【プロフィール】
身長: ${profile.height}cm / 年齢: ${profile.age}歳 / 性別: ${profile.gender === 'male' ? '男性' : '女性'}
現在体重: ${weightEnd}kg / 目標体重: ${profile.targetWeight}kg

【今週の実績】
- 平均摂取カロリー: ${avgCal} kcal/日
- 平均タンパク質: ${avgP}g/日
- 運動消費カロリー合計: ${totalExCal} kcal
- 体重変化: ${weightChange}kg
- 平均水分摂取: ${avgWater}ml/日
- 平均睡眠: ${avgSleep}時間/日
- 食事記録日数: ${new Set(meals.map(m => m.date)).size}/7日`;
}

/**
 * APIが使えない場合のオフラインレポート
 */
function generateOfflineReport(data: WeeklyData): string {
  const { meals, exercises, habits, profile } = data;

  const avgCal = meals.length > 0
    ? Math.round(meals.reduce((s, m) => s + m.calories, 0) / Math.max(1, new Set(meals.map(m => m.date)).size))
    : 0;
  const target = Math.round(
    (10 * profile.weight + 6.25 * profile.height - 5 * profile.age +
      (profile.gender === 'female' ? -161 : 5)) * (profile.activityLevel || 1.2)
  );

  const tips: string[] = [];

  if (avgCal > target * 1.1) {
    tips.push('📉 平均摂取カロリーが目標を上回っています。間食を少し控えめにしてみましょう。');
  } else if (avgCal < target * 0.8) {
    tips.push('⚠️ 摂取カロリーが低すぎる日があります。極端な制限は逆効果なので、バランスよく食べましょう。');
  } else {
    tips.push('✅ カロリー管理は概ね良好です！この調子で続けましょう。');
  }

  const recordDays = new Set(meals.map(m => m.date)).size;
  if (recordDays < 5) {
    tips.push('📝 記録が抜けている日があります。完璧でなくても、毎日の記録が大切です。');
  }

  const avgWater = habits.length > 0
    ? Math.round(habits.reduce((s, h) => s + h.water, 0) / habits.length)
    : 0;
  if (avgWater < 1500) {
    tips.push('💧 水分が不足気味です。こまめな水分補給を心がけましょう。');
  }

  return `📊 今週のまとめ\n\n${tips.join('\n\n')}\n\n来週も一緒に頑張りましょう！`;
}
