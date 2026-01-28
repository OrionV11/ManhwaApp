/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// constants/theme.ts
export const Colors = {
  // Primary dark blue palette
  background: '#0A1929',      // Deep navy background
  surface: '#132F4C',         // Slightly lighter for cards/surfaces
  surfaceVariant: '#1E3A5F',  // For hover states, borders
  
  // Blue accents
  primary: '#3B82F6',         // Bright blue (primary actions)
  primaryLight: '#60A5FA',    // Lighter blue (hover states)
  primaryDark: '#2563EB',     // Darker blue (pressed states)
  
  // Supporting colors
  secondary: '#06B6D4',       // Cyan accent
  success: '#10B981',         // Green
  warning: '#F59E0B',         // Amber
  error: '#EF4444',           // Red
  
  // Text colors
  text: '#E2E8F0',            // Light gray for primary text
  textSecondary: '#94A3B8',   // Muted gray for secondary text
  textTertiary: '#64748B',    // Even more muted
  
  // UI elements
  border: '#1E3A5F',          // Subtle borders
  divider: '#1A2942',         // Dividers
  overlay: 'rgba(10, 25, 41, 0.8)', // For modals
  
  // Special
  highlight: '#3B82F620',     // Blue tint for selections
  shadow: '#000000',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
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
