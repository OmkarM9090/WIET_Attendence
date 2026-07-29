import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ title, value, icon, trend, color = "primary" }) {
  const colorMap = {
    primary: "text-blue-600 bg-blue-50/80 border-blue-100",
    success: "text-emerald-600 bg-emerald-50/80 border-emerald-100",
    warning: "text-amber-600 bg-amber-50/80 border-amber-100",
    error: "text-rose-600 bg-rose-50/80 border-rose-100",
    info: "text-blue-600 bg-blue-50/80 border-blue-100",
    purple: "text-purple-600 bg-purple-50/80 border-purple-100",
  };

  return (
    <div className="rounded-2xl p-5 bg-white border border-slate-200/80 shadow-2xs">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-wider uppercase text-slate-500">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </p>

          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold">
              {trend.direction === "up" ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-600">
                  <TrendingUp size={14} />
                  <span>+{trend.value}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-rose-600">
                  <TrendingDown size={14} />
                  <span>-{trend.value}</span>
                </span>
              )}
              {trend.label && (
                <span className="text-slate-400 font-medium ml-1">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-2xs text-xl ${colorMap[color] || colorMap.primary}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
