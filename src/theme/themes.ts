import { brandColors } from './colors';

const sharedColors = {
  primary: brandColors.primary,
  secondary: brandColors.secondary,
  tertiary: brandColors.tertiary,
  black: brandColors.black,
  white: brandColors.white,
  gray: brandColors.gray,
};

export const lightTheme = {
  colors: {
    ...sharedColors,
    background: brandColors.white,
    header: brandColors.primary,
    card: brandColors.white,
    surface: '#F5F7FA',
    text: brandColors.secondary,
    textSecondary: '#3D5C52',
    textMuted: '#4A6670',
    textOnHeader: brandColors.white,
    border: 'transparent',
    inputBackground: brandColors.white,
    inputText: brandColors.black,
    placeholder: '#6B7280',
    onPrimary: brandColors.white,
    onSecondary: brandColors.white,
    onTertiary: brandColors.black,
    overlay: 'transparent',
    shadow: brandColors.black,
  },
  gap: (v: number) => v * 8,
  radii: {
    input: 28,
    card: 40,
    circle: 28,
  },
};

export const darkTheme = {
  colors: {
    ...sharedColors,
    background: brandColors.black,
    header: brandColors.primary,
    card: '#121212',
    surface: '#1A1A1A',
    text: brandColors.white,
    textSecondary: '#C5D5CE',
    textMuted: '#9AABB0',
    textOnHeader: brandColors.white,
    border: 'transparent',
    inputBackground: '#1E1E1E',
    inputText: brandColors.white,
    placeholder: '#8A8A8A',
    onPrimary: brandColors.white,
    onSecondary: brandColors.white,
    onTertiary: brandColors.black,
    overlay: 'rgba(0,0,0,0.45)',
    shadow: brandColors.black,
  },
  gap: (v: number) => v * 8,
  radii: {
    input: 28,
    card: 40,
    circle: 28,
  },
};

export const appThemes = {
  light: lightTheme,
  dark: darkTheme,
};

export const breakpoints = {
  xs: 0,
  sm: 300,
  md: 500,
  lg: 800,
  xl: 1200,
};
