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
      className="rounded-2xl p-5 transition-all bg-white border border-slate-100/60 hover:shadow shadow-sm"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="flex items-start justify-between">
        {/* Left: Title and Value */}
        <div className="flex-1 space-y-1">
          <p
            className="text-[13px] font-semibold tracking-wide uppercase text-slate-500"
          >
            {title}
          </p>
          <p
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800"
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
