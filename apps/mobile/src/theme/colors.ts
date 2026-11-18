export const colors = {
  background: '#0B1110',
  surface: '#151D1A',
  surfaceSecondary: '#1D2823',
  surfaceElevated: '#222E29',
  surfaceHover: '#2A3832',

  primary: '#C6F36B',
  primaryMuted: '#96BA50',
  primaryDark: '#1E2D12',

  textPrimary: '#F5F7F3',
  textSecondary: '#99A59D',
  textMuted: '#68776D',
  textInverse: '#0B1110',

  border: '#29342E',
  borderHighlight: '#3E4F46',

  // Status Colors
  success: '#C6F36B',
  warning: '#FACC15',
  error: '#F87171',
  info: '#38BDF8',

  // Overlays
  overlay: 'rgba(11, 17, 16, 0.85)',
  cardOverlay: 'rgba(21, 29, 26, 0.92)',
} as const;

export type ColorToken = keyof typeof colors;
