export const lightColors = {
  primary: '#4361EE',
  primaryDark: '#3A56D4',
  secondary: '#4CC9F0',
  accent: '#F72585',
  background: '#F8F9FB',
  card: '#FFFFFF',
  textPrimary: '#252C37',
  textSecondary: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  shadow: '#1E293B',
  border: '#E2E8F0',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  disabled: '#9CA3AF',
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
  accentLight: '#E0E7FF',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
  overlayLight: 'rgba(255, 255, 255, 0.9)',
  surfaceElevated: '#FAFBFC',
  online: '#22C55E',
  offline: '#94A3B8',
};

export const darkColors = {
  primary: '#4361EE',
  primaryDark: '#3A56D4',
  secondary: '#4CC9F0',
  accent: '#F72585',
  background: '#23283A',
  card: '#2D3346',
  textPrimary: '#F3F6FB',
  textSecondary: '#B6BCD4',
  success: '#22C55E',
  danger: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',
  shadow: '#000000',
  border: '#3C4252',
  backdrop: 'rgba(0, 0, 0, 0.7)',
  disabled: '#6B7280',
  gradientStart: '#3A56D4',
  gradientEnd: '#23283A',
  accentLight: '#312E81',
  cardShadow: 'rgba(0, 0, 0, 0.18)',
  overlayLight: 'rgba(0, 0, 0, 0.85)',
  surfaceElevated: '#23283A',
  online: '#22C55E',
  offline: '#6B7280',
};

export const getColors = (isDarkMode) => {
  return isDarkMode ? darkColors : lightColors;
};

export const colors = lightColors;