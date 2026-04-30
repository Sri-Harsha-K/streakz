export function hueToAccent(hue: number, dark: boolean = true): string {
  return dark ? `hsl(${hue}, 70%, 62%)` : `hsl(${hue}, 60%, 46%)`;
}

export function hueToAccentDim(hue: number, dark: boolean = true): string {
  return dark ? `hsl(${hue}, 50%, 32%)` : `hsl(${hue}, 40%, 88%)`;
}

export function hueToAccentBg(hue: number, dark: boolean = true): string {
  return dark ? `hsl(${hue}, 50%, 14%)` : `hsl(${hue}, 40%, 94%)`;
}

export function hueToAccentBorder(hue: number, dark: boolean = true): string {
  return dark ? `hsl(${hue}, 45%, 22%)` : `hsl(${hue}, 50%, 80%)`;
}

export function hueToAccentBadgeBg(hue: number, dark: boolean = true): string {
  return dark ? `hsl(${hue}, 55%, 18%)` : `hsl(${hue}, 60%, 92%)`;
}

export function hueToAccentBadgeText(hue: number, dark: boolean = true): string {
  return dark ? `hsl(${hue}, 80%, 72%)` : `hsl(${hue}, 65%, 38%)`;
}

export function hueToHeatCell(hue: number, level: 1 | 2 | 3 | 4, dark: boolean = true): string {
  const dconfigs: Record<number, [number, number]> = {
    1: [58, 18],
    2: [65, 30],
    3: [72, 44],
    4: [78, 62],
  };
  const lconfigs: Record<number, [number, number]> = {
    1: [50, 84],
    2: [55, 72],
    3: [60, 58],
    4: [65, 46],
  };
  const [s, l] = dark ? dconfigs[level] : lconfigs[level];
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
