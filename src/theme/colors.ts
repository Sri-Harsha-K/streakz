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
  accent: string;
  accentText: string;
  freeze: string;
  divider: string;
  heat0: string;
  heat1: string;
  heat2: string;
  heat3: string;
  heat4: string;
}

export const DARK: ThemeColors = {
  surface:       '#0E0E10',
  card:          '#17171A',
  elevated:      '#17171A',
  elevated2:     '#202024',
  elevated3:     '#2A2A2F',
  borderSubtle:  'rgba(255,255,255,0.08)',
  borderDefault: 'rgba(255,255,255,0.14)',
  borderInput:   'rgba(255,255,255,0.22)',
  textPrimary:   '#F4F2EE',
  textSecondary: 'rgba(244,242,238,0.78)',
  textMuted:     'rgba(244,242,238,0.62)',
  textFaint:     'rgba(244,242,238,0.38)',
  textVeryFaint: 'rgba(244,242,238,0.22)',
  overlay:       'rgba(0,0,0,0.6)',
  missed:        'rgba(239,68,68,0.13)',
  accent:        '#DA8A3E',
  accentText:    '#0E0E10',
  freeze:        '#88B7D6',
  divider:       'rgba(255,255,255,0.06)',
  heat0:         'rgba(255,255,255,0.04)',
  heat1:         'rgba(180,110,55,0.45)',
  heat2:         'rgba(200,130,65,0.65)',
  heat3:         'rgba(220,150,80,0.85)',
  heat4:         '#DA8A3E',
};

export const LIGHT: ThemeColors = {
  surface:       '#FAF7F2',
  card:          '#FFFFFF',
  elevated:      '#FAF7F2',
  elevated2:     '#F1ECE3',
  elevated3:     '#E5DFD3',
  borderSubtle:  'rgba(20,18,14,0.08)',
  borderDefault: 'rgba(20,18,14,0.14)',
  borderInput:   'rgba(20,18,14,0.20)',
  textPrimary:   '#1A1714',
  textSecondary: 'rgba(26,23,20,0.78)',
  textMuted:     'rgba(26,23,20,0.58)',
  textFaint:     'rgba(26,23,20,0.34)',
  textVeryFaint: 'rgba(26,23,20,0.20)',
  overlay:       'rgba(20,18,14,0.40)',
  missed:        'rgba(239,68,68,0.09)',
  accent:        '#BC6F1F',
  accentText:    '#FFFFFF',
  freeze:        '#4D7D9E',
  divider:       'rgba(20,18,14,0.06)',
  heat0:         'rgba(20,18,14,0.04)',
  heat1:         '#E8D5BE',
  heat2:         '#D9B585',
  heat3:         '#C99450',
  heat4:         '#BC6F1F',
};

export const THEMES: Record<ThemeName, ThemeColors> = { dark: DARK, light: LIGHT };
