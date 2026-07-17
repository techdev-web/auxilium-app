import { brandColors } from './colors';

const sharedColors = {
  primary: brandColors.primary,
  secondary: brandColors.secondary,
  tertiary: brandColors.tertiary,
  black: brandColors.black,
  white: brandColors.white,
};

export const lightTheme = {
  colors: {
    ...sharedColors,
    background: brandColors.white,
    header: brandColors.primary,
    card: brandColors.white,
    surface: '#F5F7FA',
    text: brandColors.black,
    textSecondary: '#6B7280',
    textOnHeader: brandColors.white,
    border: '#E5E7EB',
    inputBackground: brandColors.white,
    placeholder: '#9CA3AF',
    onPrimary: brandColors.white,
    onSecondary: brandColors.white,
    onTertiary: brandColors.black,
  },
  gap: (v: number) => v * 8,
  radii: {
    input: 12,
    card: 40,
  },
};

export const darkTheme = {
  colors: {
    ...sharedColors,
    background: brandColors.black,
    header: brandColors.primary,
    card: brandColors.black,
    surface: '#141414',
    text: brandColors.white,
    textSecondary: '#A8A8A8',
    textOnHeader: brandColors.white,
    border: '#333333',
    inputBackground: '#1A1A1A',
    placeholder: '#7A7A7A',
    onPrimary: brandColors.white,
    onSecondary: brandColors.white,
    onTertiary: brandColors.black,
  },
  gap: (v: number) => v * 8,
  radii: {
    input: 12,
    card: 40,
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
