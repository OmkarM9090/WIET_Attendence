/**
 * STATS CARD COMPONENT
 * Displays statistical information with icon and trend
 * Used in dashboard overviews
 */

import { theme } from "../styles/theme";

export default function StatsCard({ title, value, icon, trend, color = "primary" }) {
  // Color mapping
  const colorMap = {
    primary: theme.colors.primary[500],
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
    info: theme.colors.info,
  };

  const bgColorMap = {
    primary: theme.colors.primary[50],
    success: `${theme.colors.success}15`,
    warning: `${theme.colors.warning}15`,
    error: `${theme.colors.error}15`,
    info: `${theme.colors.info}15`,
  };

  return (
    <div
      className="rounded-lg p-6 transition-all"
      style={{
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.sm,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = theme.shadows.md;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = theme.shadows.sm;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="flex items-start justify-between">
        {/* Left: Title and Value */}
        <div className="flex-1">
          <p
            className="text-sm font-medium"
            style={{ color: theme.colors.text.secondary }}
          >
            {title}
          </p>
          <p
            className="mt-2 text-3xl font-bold"
            style={{ color: theme.colors.text.primary }}
          >
            {value}
          </p>

          {/* Trend Indicator */}
          {trend && (
            <p
              className="mt-2 text-xs font-medium"
              style={{
                color: trend.direction === "up" ? theme.colors.success : theme.colors.error,
              }}
            >
              {trend.direction === "up" ? "↑" : "↓"} {trend.value}
              <span
                className="ml-1"
                style={{ color: theme.colors.text.secondary }}
              >
                {trend.label}
              </span>
            </p>
          )}
        </div>

        {/* Right: Icon */}
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{
            backgroundColor: bgColorMap[color],
            color: colorMap[color],
          }}
        >
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
