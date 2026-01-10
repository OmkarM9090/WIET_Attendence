/**
 * BUTTON COMPONENT
 * Reusable button with variants and loading state
 * Theme-controlled styling
 */

import { theme } from "../styles/theme";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  fullWidth = false,
  loading = false,
  className = "",
}) {
  // Base styles
  const baseStyles = {
    padding: "0.625rem 1.5rem",
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    transition: theme.transitions.base,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    border: "1px solid transparent",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: fullWidth ? "100%" : "auto",
  };

  // Variant styles
  const getVariantStyles = () => {
    if (disabled || loading) {
      return {
        backgroundColor: theme.colors.disabled,
        color: theme.colors.text.secondary,
        cursor: "not-allowed",
        opacity: 0.6,
      };
    }

    const variants = {
      primary: {
        backgroundColor: theme.colors.primary[500],
        color: theme.colors.text.inverse,
        hover: {
          backgroundColor: theme.colors.primary[600],
        },
      },
      secondary: {
        backgroundColor: theme.colors.neutral[100],
        color: theme.colors.text.primary,
        hover: {
          backgroundColor: theme.colors.neutral[200],
        },
      },
      outline: {
        backgroundColor: "transparent",
        color: theme.colors.primary[500],
        borderColor: theme.colors.primary[500],
        hover: {
          backgroundColor: theme.colors.primary[50],
        },
      },
      danger: {
        backgroundColor: theme.colors.error,
        color: theme.colors.text.inverse,
        hover: {
          backgroundColor: "#dc2626",
        },
      },
      success: {
        backgroundColor: theme.colors.success,
        color: theme.colors.text.inverse,
        hover: {
          backgroundColor: "#059669",
        },
      },
    };

    return variants[variant] || variants.primary;
  };

  const variantStyles = getVariantStyles();

  const handleMouseEnter = (e) => {
    if (!disabled && !loading && variantStyles.hover) {
      Object.assign(e.currentTarget.style, variantStyles.hover);
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled && !loading) {
      e.currentTarget.style.backgroundColor = variantStyles.backgroundColor;
      if (variant === "outline") {
        e.currentTarget.style.backgroundColor = "transparent";
      }
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={{
        ...baseStyles,
        ...variantStyles,
        border: variant === "outline" ? `1px solid ${variantStyles.borderColor}` : "1px solid transparent",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {loading ? (
        <>
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            style={{ opacity: 0.7 }}
          />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
