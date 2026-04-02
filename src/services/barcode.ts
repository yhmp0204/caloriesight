/**
 * OpenFoodFacts API を使ったバーコード商品検索
 * 完全無料・オープンソースの食品データベース
 */

import type { FoodItem } from '../types';

const API_BASE = 'https://world.openfoodfacts.org/api/v2/product';

interface OFFNutriments {
  'energy-kcal_100g'?: number;
  'proteins_100g'?: number;
  'fat_100g'?: number;
  'carbohydrates_100g'?: number;
}

interface OFFProduct {
  product_name?: string;
  product_name_ja?: string;
  nutriments?: OFFNutriments;
  serving_size?: string;
  quantity?: string;
  categories_tags?: string[];
}

export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const response = await fetch(
      `${API_BASE}/${barcode}?fields=product_name,product_name_ja,nutriments,serving_size,quantity,categories_tags`,
      { headers: { 'User-Agent': 'CalorieSight/0.2 (contact@example.com)' } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    const product: OFFProduct = data.product;
    const n = product.nutriments || {};

    // 商品名（日本語優先）
    const name = product.product_name_ja || product.product_name || 'Unknown Product';

    // 100gあたりの栄養素（OpenFoodFactsは100gベース）
    // サービングサイズがあればそれを使い、なければ100g想定
    const servingG = parseServingSize(product.serving_size) || 100;
    const ratio = servingG / 100;

    const cal = Math.round((n['energy-kcal_100g'] || 0) * ratio);
    const p = Math.round((n['proteins_100g'] || 0) * ratio);
    const f = Math.round((n['fat_100g'] || 0) * ratio);
    const c = Math.round((n['carbohydrates_100g'] || 0) * ratio);

    // カテゴリからemoji推定
    const emoji = guessEmoji(product.categories_tags || []);

    return { name, cal, p, f, c, cat: '商品', emoji };
  } catch (error) {
    console.error('OpenFoodFacts lookup failed:', error);
    return null;
  }
}

function parseServingSize(serving?: string): number | null {
  if (!serving) return null;
  const match = serving.match(/(\d+(?:\.\d+)?)\s*g/i);
  return match ? parseFloat(match[1]) : null;
}

function guessEmoji(categories: string[]): string {
  const catStr = categories.join(' ').toLowerCase();
  if (catStr.includes('beverage') || catStr.includes('drink')) return '🥤';
  if (catStr.includes('chocolate') || catStr.includes('candy')) return '🍫';
  if (catStr.includes('bread') || catStr.includes('bakery')) return '🍞';
  if (catStr.includes('dairy') || catStr.includes('milk')) return '🥛';
  if (catStr.includes('snack') || catStr.includes('chip')) return '🍿';
  if (catStr.includes('noodle') || catStr.includes('ramen')) return '🍜';
  if (catStr.includes('rice')) return '🍚';
  return '📦';
}
