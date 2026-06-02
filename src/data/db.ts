import Dexie, { type EntityTable } from 'dexie';
import type { Meal, BodyRecord, Exercise, HabitRecord, UserProfile } from '../types';
import {
  remotePushMeal, remoteUpdateMeal, remoteDeleteMeal, remotePullMeals,
  remotePushBodyRecord, remoteDeleteBodyRecord, remotePullBodyRecords,
  remotePushExercise, remoteUpdateExercise, remoteDeleteExercise, remotePullExercises,
  remotePushHabit, remoteDeleteHabit, remotePullHabits,
  remotePushProfile, remotePullProfile,
} from '../services/supabase';

// ── CalorieSight データベース定義 ──
const db = new Dexie('CalorieSightDB') as Dexie & {
  meals: EntityTable<Meal, 'id'>;
  bodyRecords: EntityTable<BodyRecord, 'id'>;
  exercises: EntityTable<Exercise, 'id'>;
  habits: EntityTable<HabitRecord, 'id'>;
  profile: EntityTable<UserProfile, 'id'>;
};

db.version(1).stores({
  meals: '++id, date, mealType, createdAt',
  bodyRecords: '++id, &date',
  exercises: '++id, date',
  habits: '++id, &date',
  profile: '++id',
});

db.version(2).stores({
  meals: '++id, date, mealType, createdAt, remoteId',
  bodyRecords: '++id, &date, remoteId',
  exercises: '++id, date, remoteId',
  habits: '++id, &date, remoteId',
  profile: '++id',
});

export { db };

// ── クラウド同期状態 ──
let _syncUserId: string | null = null;
export function enableCloudSync(userId: string) { _syncUserId = userId; }
export function disableCloudSync() { _syncUserId = null; }

// ── Profile ──
export async function getProfile(): Promise<UserProfile | undefined> {
  return db.profile.toCollection().first();
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const existing = await db.profile.toCollection().first();
  if (existing?.id) {
    await db.profile.update(existing.id, profile);
  } else {
    await db.profile.add(profile);
  }
  if (_syncUserId) {
    remotePushProfile(_syncUserId, profile).catch(console.error);
  }
}

// ── Meals ──
export async function getMealsByDate(date: string): Promise<Meal[]> {
  return db.meals.where('date').equals(date).toArray();
}

export async function getMealsInRange(from: string, to: string): Promise<Meal[]> {
  return db.meals.where('date').between(from, to, true, true).toArray();
}

export async function addMeal(meal: Omit<Meal, 'id'>): Promise<number | undefined> {
  const id = await db.meals.add(meal as Meal);
  if (_syncUserId && id) {
    remotePushMeal(_syncUserId, meal).then(remoteId => {
      if (remoteId) db.meals.update(id, { remoteId });
    }).catch(console.error);
  }
  return id;
}

export async function updateMeal(id: number, changes: Partial<Meal>): Promise<void> {
  await db.meals.update(id, changes);
  if (_syncUserId) {
    const meal = await db.meals.get(id);
    if (meal?.remoteId) {
      remoteUpdateMeal(meal.remoteId, changes).catch(console.error);
    }
  }
}

export async function deleteMeal(id: number): Promise<void> {
  if (_syncUserId) {
    const meal = await db.meals.get(id);
    if (meal?.remoteId) {
      remoteDeleteMeal(meal.remoteId).catch(console.error);
    }
  }
  await db.meals.delete(id);
}

// ── Body Records ──
export async function getBodyRecordByDate(date: string): Promise<BodyRecord | undefined> {
  return db.bodyRecords.where('date').equals(date).first();
}

export async function getAllBodyRecords(): Promise<BodyRecord[]> {
  return db.bodyRecords.orderBy('date').toArray();
}

export async function deleteBodyRecord(id: number): Promise<void> {
  if (_syncUserId) {
    const rec = await db.bodyRecords.get(id);
    if (rec?.remoteId) {
      remoteDeleteBodyRecord(rec.remoteId).catch(console.error);
    }
  }
  await db.bodyRecords.delete(id);
}

export async function upsertBodyRecord(record: Omit<BodyRecord, 'id'>): Promise<void> {
  const existing = await db.bodyRecords.where('date').equals(record.date).first();
  if (existing?.id) {
    await db.bodyRecords.update(existing.id, record);
  } else {
    await db.bodyRecords.add(record as BodyRecord);
  }
  if (_syncUserId) {
    remotePushBodyRecord(_syncUserId, record).then(remoteId => {
      if (remoteId) {
        db.bodyRecords.where('date').equals(record.date).first().then(local => {
          if (local?.id) db.bodyRecords.update(local.id, { remoteId });
        });
      }
    }).catch(console.error);
  }
}

