import { createClient } from '@supabase/supabase-js';
import type { Meal, BodyRecord, Exercise, HabitRecord, UserProfile } from '../types';

const SUPABASE_URL = 'https://cplcxtaffhxtdqgybzvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwbGN4dGFmZmh4dGRxZ3lienZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NzAwNjQsImV4cCI6MjA5NDE0NjA2NH0.CD1tWki1FY5Au79LtM9_CfyjejnAI2l_qoTer72Zm0g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth ──
export const auth = {
  signUp: (email: string, password: string) =>
    supabase.auth.signUp({ email, password }),
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(cb),
};

// ── Meals ──
export async function remotePushMeal(userId: string, meal: Omit<Meal, 'id' | 'remoteId'>): Promise<number | null> {
  const { data, error } = await supabase.from('meals').insert({
    user_id: userId, date: meal.date, meal_type: meal.mealType,
    dish_name: meal.dishName, emoji: meal.emoji, calories: meal.calories,
    protein: meal.protein, fat: meal.fat, carbs: meal.carbs,
    source: meal.source, confidence: meal.confidence, created_at: meal.createdAt,
  }).select('id').single();
  if (error) { console.error('[Supabase] pushMeal:', error); return null; }
  return data.id;
}

export async function remoteUpdateMeal(remoteId: number, changes: Partial<Meal>): Promise<void> {
  const m: Record<string, unknown> = {};
  if (changes.date !== undefined) m.date = changes.date;
  if (changes.dishName !== undefined) m.dish_name = changes.dishName;
  if (changes.mealType !== undefined) m.meal_type = changes.mealType;
  if (changes.calories !== undefined) m.calories = changes.calories;
  if (changes.protein !== undefined) m.protein = changes.protein;
  if (changes.fat !== undefined) m.fat = changes.fat;
  if (changes.carbs !== undefined) m.carbs = changes.carbs;
  if (changes.emoji !== undefined) m.emoji = changes.emoji;
  const { error } = await supabase.from('meals').update(m).eq('id', remoteId);
  if (error) console.error('[Supabase] updateMeal:', error);
}

export async function remoteDeleteMeal(remoteId: number): Promise<void> {
  const { error } = await supabase.from('meals').delete().eq('id', remoteId);
  if (error) console.error('[Supabase] deleteMeal:', error);
}

export async function remotePullMeals(): Promise<Omit<Meal, 'id'>[]> {
  const { data, error } = await supabase.from('meals').select('*');
  if (error) { console.error('[Supabase] pullMeals:', error); return []; }
  return (data || []).map(r => ({
    remoteId: r.id, date: r.date, mealType: r.meal_type,
    dishName: r.dish_name, emoji: r.emoji, calories: r.calories,
    protein: r.protein, fat: r.fat, carbs: r.carbs,
    source: r.source, confidence: r.confidence, createdAt: r.created_at,
  }));
}

// ── Body Records ──
export async function remotePushBodyRecord(userId: string, rec: Omit<BodyRecord, 'id' | 'remoteId'>): Promise<number | null> {
  const { data, error } = await supabase.from('body_records').upsert({
    user_id: userId, date: rec.date, weight: rec.weight, body_fat_pct: rec.bodyFatPct,
  }, { onConflict: 'user_id,date' }).select('id').single();
  if (error) { console.error('[Supabase] pushBodyRecord:', error); return null; }
  return data.id;
}

export async function remoteDeleteBodyRecord(remoteId: number): Promise<void> {
  const { error } = await supabase.from('body_records').delete().eq('id', remoteId);
  if (error) console.error('[Supabase] deleteBodyRecord:', error);
}

export async function remotePullBodyRecords(): Promise<Omit<BodyRecord, 'id'>[]> {
  const { data, error } = await supabase.from('body_records').select('*');
  if (error) { console.error('[Supabase] pullBodyRecords:', error); return []; }
  return (data || []).map(r => ({
    remoteId: r.id, date: r.date, weight: r.weight, bodyFatPct: r.body_fat_pct,
  }));
}

// ── Exercises ──
export async function remotePushExercise(userId: string, ex: Omit<Exercise, 'id' | 'remoteId'>): Promise<number | null> {
  const { data, error } = await supabase.from('exercises').insert({
    user_id: userId, date: ex.date, activity: ex.activity,
    duration_min: ex.durationMin, mets: ex.mets, calories_burned: ex.caloriesBurned,
  }).select('id').single();
  if (error) { console.error('[Supabase] pushExercise:', error); return null; }
  return data.id;
}

export async function remoteUpdateExercise(remoteId: number, changes: Partial<Exercise>): Promise<void> {
  const m: Record<string, unknown> = {};
  if (changes.date !== undefined) m.date = changes.date;
  if (changes.activity !== undefined) m.activity = changes.activity;
  if (changes.durationMin !== undefined) m.duration_min = changes.durationMin;
  if (changes.mets !== undefined) m.mets = changes.mets;
  if (changes.caloriesBurned !== undefined) m.calories_burned = changes.caloriesBurned;
  const { error } = await supabase.from('exercises').update(m).eq('id', remoteId);
  if (error) console.error('[Supabase] updateExercise:', error);
}

export async function remoteDeleteExercise(remoteId: number): Promise<void> {
  const { error } = await supabase.from('exercises').delete().eq('id', remoteId);
  if (error) console.error('[Supabase] deleteExercise:', error);
}

export async function remotePullExercises(): Promise<Omit<Exercise, 'id'>[]> {
  const { data, error } = await supabase.from('exercises').select('*');
  if (error) { console.error('[Supabase] pullExercises:', error); return []; }
  return (data || []).map(r => ({
    remoteId: r.id, date: r.date, activity: r.activity,
    durationMin: r.duration_min, mets: r.mets, caloriesBurned: r.calories_burned,
  }));
}

// ── Habits ──
export async function remotePushHabit(userId: string, hab: Omit<HabitRecord, 'id' | 'remoteId'>): Promise<number | null> {
  const { data, error } = await supabase.from('habits').upsert({
    user_id: userId, date: hab.date, water: hab.water, sleep: hab.sleep,
  }, { onConflict: 'user_id,date' }).select('id').single();
  if (error) { console.error('[Supabase] pushHabit:', error); return null; }
  return data.id;
}

export async function remoteDeleteHabit(remoteId: number): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', remoteId);
  if (error) console.error('[Supabase] deleteHabit:', error);
}

export async function remotePullHabits(): Promise<Omit<HabitRecord, 'id'>[]> {
  const { data, error } = await supabase.from('habits').select('*');
  if (error) { console.error('[Supabase] pullHabits:', error); return []; }
  return (data || []).map(r => ({
    remoteId: r.id, date: r.date, water: r.water, sleep: r.sleep,
  }));
}

// ── Profile ──
export async function remotePushProfile(userId: string, p: UserProfile): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    user_id: userId, height: p.height, age: p.age, weight: p.weight,
    gender: p.gender, activity_level: p.activityLevel,
    target_weight: p.targetWeight, target_date: p.targetDate,
  }, { onConflict: 'user_id' });
  if (error) console.error('[Supabase] pushProfile:', error);
}

export async function remotePullProfile(): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
  if (error || !data) return null;
  return {
    height: data.height, age: data.age, weight: data.weight,
    gender: data.gender, activityLevel: data.activity_level,
    targetWeight: data.target_weight, targetDate: data.target_date,
  };
}
