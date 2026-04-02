/**
 * OpenFoodFacts API を使った食品検索
 * 完全無料・オープンソースの食品データベース
 */

import type { FoodItem } from '../types';

const API_BASE = 'https://world.openfoodfacts.org';

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

// ── バーコード検索 ──
export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const response = await fetch(
      `${API_BASE}/api/v2/product/${barcode}?fields=product_name,product_name_ja,nutriments,serving_size,quantity,categories_tags`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    return parseProduct(data.product);
  } catch (error) {
    console.error('OpenFoodFacts barcode lookup failed:', error);
    return null;
  }
}

// ── 商品名テキスト検索 ──
export async function searchByName(query: string): Promise<FoodItem[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `${API_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,product_name_ja,nutriments,serving_size,categories_tags`
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.products || !Array.isArray(data.products)) return [];

    const results: FoodItem[] = [];
    for (const product of data.products) {
      const item = parseProduct(product);
      if (item && item.cal > 0) {
        results.push(item);
      }
    }
    return results;
  } catch (error) {
    console.error('OpenFoodFacts search failed:', error);
    return [];
  }
}

// ── 共通パース処理 ──
function parseProduct(product: OFFProduct): FoodItem | null {
  const n = product.nutriments || {};
  const name = product.product_name_ja || product.product_name;
  if (!name) return null;

  const servingG = parseServingSize(product.serving_size) || 100;
  const ratio = servingG / 100;

  const cal = Math.round((n['energy-kcal_100g'] || 0) * ratio);
  const p = Math.round((n['proteins_100g'] || 0) * ratio);
  const f = Math.round((n['fat_100g'] || 0) * ratio);
  const c = Math.round((n['carbohydrates_100g'] || 0) * ratio);
  const emoji = guessEmoji(product.categories_tags || []);

  return { name, cal, p, f, c, cat: '商品', emoji };
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
