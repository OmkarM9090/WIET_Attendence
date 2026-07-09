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
      <div className="bg-gray-50 p-6 rounded-b-lg border-x border-b border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="flex gap-4 mb-6">
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-b-lg border-x border-b border-red-200 flex justify-between items-center">
        <p>Error: {error}</p>
        <button onClick={onClose} className="text-red-500 hover:text-red-700">
          <X size={20} />
        </button>
      </div>
    );
  }

  if (!details) return null;

  const { session, attendanceRecords } = details;

  return (
    <div className="bg-white p-6 rounded-b-lg border-x border-b border-indigo-100 shadow-inner transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
            📋 Attendance Report
          </h3>
          <div className="text-sm text-gray-600 mt-2 space-y-1">
            <p><span className="font-medium text-gray-700">Subject:</span> {session.subject?.name} ({session.subject?.code})</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <p><span className="font-medium text-gray-700">Date:</span> {new Date(session.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p><span className="font-medium text-gray-700">Class:</span> {session.batch.branch} {session.batch.year}-{session.batch.division} {session.batch.name ? `(Batch ${session.batch.name})` : ''}</p>
              <p><span className="font-medium text-gray-700">Type:</span> <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-800">{session.type}</span></p>
            </div>
            <div className="flex gap-4 mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-700">Total: <span className="font-bold">{session.totalStudents}</span></p>
              <p className="text-green-600">Present: <span className="font-bold">{session.presentCount}</span></p>
              <p className="text-red-600">Absent: <span className="font-bold">{session.absentCount}</span></p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-3 w-16 text-center">#</th>
              <th className="px-4 py-3">Roll No</th>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRecords.map((record, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-center">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{record.rollNo}</td>
                <td className="px-4 py-3">{record.studentName}</td>
                <td className="px-4 py-3">
                  {record.status === 'present' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle size={14} /> Present
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition-colors">
          <Download size={16} /> PDF
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition-colors">
          <Download size={16} /> Excel
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
          <Edit2 size={16} /> Edit Attendance
        </button>
      </div>
    </div>
  );
};

export default AttendanceDetailPanel;
