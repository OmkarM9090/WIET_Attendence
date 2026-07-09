import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LowAttendanceAlerts = ({ alerts }) => {
  const navigate = useNavigate();

  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-amber-200 bg-amber-100/50 flex items-center gap-2">
        <AlertTriangle className="text-amber-600" size={20} />
        <h3 className="font-semibold text-amber-900">Low Attendance Alerts</h3>
      </div>
      <div className="p-2">
        {alerts.map((alert, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-amber-900 text-sm font-medium">
                <span className="font-bold">{alert.count} students</span> below {alert.threshold}% in {alert.subject}
              </p>
            </div>
            <button 
              onClick={() => navigate('/teacher/reports')}
              className="text-amber-700 hover:text-amber-900 text-sm font-semibold flex items-center gap-1 transition-colors"
            >
              View Defaulters <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LowAttendanceAlerts;
