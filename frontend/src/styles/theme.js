/**
 * CENTRALIZED THEME SYSTEM
 * Professional Administrative Dashboard Theme
 * Clean Enterprise Aesthetics with standard HSL/Hex Palette
 */

export const theme = {
  // Color Palette
  colors: {
    // Primary Colors - Professional Blue (#0d6efd)
    primary: {
      50: "#e7f1ff",
      100: "#cfe2ff",
      200: "#9ec5fe",
      300: "#6ea8fe",
      400: "#3d8bfd",
      500: "#0d6efd", // Main Primary Accent
      600: "#0b5ed7",
      700: "#0a58ca",
      800: "#084298",
      900: "#052c65",
    },

    // Neutral Colors - Slate/Charcoal scale
    neutral: {
      50: "#f8f9fa",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#212529", // Dark Charcoal
    },

    // Attendance Status Colors (Explicitly defined)
    status: {
      present: "#198754",    // Green
      late: "#ffc107",       // Amber
      halfDay: "#fd7e14",    // Orange
      absent: "#dc3545",     // Red
      remote: "#6f42c1",     // Purple
    },

    // Standard Statuses
    success: "#198754", // Green
    warning: "#ffc107", // Amber
    error: "#dc3545",   // Red
    info: "#0d6efd",    // Blue
    purple: "#6f42c1",  // Purple

    // Background & Surface
    background: "#f8f9fa",
    surface: "#ffffff",
    cardBg: "#ffffff",
    border: "#e2e8f0",

    // Text Colors
    text: {
      primary: "#212529",
      secondary: "#64748b",
      light: "#94a3b8",
      inverse: "#ffffff",
    },

    // Interactive States
    disabled: "#cbd5e1",
    hover: "#f1f5f9",
    active: "#e7f1ff",
  },

  // Typography
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },

    fontSize: {
      xs: "0.75rem",   // 12px
      sm: "0.875rem",  // 14px
      base: "1rem",     // 16px
      lg: "1.125rem",  // 18px
      xl: "1.25rem",   // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem",// 30px
      "4xl": "2.25rem",// 36px
    },

    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing System
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "2.5rem",
    "3xl": "3rem",
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

  // Modern Shadows
  shadows: {
    none: "none",
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.03)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
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

export const getColorWithOpacity = (color, opacity) => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
};
