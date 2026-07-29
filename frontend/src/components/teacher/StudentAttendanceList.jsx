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
    <div className="flex flex-col gap-6 w-full mt-4">
      {/* Top Section: Quick Add & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Quick Add Card */}
        <div className="col-span-1 lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Quick Add Absent (Roll Numbers)
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. 12 34 35 or 12, 34"
              value={rollNumberInput}
              onChange={(e) => setRollNumberInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddRollNumbers(); }}
              className="flex-1 w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 block px-4 py-2.5 outline-none transition-all shadow-xs"
            />
            <button
              onClick={handleAddRollNumbers}
              disabled={!rollNumberInput.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-xs"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          {rollNumberError ? (
            <p className="flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-rose-600">
              <AlertCircle size={14} />
              {rollNumberError}
            </p>
          ) : (
            <p className="mt-2.5 text-xs font-medium text-slate-400">
              Separate multiple roll numbers with commas or spaces
            </p>
          )}
        </div>

        {/* Stats Card */}
        <div className="col-span-1 lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Users size={16} className="text-slate-400" /> Total Students
            </span>
            <span className="text-xl font-extrabold text-slate-900">{students.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <UserCheck size={14} /> Present
              </span>
              <span className="text-xl font-extrabold text-emerald-700">{presentCount}</span>
            </div>
            <div className="flex-1 bg-rose-50/60 border border-rose-200/80 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <UserX size={14} /> Absent
              </span>
              <span className="text-xl font-extrabold text-rose-700">{absentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Student List Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 bg-slate-50/90 border-b border-slate-200 px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider select-none">
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-center">Roll No</div>
          <div className={isPractical ? "col-span-7" : "col-span-9"}>Student Name</div>
          {isPractical && <div className="col-span-2 text-center">Batch</div>}
        </div>

        {/* List Body */}
        <div className="flex flex-col max-h-[550px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
          {students.map((student) => {
            const isAbsent = selectedAbsentStudents.includes(student._id);
            return (
              <div 
                key={student._id}
                onClick={() => toggleAbsentStudent(student._id)}
                className={`group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-3.5 md:items-center cursor-pointer transition-all duration-150 ${isAbsent ? 'bg-rose-50/50 hover:bg-rose-50/80' : 'hover:bg-slate-50'}`}
              >
                {/* Mobile View Layout */}
                <div className="md:hidden flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-lg border transition-colors ${isAbsent ? 'bg-rose-600 border-rose-600 text-white shadow-xs' : 'border-slate-300 bg-slate-50'}`}>
                      {isAbsent && <UserX size={14} />}
                      {!isAbsent && <UserCheck size={14} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">Roll: {student.rollNo ?? "--"}</span>
                  </div>
                  {isPractical && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wide">
                      {student.batch || "N/A"}
                    </span>
                  )}
                </div>
                
                {/* Desktop Checkbox Status */}
                <div className="hidden md:flex col-span-1 justify-center">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-lg border transition-colors ${isAbsent ? 'bg-rose-600 border-rose-600 text-white shadow-xs' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                    {isAbsent && <UserX size={12} strokeWidth={3} />}
                  </div>
                </div>

                {/* Desktop Roll No */}
                <div className="hidden md:block col-span-2 text-center text-sm font-extrabold text-slate-800 font-mono">
                  {student.rollNo ?? "--"}
                </div>

                {/* Name */}
                <div className={`${isPractical ? 'col-span-7' : 'col-span-9'} flex items-center ml-9 md:ml-0 mt-1 md:mt-0`}>
                  <span className={`text-sm font-semibold transition-all duration-150 ${isAbsent ? 'text-rose-700 line-through decoration-rose-300 decoration-2' : 'text-slate-900'}`}>
                    {student.name || "Unnamed Student"}
                  </span>
                </div>

                {/* Desktop Batch */}
                {isPractical && (
                  <div className="hidden md:flex col-span-2 justify-center">
                    <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
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
