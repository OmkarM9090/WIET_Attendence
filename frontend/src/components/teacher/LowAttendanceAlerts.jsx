import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LowAttendanceAlerts = ({ alerts }) => {
  const navigate = useNavigate();

  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50/70 rounded-xl border border-amber-200/80 overflow-hidden mt-6 shadow-2xs">
      <div className="px-5 py-3.5 border-b border-amber-200/80 bg-amber-100/40 flex items-center gap-2">
        <AlertTriangle className="text-amber-600" size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">Low Attendance Alerts</h3>
      </div>
      <div className="divide-y divide-amber-100">
        {alerts.map((alert, i) => (
          <div key={i} className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="text-amber-600 shrink-0" size={15} />
              <p className="text-amber-950 text-xs font-medium">
                <strong className="font-bold text-amber-900">{alert.count} students</strong> below {alert.threshold}% in {alert.subject}
              </p>
            </div>
            <button 
              onClick={() => navigate('/teacher/reports')}
              className="text-amber-800 hover:text-amber-950 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              View Defaulters <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LowAttendanceAlerts;
