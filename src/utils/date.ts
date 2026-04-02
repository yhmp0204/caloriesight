/** 今日の日付 YYYY-MM-DD */
export const today = (): string => new Date().toISOString().slice(0, 10);

/** N日前/後の日付 YYYY-MM-DD */
export const dateOffset = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
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
