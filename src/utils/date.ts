/** ローカル時間でYYYY-MM-DD文字列を生成 */
const toLocal = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/** 今日の日付 YYYY-MM-DD（ローカル時間） */
export const today = (): string => toLocal(new Date());

/** N日前/後の日付 YYYY-MM-DD（ローカル時間） */
export const dateOffset = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toLocal(d);
};

/** MM/DD 形式 */
export const fmtShort = (d: string): string => {
  const p = d.split('-');
  return `${p[1]}/${p[2]}`;
};

/** 曜日（日本語1文字） */
export const dayOfWeek = (d: string): string =>
  ['日', '月', '火', '水', '木', '金', '土'][new Date(d + 'T12:00:00').getDay()];

/** YYYY年MM月DD日（曜日） */
export const fmtFull = (d: string): string => {
  const p = d.split('-');
  return `${p[0]}年${p[1]}月${p[2]}日(${dayOfWeek(d)})`;
};

/** 2つの日付間の日数 */
export const daysBetween = (from: string, to: string): number =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
