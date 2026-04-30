export function toLocalDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

export function today(): string {
  return toLocalDateString();
}

export function daysBetween(a: string, b: string): number {
  const da = parseLocalDate(a).getTime();
  const db = parseLocalDate(b).getTime();
  return Math.round(Math.abs(da - db) / 86400000);
}

export function formatDisplayDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getDayOfWeek(dateStr: string): number {
  return parseLocalDate(dateStr).getDay();
}

export function getMonthLabel(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { month: 'short' });
}

export function addDays(dateStr: string, n: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + n);
  return toLocalDateString(d);
}

export function subDays(dateStr: string, n: number): string {
  return addDays(dateStr, -n);
}

export function isFuture(dateStr: string): boolean {
  return dateStr > today();
}

export function isToday(dateStr: string): boolean {
  return dateStr === today();
}
