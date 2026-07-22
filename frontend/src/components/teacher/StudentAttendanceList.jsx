import React from 'react';
import { Users, UserCheck, UserX, AlertCircle, Plus } from 'lucide-react';

export default function StudentAttendanceList({
  students,
  selectedAbsentStudents,
  toggleAbsentStudent,
  selectedAssignment,
  rollNumberInput,
  setRollNumberInput,
  handleAddRollNumbers,
  rollNumberError
}) {
  const isPractical = selectedAssignment?.sessionType === "PRACTICAL";
  const absentCount = selectedAbsentStudents.length;
  const presentCount = students.length - absentCount;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in mt-4">
      {/* Top Section: Quick Add & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Quick Add Card */}
        <div className="col-span-1 lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <label className="block text-sm font-bold text-slate-700 mb-3">
            Quick Add Absent (Roll Numbers)
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. 12 34 35 or 12, 34"
              value={rollNumberInput}
              onChange={(e) => setRollNumberInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddRollNumbers(); }}
              className="flex-1 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block px-3 py-2.5 outline-none transition-all"
            />
            <button
              onClick={handleAddRollNumbers}
              disabled={!rollNumberInput.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          {rollNumberError ? (
            <p className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-red-600">
              <AlertCircle size={14} />
              {rollNumberError}
            </p>
          ) : (
            <p className="mt-3 text-xs font-medium text-slate-400 italic">
              💡 Separate multiple roll numbers with commas or spaces
            </p>
          )}
        </div>

        {/* Stats Card */}
        <div className="col-span-1 lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-center gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <Users size={16} className="text-slate-400" /> Total Students
            </span>
            <span className="text-lg font-black text-slate-800">{students.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 sm:p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <UserCheck size={14} /> Present
              </span>
              <span className="text-lg font-black text-emerald-600">{presentCount}</span>
            </div>
            <div className="flex-1 bg-red-50 border border-red-100 rounded-lg p-2.5 sm:p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                <UserX size={14} /> Absent
              </span>
              <span className="text-lg font-black text-red-600">{absentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Student List Grid (Cards on Mobile, List on Desktop) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header - Hidden on small screens */}
        <div className="hidden md:grid grid-cols-12 gap-4 bg-slate-50/80 border-b border-slate-200 p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-center">Roll No</div>
          <div className={isPractical ? "col-span-7" : "col-span-9"}>Student Name</div>
          {isPractical && <div className="col-span-2 text-center">Batch</div>}
        </div>

        {/* List Body */}
        <div className="flex flex-col max-h-[550px] overflow-y-auto divide-y divide-slate-100">
          {students.map((student, idx) => {
            const isAbsent = selectedAbsentStudents.includes(student._id);
            return (
              <div 
                key={student._id}
                onClick={() => toggleAbsentStudent(student._id)}
                className={`group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 md:items-center cursor-pointer transition-all duration-200 hover:bg-slate-50 ${isAbsent ? 'bg-red-50/40 hover:bg-red-50/60' : ''}`}
              >
                {/* Mobile View Layout (Header) */}
                <div className="md:hidden flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-md border transition-colors ${isAbsent ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300 bg-slate-50'}`}>
                      {isAbsent && <UserX size={14} />}
                      {!isAbsent && <UserCheck size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                    <span className="text-sm font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">Roll: {student.rollNo ?? "--"}</span>
                  </div>
                  {isPractical && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase tracking-wide">
                      {student.batch || "N/A"}
                    </span>
                  )}
                </div>
                
                {/* Desktop Checkbox Status */}
                <div className="hidden md:flex col-span-1 justify-center">
                  <div className={`flex items-center justify-center w-5 h-5 rounded border transition-colors ${isAbsent ? 'bg-red-500 border-red-500 text-white shadow-inner' : 'border-slate-300 bg-slate-50 group-hover:border-slate-400 group-hover:bg-white'}`}>
                    {isAbsent && <UserX size={12} strokeWidth={3} />}
                  </div>
                </div>

                {/* Desktop Roll No */}
                <div className="hidden md:block col-span-2 text-center text-sm font-extrabold text-slate-700">
                  {student.rollNo ?? "--"}
                </div>

                {/* Name */}
                <div className={`${isPractical ? 'col-span-7' : 'col-span-9'} flex items-center ml-9 md:ml-0 mt-1 md:mt-0`}>
                  <span className={`text-sm sm:text-sm font-bold transition-all duration-200 ${isAbsent ? 'text-red-600 line-through decoration-red-300 decoration-2' : 'text-slate-800'}`}>
                    {student.name || "Unnamed Student"}
                  </span>
                </div>

                {/* Desktop Batch */}
                {isPractical && (
                  <div className="hidden md:flex col-span-2 justify-center">
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                      {student.batch || "N/A"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
