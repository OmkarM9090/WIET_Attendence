import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, AlertTriangle, UserCheck } from 'lucide-react';
import FormInput from '../FormInput';
import Button from '../Button';
import axiosInstance from '../../utils/axios';

export default function ProxyClassForm({ myAssignments, onContinue, onCancel }) {
  const [proxyType, setProxyType] = useState('substitute'); // 'substitute' | 'extra'
  
  // Substitute State
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDiv, setSelectedDiv] = useState('');
  
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [substituteReason, setSubstituteReason] = useState('');
  
  // Extra Lecture State
  const [selectedMyAssignmentId, setSelectedMyAssignmentId] = useState('');
  const [extraReason, setExtraReason] = useState('');
  
  const [error, setError] = useState('');

  // Fetch branches on mount (for substitute)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axiosInstance.get('/admin/branches');
        setBranches(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch branches", err);
      }
    };
    fetchBranches();
  }, []);

  // Fetch subjects when class selected for substitute
  useEffect(() => {
    if (proxyType === 'substitute' && selectedBranch && selectedYear && selectedDiv) {
      const fetchSubjects = async () => {
        try {
          setLoadingSubjects(true);
          setSubjects([]);
          setSelectedSubjectId('');
          const res = await axiosInstance.get('/attendance/subjects-for-class', {
            params: { branchId: selectedBranch, year: selectedYear, division: selectedDiv }
          });
          setSubjects(res.data?.data || []);
        } catch (err) {
          setError(err.response?.data?.message || "Failed to fetch subjects");
        } finally {
          setLoadingSubjects(false);
        }
      };
      fetchSubjects();
    }
  }, [proxyType, selectedBranch, selectedYear, selectedDiv]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (proxyType === 'substitute') {
      if (!selectedBranch || !selectedYear || !selectedDiv || !selectedSubjectId || !substituteReason) {
        setError('All fields are required for substitute proxy');
        return;
      }
      
      const branchObj = branches.find(b => b._id === selectedBranch);
      const subjectObj = subjects.find(s => `${s._id}_${s.sessionType}` === selectedSubjectId);
      
      if (!subjectObj) return;

      const mockAssignment = {
        _id: 'proxy_substitute',
        isProxy: true,
        isProxyPlaceholder: false,
        isSubstitute: true,
        substituteReason,
        branch: branchObj,
        year: parseInt(selectedYear),
        division: selectedDiv,
        subject: { _id: subjectObj._id, name: subjectObj.name, code: subjectObj.code },
        sessionType: subjectObj.sessionType,
        originalTeacherId: subjectObj.originalTeacherId
      };
      onContinue(mockAssignment);
    } else {
      if (!selectedMyAssignmentId || !extraReason) {
        setError('Please select an assignment and provide a reason');
        return;
      }
      
      const assignmentObj = myAssignments.find(a => a._id === selectedMyAssignmentId);
      if (!assignmentObj) return;

      const mockAssignment = {
        _id: 'proxy_extra',
        isProxy: true,
        isProxyPlaceholder: false,
        isExtraLecture: true,
        extraLectureReason: extraReason,
        branch: assignmentObj.branch,
        year: assignmentObj.year,
        division: assignmentObj.division,
        subject: assignmentObj.subject,
        sessionType: assignmentObj.sessionType,
        batch: assignmentObj.batch
      };
      onContinue(mockAssignment);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs mb-5">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
          <ArrowLeft size={20} className="text-slate-500" />
        </button>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BookOpen size={22} className="text-indigo-600" />
          Proxy & Extra Class Setup
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-semibold">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">Select Proxy Type</label>
          <div className="flex gap-4">
            <label className={`flex-1 flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${proxyType === 'substitute' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'}`}>
              <input type="radio" name="proxyType" className="sr-only" checked={proxyType === 'substitute'} onChange={() => { setProxyType('substitute'); setError(''); }} />
              <span className="font-bold text-slate-900 mb-1">Substitute Lecture</span>
              <span className="text-xs text-slate-500 font-medium">Taking a lecture for an absent teacher in another class.</span>
            </label>
            <label className={`flex-1 flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${proxyType === 'extra' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'}`}>
              <input type="radio" name="proxyType" className="sr-only" checked={proxyType === 'extra'} onChange={() => { setProxyType('extra'); setError(''); }} />
              <span className="font-bold text-slate-900 mb-1">Extra Lecture</span>
              <span className="text-xs text-slate-500 font-medium">Taking an extra lecture for your own assigned subject.</span>
            </label>
          </div>
        </div>

        {proxyType === 'substitute' ? (
          <div className="space-y-5 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Branch</label>
                <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none cursor-pointer">
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Year</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none cursor-pointer">
                  <option value="">Select Year</option>
                  {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Division</label>
                <select value={selectedDiv} onChange={(e) => setSelectedDiv(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none cursor-pointer">
                  <option value="">Select Div</option>
                  {['A','B','C'].map(d => <option key={d} value={d}>Division {d}</option>)}
                </select>
              </div>
            </div>
            
            {(selectedBranch && selectedYear && selectedDiv) && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Subject (Original Timetable)</label>
                <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} disabled={loadingSubjects} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none cursor-pointer">
                  <option value="">{loadingSubjects ? "Loading..." : "Select Subject to substitute"}</option>
                  {subjects.map(s => (
                    <option key={`${s._id}_${s.sessionType}`} value={`${s._id}_${s.sessionType}`}>
                      {s.name} ({s.sessionType}) - Original: {s.originalTeacherName || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <FormInput
              label="Reason for Substitute"
              placeholder="E.g., Prof. Sharma is on leave"
              value={substituteReason}
              onChange={(e) => setSubstituteReason(e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="space-y-5 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Select Your Subject</label>
              <select value={selectedMyAssignmentId} onChange={(e) => setSelectedMyAssignmentId(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none cursor-pointer">
                <option value="">Select from your active assignments</option>
                {myAssignments.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.subject?.name} - {a.branch?.code} Y{a.year} Div {a.division} ({a.sessionType})
                  </option>
                ))}
              </select>
            </div>
            <FormInput
              label="Reason for Extra Class"
              placeholder="E.g., Syllabus completion, Revision"
              value={extraReason}
              onChange={(e) => setExtraReason(e.target.value)}
              required
            />
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button type="submit" variant="primary" className="w-full sm:w-auto">
            <UserCheck size={18} className="mr-2 inline" />
            Continue to Attendance
          </Button>
        </div>
      </form>
    </div>
  );
}
