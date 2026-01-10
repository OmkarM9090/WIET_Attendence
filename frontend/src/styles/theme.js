/**
 * CENTRALIZED THEME SYSTEM
 * All colors, typography, and spacing controlled from here
 * Used across all components to ensure consistency
 */

export const theme = {
  // Color Palette
  colors: {
    // Primary Colors - Professional Blue/Indigo
    primary: {
      50: "#f0f4ff",
      100: "#e0e9ff",
      200: "#c1d3ff",
      300: "#a2baff",
      400: "#8395ff",
      500: "#6b7dff", // Main primary
      600: "#5566d2",
      700: "#4450a5",
      800: "#303a78",
      900: "#1c244b",
    },

    // Neutral Colors - Gray scale
    neutral: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },

    // Status Colors
    success: "#10b981", // Green
    warning: "#f59e0b", // Amber
    error: "#ef4444", // Red
    info: "#3b82f6", // Blue

    // Background & Surface
    background: "#ffffff",
    surface: "#f9fafb",
    border: "#e5e7eb",

    // Text Colors
    text: {
      primary: "#1f2937",
      secondary: "#6b7280",
      light: "#9ca3af",
      inverse: "#ffffff",
    },

    // Semantic Colors
    disabled: "#d1d5db",
    hover: "#f3f4f6",
    active: "#e0e9ff",
  },

  // Typography
  typography: {
    fontFamily: {
      sans: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif",
      mono: "'Fira Code', monospace",
    },

    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
    },

    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing System
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "2.5rem", // 40px
    "3xl": "3rem", // 48px
  },

  // Border Radius
  borderRadius: {
    none: "0",
    xs: "0.25rem",
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.5rem",
    full: "9999px",
  },

  // Shadows
  shadows: {
    none: "none",
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },

  // Transitions
  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Z-index layers
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
  },
};

// Utility function to get color with opacity
export const getColorWithOpacity = (color, opacity) => {
  // Converts hex/rgb to rgba with opacity
  // Example: getColorWithOpacity(theme.colors.primary[500], 0.5)
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
};
