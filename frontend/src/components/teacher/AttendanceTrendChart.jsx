import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { theme } from '../../styles/theme';

const AttendanceTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center h-64 text-slate-500">
        <p>No trend data available yet</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-sm">
          <p className="font-semibold mb-1">{label}</p>
          <p className="text-indigo-300">
            Attendance: <span className="text-white font-bold">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-800">7-Day Attendance Trend</h3>
        <p className="text-xs text-slate-500">Average attendance percentage over the last week</p>
      </div>
      <div className="h-64 w-full mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.colors.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={theme.colors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke={theme.colors.primary}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorPercent)"
              activeDot={{ r: 6, strokeWidth: 0, fill: theme.colors.primary }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceTrendChart;
