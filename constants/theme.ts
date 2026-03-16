// Powered by OnSpace.AI
export const Colors = {
  // Base
  background: '#080B14',
  surface: '#0F1623',
  surfaceElevated: '#151D2E',
  surfaceBorder: '#1E2A3D',
  cardGlass: 'rgba(15, 22, 35, 0.85)',

  // Brand
  primary: '#00D4FF',
  primaryDim: 'rgba(0, 212, 255, 0.15)',
  secondary: '#6C63FF',
  secondaryDim: 'rgba(108, 99, 255, 0.15)',
  accent: '#00FF9D',
  accentDim: 'rgba(0, 255, 157, 0.15)',

  // Semantic
  success: '#00C896',
  error: '#FF4D6D',
  warning: '#FFB547',
  info: '#00D4FF',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8B9BB4',
  textMuted: '#4A5568',
  textInverse: '#080B14',

  // Networks
  ethereum: '#627EEA',
  bsc: '#F3BA2F',
  polygon: '#8247E5',
  solana: '#9945FF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: Colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, color: Colors.textPrimary },
  h3: { fontSize: 20, fontWeight: '600' as const, color: Colors.textPrimary },
  h4: { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400' as const, color: Colors.textPrimary, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, color: Colors.textMuted },
  mono: { fontSize: 14, fontFamily: 'monospace', color: Colors.textPrimary },
};
