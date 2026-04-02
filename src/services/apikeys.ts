/**
 * APIキー管理 - ブラウザのIndexedDBに安全に保存
 * 環境変数ではなくアプリ内設定で管理する方式
 */

import { db } from '../data/db';

const STORAGE_KEY_GEMINI = 'apikey_gemini';
const STORAGE_KEY_CLAUDE = 'apikey_claude';

// シンプルなKVストアをDexieのprofileテーブルを流用して管理
// 専用テーブルを追加するとDB version変更が必要なので、localStorageを使う

export function getGeminiKey(): string {
  return localStorage.getItem(STORAGE_KEY_GEMINI) || '';
}

export function getClaudeKey(): string {
  return localStorage.getItem(STORAGE_KEY_CLAUDE) || '';
}

export function setGeminiKey(key: string): void {
  if (key) {
    localStorage.setItem(STORAGE_KEY_GEMINI, key);
  } else {
    localStorage.removeItem(STORAGE_KEY_GEMINI);
  }
}

export function setClaudeKey(key: string): void {
  if (key) {
    localStorage.setItem(STORAGE_KEY_CLAUDE, key);
  } else {
    localStorage.removeItem(STORAGE_KEY_CLAUDE);
  }
}

export function getApiKeyStatus(): { gemini: boolean; claude: boolean } {
  return {
    gemini: !!getGeminiKey(),
    claude: !!getClaudeKey(),
  };
}
