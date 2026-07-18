/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// constants/theme.ts
export const Colors = {
  // Backgrounds
  background: '#050505',      // Near Black
  surface: '#111111',         // Card Background
  surfaceVariant: '#1A1A1A',  // Elevated Surface

  // Primary Neon Colors
  primary: '#052a2c',         // Neon Cyan
  primaryLight: '#00a0a3',    // Bright Cyan Glow
  primaryDark: '#00A6B8',      // Deep Cyan

  // Accent Colors
  secondary: '#FF00D4',       // Neon Magenta
  success: '#39FF14',         // Matrix Green
  warning: '#FFD500',         // Electric Yellow
  error: '#FF1744',           // Neon Red

  // Text
  text: '#F8F8F8',            // White
  textSecondary: '#B8B8B8',   // Gray
  textTertiary: '#707070',    // Dark Gray

  // UI
  border: '#222222',
  divider: '#161616',
  overlay: 'rgba(0,0,0,0.85)',

  // Glow
  highlight: 'rgba(0,245,255,0.18)',
  shadow: '#00F5FF',

  // Extra Neon Colors
  purple: '#8A2EFF',
  orange: '#FF7A00',
  lime: '#C6FF00',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 10,
  xl: 100,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  bodySecondary: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: Colors.textTertiary,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
