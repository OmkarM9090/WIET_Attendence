import React from 'react';

const StatsCard = ({ title, value, subtitle, icon, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow transition-shadow p-5 border border-slate-100/60">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[13px] font-semibold tracking-wide text-slate-500 uppercase">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs font-medium text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl shadow-sm ${colorMap[color] || colorMap.indigo}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
