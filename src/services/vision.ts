/**
 * VisionService - 食事写真のAI認識サービス
 *
 * メイン: Gemini 2.5 Flash Vision API
 * フォールバック: Claude Haiku 4.5
 *
 * APIキーはブラウザ内(localStorage)で管理
 */

import type { AIRecognitionResult, VisionProvider, VisionResponse } from '../types';
import { getGeminiKey, getClaudeKey, getApiKeyStatus } from './apikeys';

export { getApiKeyStatus } from './apikeys';

// ── 設定 ──
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `あなたは日本の食事に詳しい管理栄養士です。
ユーザーが送った食事の写真を分析し、以下のJSON形式で回答してください。
複数の料理が写っている場合は、それぞれを個別のアイテムとして返してください。
JSONのみを返し、他のテキストは含めないでください。

{
  "items": [
    {
      "name": "料理名",
      "cal": 推定カロリー(kcal),
      "p": タンパク質(g),
      "f": 脂質(g),
      "c": 炭水化物(g),
      "confidence": 確信度(0.0-1.0),
      "cat": "カテゴリ名",
      "emoji": "絵文字1文字"
    }
  ]
}`;

// ── 画像をBase64に変換 ──
export async function imageToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // data:image/jpeg;base64,... の "base64,..." 以降を取得
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── 画像をリサイズ（トークン節約） ──
export async function resizeImage(file: File | Blob, maxSize = 1568): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width <= maxSize && height <= maxSize) {
        resolve(file instanceof Blob ? file : new Blob([file]));
        return;
      }

      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        0.85
      );
    };

    img.src = url;
  });
}

// ── Gemini Vision API ──
async function recognizeWithGemini(base64Image: string): Promise<AIRecognitionResult[]> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('Gemini APIキーが設定されていません');

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: SYSTEM_PROMPT },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          { text: 'この食事を分析してください。' },
        ],
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = JSON.parse(text);
  return parsed.items || [parsed];
}

// ── Claude Vision API (フォールバック) ──
async function recognizeWithClaude(base64Image: string): Promise<AIRecognitionResult[]> {
  const apiKey = getClaudeKey();
  if (!apiKey) throw new Error('Claude APIキーが設定されていません');

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image,
            },
          },
          { type: 'text', text: 'この食事を分析してください。' },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  // Claude はMarkdownコードブロックで囲むことがあるため除去
  const cleaned = text.replace(/```json\s*|```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  return parsed.items || [parsed];
}

// ── メインの認識関数（自動フォールバック付き） ──
export async function recognizeFood(imageFile: File | Blob): Promise<VisionResponse> {
  // 1. 画像をリサイズ（トークン節約）
  const resized = await resizeImage(imageFile);
  const base64 = await imageToBase64(resized);

  // 2. まずGeminiを試行
  try {
    const items = await recognizeWithGemini(base64);
    return { items, provider: 'gemini' };
  } catch (geminiError) {
    console.warn('Gemini API failed, falling back to Claude:', geminiError);
  }

  // 3. Gemini失敗時はClaudeにフォールバック
  try {
    const items = await recognizeWithClaude(base64);
    return { items, provider: 'claude' };
  } catch (claudeError) {
    console.error('Claude API also failed:', claudeError);
    throw new Error('食事の認識に失敗しました。インターネット接続を確認してください。');
  }
}


