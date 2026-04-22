/**
 * Navigation theme colors used by @react-navigation/native ThemeProvider.
 * Sources values from the main COLORS palette in src/constants/theme.ts.
 */

const tintColor = '#2563EB'; // primary blue

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#FFFFFF',
    tint: tintColor,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColor,
  },
  dark: {
    text: '#F8FAFC',
    background: '#0F172A',
    tint: '#60A5FA',
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: '#60A5FA',
  },
};
