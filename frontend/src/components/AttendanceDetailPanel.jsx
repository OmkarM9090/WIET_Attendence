import React, { useEffect, useState } from 'react';
import { getSessionDetails } from '../services/attendanceService';
import { X, Download, Edit2, CheckCircle, XCircle } from 'lucide-react';

const AttendanceDetailPanel = ({ sessionId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSessionDetails(sessionId);
        if (data.success) {
          setDetails(data);
        } else {
          setError(data.message || 'Failed to fetch details');
        }
      } catch (err) {
        setError(err.message || 'Error fetching details');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchDetails();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="bg-slate-50 p-6 rounded-b-2xl border-x border-b border-slate-200 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4 mb-4"></div>
        <div className="flex gap-4 mb-6">
          <div className="h-4 bg-slate-200 rounded-lg w-1/5"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-1/5"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-1/5"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-slate-200 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 text-rose-700 p-6 rounded-b-2xl border-x border-b border-rose-200 flex justify-between items-center">
        <p className="font-semibold text-sm">Error: {error}</p>
        <button onClick={onClose} className="text-rose-500 hover:text-rose-700 p-1 rounded-lg">
          <X size={20} />
        </button>
      </div>
    );
  }

  if (!details) return null;

  const { session, attendanceRecords } = details;

  return (
    <div className="bg-white p-6 rounded-b-2xl border-x border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" /> Attendance Report
          </h3>
          <div className="text-sm text-slate-600 mt-2 space-y-1.5">
            <p><span className="font-bold text-slate-700">Subject:</span> {session.subject?.name} ({session.subject?.code})</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <p><span className="font-bold text-slate-700">Date:</span> {new Date(session.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p><span className="font-bold text-slate-700">Class:</span> {session.batch.branch} {session.batch.year}-{session.batch.division} {session.batch.name ? `(Batch ${session.batch.name})` : ''}</p>
              <p><span className="font-bold text-slate-700">Type:</span> <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{session.type}</span></p>
            </div>
            <div className="flex gap-6 mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <p className="text-slate-700 text-xs font-medium">Total: <span className="font-bold text-slate-900 text-sm ml-1">{session.totalStudents}</span></p>
              <p className="text-emerald-700 text-xs font-medium">Present: <span className="font-bold text-emerald-700 text-sm ml-1">{session.presentCount}</span></p>
              <p className="text-rose-700 text-xs font-medium">Absent: <span className="font-bold text-rose-700 text-sm ml-1">{session.absentCount}</span></p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-slate-200 rounded-xl custom-scrollbar">
        <table className="w-full text-sm text-left text-slate-700">
          <thead className="text-xs text-slate-600 uppercase bg-slate-50 font-bold sticky top-0 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-16 text-center">#</th>
              <th className="px-4 py-3">Roll No</th>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {attendanceRecords.map((record, index) => (
              <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{record.rollNo}</td>
                <td className="px-4 py-3 text-slate-800">{record.studentName}</td>
                <td className="px-4 py-3">
                  {record.status === 'present' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle size={14} /> Present
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle size={14} /> Absent
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <Download size={16} /> PDF
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <Download size={16} /> Excel
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 border border-blue-600 rounded-xl hover:bg-blue-700 shadow-xs transition-colors">
          <Edit2 size={16} /> Edit Attendance
        </button>
      </div>
    </div>
  );
};

export default AttendanceDetailPanel;