// ── Exercises ──
export async function getExercisesByDate(date: string): Promise<Exercise[]> {
  return db.exercises.where('date').equals(date).toArray();
}

export async function addExercise(exercise: Omit<Exercise, 'id'>): Promise<number | undefined> {
  const id = await db.exercises.add(exercise as Exercise);
  if (_syncUserId && id) {
    remotePushExercise(_syncUserId, exercise).then(remoteId => {
      if (remoteId) db.exercises.update(id, { remoteId });
    }).catch(console.error);
  }
  return id;
}

export async function updateExercise(id: number, changes: Partial<Exercise>): Promise<void> {
  await db.exercises.update(id, changes);
  if (_syncUserId) {
    const ex = await db.exercises.get(id);
    if (ex?.remoteId) {
      remoteUpdateExercise(ex.remoteId, changes).catch(console.error);
    }
  }
}

export async function deleteExercise(id: number): Promise<void> {
  if (_syncUserId) {
    const ex = await db.exercises.get(id);
    if (ex?.remoteId) {
      remoteDeleteExercise(ex.remoteId).catch(console.error);
    }
  }
  await db.exercises.delete(id);
}

// ── Habits ──
export async function getHabitByDate(date: string): Promise<HabitRecord | undefined> {
  return db.habits.where('date').equals(date).first();
}

export async function deleteHabit(id: number): Promise<void> {
  if (_syncUserId) {
    const hab = await db.habits.get(id);
    if (hab?.remoteId) {
      remoteDeleteHabit(hab.remoteId).catch(console.error);
    }
  }
  await db.habits.delete(id);
}

export async function upsertHabit(record: Omit<HabitRecord, 'id'>): Promise<void> {
  const existing = await db.habits.where('date').equals(record.date).first();
  if (existing?.id) {
    await db.habits.update(existing.id, record);
  } else {
    await db.habits.add(record as HabitRecord);
  }
  if (_syncUserId) {
    remotePushHabit(_syncUserId, record).then(remoteId => {
      if (remoteId) {
        db.habits.where('date').equals(record.date).first().then(local => {
          if (local?.id) db.habits.update(local.id, { remoteId });
        });
      }
    }).catch(console.error);
  }
}

// ── クラウド同期 ──
export async function syncFromCloud(): Promise<void> {
  if (!_syncUserId) return;

  // 1. 未同期のローカルレコードをプッシュ
  const unsyncedMeals = await db.meals.filter(m => !m.remoteId).toArray();
  for (const m of unsyncedMeals) {
    const rid = await remotePushMeal(_syncUserId!, m);
    if (rid && m.id) await db.meals.update(m.id, { remoteId: rid });
  }

  const unsyncedBody = await db.bodyRecords.filter(r => !r.remoteId).toArray();
  for (const r of unsyncedBody) {
    const rid = await remotePushBodyRecord(_syncUserId!, r);
    if (rid && r.id) await db.bodyRecords.update(r.id, { remoteId: rid });
  }

  const unsyncedEx = await db.exercises.filter(e => !e.remoteId).toArray();
  for (const e of unsyncedEx) {
    const rid = await remotePushExercise(_syncUserId!, e);
    if (rid && e.id) await db.exercises.update(e.id, { remoteId: rid });
  }

  const unsyncedHab = await db.habits.filter(h => !h.remoteId).toArray();
  for (const h of unsyncedHab) {
    const rid = await remotePushHabit(_syncUserId!, h);
    if (rid && h.id) await db.habits.update(h.id, { remoteId: rid });
  }

  // プロフィールもプッシュ
  const localProfile = await db.profile.toCollection().first();
  if (localProfile) {
    await remotePushProfile(_syncUserId!, localProfile);
  }

  // 2. クラウドから全データ取得
  const [remoteMeals, remoteBody, remoteEx, remoteHab, remoteProfile] = await Promise.all([
    remotePullMeals(), remotePullBodyRecords(), remotePullExercises(),
    remotePullHabits(), remotePullProfile(),
  ]);

  // 3. ローカルをクラウドのデータで置換
  await db.meals.clear();
  for (const m of remoteMeals) await db.meals.add(m as Meal);

  await db.bodyRecords.clear();
  for (const r of remoteBody) await db.bodyRecords.add(r as BodyRecord);

  await db.exercises.clear();
  for (const e of remoteEx) await db.exercises.add(e as Exercise);

  await db.habits.clear();
  for (const h of remoteHab) await db.habits.add(h as HabitRecord);

  if (remoteProfile) {
    await db.profile.clear();
    await db.profile.add(remoteProfile);
  }
}
