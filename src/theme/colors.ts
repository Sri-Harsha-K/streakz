export type ThemeName = 'dark' | 'light';

export interface ThemeColors {
  surface: string;
  card: string;
  elevated: string;
  elevated2: string;
  elevated3: string;
  borderSubtle: string;
  borderDefault: string;
  borderInput: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  textVeryFaint: string;
  overlay: string;
  missed: string;
}

export const DARK: ThemeColors = {
  surface:       '#030712',
  card:          '#111827',
  elevated:      '#1f2937',
  elevated2:     '#374151',
  elevated3:     '#4b5563',
  borderSubtle:  '#1f2937',
  borderDefault: '#374151',
  borderInput:   '#4b5563',
  textPrimary:   '#ffffff',
  textSecondary: '#d1d5db',
  textMuted:     '#9ca3af',
  textFaint:     '#6b7280',
  textVeryFaint: '#4b5563',
  overlay:       'rgba(0,0,0,0.6)',
  missed:        'rgba(239,68,68,0.13)',
};

export const LIGHT: ThemeColors = {
  surface:       '#f1f5f9',
  card:          '#ffffff',
  elevated:      '#f8fafc',
  elevated2:     '#e2e8f0',
  elevated3:     '#cbd5e1',
  borderSubtle:  '#e2e8f0',
  borderDefault: '#cbd5e1',
  borderInput:   '#94a3b8',
  textPrimary:   '#0f172a',
  textSecondary: '#1e293b',
  textMuted:     '#475569',
  textFaint:     '#64748b',
  textVeryFaint: '#94a3b8',
  overlay:       'rgba(0,0,0,0.4)',
  missed:        'rgba(239,68,68,0.09)',
};

export const THEMES: Record<ThemeName, ThemeColors> = { dark: DARK, light: LIGHT };
