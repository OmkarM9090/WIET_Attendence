import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecentSessions = ({ sessions }) => {
  const navigate = useNavigate();

  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center h-full text-slate-500">
        <Clock className="w-12 h-12 mb-3 text-slate-300" />
        <p>No recent sessions found</p>
        <button 
          onClick={() => navigate('/teacher/mark-attendance')}
          className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
        >
          Mark Attendance
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h3 className="font-semibold text-slate-800">Recent Sessions</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {sessions.map((session, i) => (
          <div 
            key={session._id || i} 
            className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
            onClick={() => navigate('/teacher/attendance-history')}
          >
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">
                {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="font-medium text-slate-800">{session.subject}</p>
              <p className="text-xs text-slate-500 mt-1">{session.classInfo}</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="flex items-center gap-1">
                <span className={`text-sm font-semibold ${session.percentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {session.percentage}%
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                <CheckCircle2 size={12} /> Completed
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSessions;
