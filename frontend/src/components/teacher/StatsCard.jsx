import React from 'react';

const StatsCard = ({ title, value, subtitle, icon, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'bg-blue-50/80 text-blue-600 border-blue-100',
    green: 'bg-emerald-50/80 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50/80 text-amber-600 border-amber-100',
    red: 'bg-rose-50/80 text-rose-600 border-rose-100',
    purple: 'bg-purple-50/80 text-purple-600 border-purple-100',
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xs p-5 border border-slate-200/80">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs font-medium text-slate-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-2xl border shadow-2xs ${colorMap[color] || colorMap.indigo}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
