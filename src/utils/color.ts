export function hueToAccent(hue: number): string {
  return `hsl(${hue}, 70%, 58%)`;
}

export function hueToAccentDim(hue: number): string {
  return `hsl(${hue}, 55%, 42%)`;
}

export function hueToAccentBg(hue: number): string {
  return `hsl(${hue}, 50%, 14%)`;
}

export function hueToAccentBorder(hue: number): string {
  return `hsl(${hue}, 45%, 22%)`;
}

export function hueToAccentBadgeBg(hue: number): string {
  return `hsl(${hue}, 55%, 18%)`;
}

export function hueToAccentBadgeText(hue: number): string {
  return `hsl(${hue}, 80%, 72%)`;
}

export function hueToHeatCell(hue: number, level: 1 | 2 | 3 | 4): string {
  const configs: Record<number, [number, number]> = {
    1: [58, 18],
    2: [65, 30],
    3: [72, 44],
    4: [78, 62],
  };
  const [s, l] = configs[level];
  return `hsl(${hue}, ${s}%, ${l}%)`;
}

const NAME_TO_HUE: Record<string, number> = {
  emerald: 152,
  blue: 210,
  purple: 270,
  orange: 28,
  pink: 330,
  cyan: 187,
};

export function migrateColor(color: unknown): number {
  if (typeof color === 'number') return Math.round(color) % 360;
  if (typeof color === 'string') {
    const named = NAME_TO_HUE[color];
    if (named !== undefined) return named;
    const parsed = parseInt(color, 10);
    if (!isNaN(parsed)) return parsed % 360;
  }
  return 152;
}
