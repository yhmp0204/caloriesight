import Dexie, { type EntityTable } from 'dexie';
import type { Meal, BodyRecord, Exercise, HabitRecord, UserProfile } from '../types';

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

export { db };

// ── ヘルパー関数 ──
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
}

export async function getMealsByDate(date: string): Promise<Meal[]> {
  return db.meals.where('date').equals(date).toArray();
}

export async function getMealsInRange(from: string, to: string): Promise<Meal[]> {
  return db.meals.where('date').between(from, to, true, true).toArray();
}

export async function addMeal(meal: Omit<Meal, 'id'>): Promise<number | undefined> {
  return db.meals.add(meal as Meal);
}

export async function updateMeal(id: number, changes: Partial<Meal>): Promise<void> {
  await db.meals.update(id, changes);
}

export async function deleteMeal(id: number): Promise<void> {
  await db.meals.delete(id);
}

export async function getBodyRecordByDate(date: string): Promise<BodyRecord | undefined> {
  return db.bodyRecords.where('date').equals(date).first();
}

export async function getAllBodyRecords(): Promise<BodyRecord[]> {
  return db.bodyRecords.orderBy('date').toArray();
}

export async function deleteBodyRecord(id: number): Promise<void> {
  await db.bodyRecords.delete(id);
}

export async function upsertBodyRecord(record: Omit<BodyRecord, 'id'>): Promise<void> {
  const existing = await db.bodyRecords.where('date').equals(record.date).first();
  if (existing?.id) {
    await db.bodyRecords.update(existing.id, record);
  } else {
    await db.bodyRecords.add(record as BodyRecord);
  }
}

export async function getExercisesByDate(date: string): Promise<Exercise[]> {
  return db.exercises.where('date').equals(date).toArray();
}

export async function addExercise(exercise: Omit<Exercise, 'id'>): Promise<number | undefined> {
  return db.exercises.add(exercise as Exercise);
}

export async function getHabitByDate(date: string): Promise<HabitRecord | undefined> {
  return db.habits.where('date').equals(date).first();
}

export async function deleteHabit(id: number): Promise<void> {
  await db.habits.delete(id);
}

export async function upsertHabit(record: Omit<HabitRecord, 'id'>): Promise<void> {
  const existing = await db.habits.where('date').equals(record.date).first();
  if (existing?.id) {
    await db.habits.update(existing.id, record);
  } else {
    await db.habits.add(record as HabitRecord);
  }
}
