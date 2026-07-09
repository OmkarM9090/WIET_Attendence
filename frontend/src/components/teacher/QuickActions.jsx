import React from 'react';
import { ClipboardCheck, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Mark Attendance',
      icon: <ClipboardCheck size={20} />,
      onClick: () => navigate('/teacher/mark-attendance'),
      bgColor: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
    },
    {
      label: 'View Reports',
      icon: <FileText size={20} />,
      onClick: () => navigate('/teacher/reports'),
      bgColor: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-slate-100'
    },
    {
      label: 'Download Data',
      icon: <Download size={20} />,
      onClick: () => navigate('/teacher/reports'),
      bgColor: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-slate-100'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center h-full">
      <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all shadow-sm ${action.bgColor}`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
