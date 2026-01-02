// Design tokens matching the Figma/Web design
export const colors = {
  // Core backgrounds
  background: '#121212',
  card: '#1A1A1A',
  cardSecondary: '#1E1E1E',

  // Brand accent - Neon Green
  accent: '#39FF14',
  accentHover: '#2ECC11',

  // Text colors
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.60)',
  textMuted: 'rgba(255, 255, 255, 0.40)',
  textSubtle: 'rgba(255, 255, 255, 0.50)',

  // Borders and rings
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderMedium: 'rgba(255, 255, 255, 0.10)',
  borderAccent: 'rgba(57, 255, 20, 0.20)',

  // Utility
  black: '#000000',
  blackOverlay: 'rgba(0, 0, 0, 0.80)',
  destructive: '#d4183d',
  red: '#EF4444',

  // Transparent
  transparent: 'transparent',
  whiteSubtle: 'rgba(255, 255, 255, 0.05)',
  whiteMedium: 'rgba(255, 255, 255, 0.10)',
  whiteLight: 'rgba(255, 255, 255, 0.15)',
  whiteBorder: 'rgba(255, 255, 255, 0.20)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  full: 9999,
};

export const typography = {
  // Hero metrics
  heroLarge: {
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: -1.12,
    fontWeight: '500' as const,
  },
  heroMedium: {
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -0.8,
    fontWeight: '500' as const,
  },
  heroSmall: {
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -0.64,
    fontWeight: '500' as const,
  },

  // Body text
  bodyLarge: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },

  // Labels
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
};
