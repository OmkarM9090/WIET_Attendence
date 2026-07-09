import React from 'react';

const StatsCard = ({ title, value, subtitle, icon, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-slate-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 tabular-nums">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorMap[color] || colorMap.indigo}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
