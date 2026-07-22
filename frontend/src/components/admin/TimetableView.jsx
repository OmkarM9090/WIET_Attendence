import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, User, Users, Clock, Calendar, Edit2, Trash2, Eye, MapPin } from 'lucide-react';

export default function TimetableView({ 
  assignments, 
  onView, 
  onEdit, 
  onDelete, 
  deleteLoading 
}) {
  const [expandedTeachers, setExpandedTeachers] = useState({});
  const [expandedDivisions, setExpandedDivisions] = useState({});

  const toggleTeacher = (tId) => {
    setExpandedTeachers(prev => ({ ...prev, [tId]: !prev[tId] }));
  };

  const toggleDivision = (dKey) => {
    setExpandedDivisions(prev => ({ ...prev, [dKey]: !prev[dKey] }));
  };

  const groupedData = useMemo(() => {
    if (!assignments || !assignments.length) return [];

    const groups = {};
    assignments.forEach(assignment => {
      const teacherId = assignment.teacherId?._id || "unassigned";
      const teacherName = assignment.teacherId?.name || "Not Assigned";
      
      if (!groups[teacherId]) {
        groups[teacherId] = {
          id: teacherId,
          name: teacherName,
          email: assignment.teacherId?.email || "",
          divisions: {},
          totalAssignments: 0
        };
      }

      const divKey = `Year ${assignment.year || "-"} (Div ${assignment.division || "-"})`;
      const divUniqueKey = `${teacherId}-${divKey}`;
      
      if (!groups[teacherId].divisions[divUniqueKey]) {
        groups[teacherId].divisions[divUniqueKey] = {
          key: divUniqueKey,
          label: divKey,
          branchName: assignment.branchId?.name || "N/A",
          assignments: []
        };
      }

      groups[teacherId].divisions[divUniqueKey].assignments.push(assignment);
      groups[teacherId].totalAssignments++;
    });

    // Convert to arrays and sort
    const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    
    return Object.values(groups).map(teacher => {
      const sortedDivisions = Object.values(teacher.divisions).map(div => {
        div.assignments.sort((a, b) => {
          const dayA = DAY_ORDER.indexOf(a.dayOfWeek);
          const dayB = DAY_ORDER.indexOf(b.dayOfWeek);
          if (dayA !== dayB) return dayA - dayB;
          return (a.startTime || "").localeCompare(b.startTime || "");
        });
        return div;
      });
      
      // Sort divisions alphabetically
      sortedDivisions.sort((a, b) => a.label.localeCompare(b.label));
      return { ...teacher, divisions: sortedDivisions };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments]);

  if (!groupedData.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {groupedData.map(teacher => {
        const isTeacherExpanded = expandedTeachers[teacher.id];

        return (
          <div key={teacher.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-200">
            {/* Teacher Header */}
            <div 
              onClick={() => toggleTeacher(teacher.id)}
              className="flex cursor-pointer items-center justify-between bg-slate-50 p-4 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{teacher.name}</h3>
                  <p className="text-xs text-slate-500">{teacher.email || "No email provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {teacher.totalAssignments} {teacher.totalAssignments === 1 ? 'Assignment' : 'Assignments'}
                </span>
                <span className="sm:hidden rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  {teacher.totalAssignments}
                </span>
                {isTeacherExpanded ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}
              </div>
            </div>

            {/* Teacher Content (Divisions) */}
            {isTeacherExpanded && (
              <div className="border-t border-slate-200 p-3 sm:p-4 bg-white">
                <div className="flex flex-col gap-3">
                  {teacher.divisions.map(division => {
                    const isDivExpanded = expandedDivisions[division.key];

                    return (
                      <div key={division.key} className="rounded-lg border border-slate-200 overflow-hidden">
                        {/* Division Header */}
                        <div 
                          onClick={() => toggleDivision(division.key)}
                          className="flex cursor-pointer items-center justify-between bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                              <Users size={16} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-700">{division.label}</h4>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin size={12}/> {division.branchName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              {division.assignments.length} slots
                            </span>
                            {isDivExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                          </div>
                        </div>

                        {/* Division Content (Assignments) */}
                        {isDivExpanded && (
                          <div className="border-t border-slate-200 bg-white">
                            {/* Desktop Table View */}
                            <div className="hidden md:block w-full overflow-x-auto">
                              <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                                  <tr>
                                    <th className="px-4 py-3">Subject</th>
                                    <th className="px-4 py-3">Day & Time</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {division.assignments.map(a => (
                                    <tr key={a._id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-4 py-3">
                                        <div className="font-semibold text-slate-700">{a.subjectId?.name || "N/A"}</div>
                                        <div className="text-xs text-slate-500">{a.subjectId?.code || ""}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                          <Calendar size={14} className="text-blue-500"/>
                                          <span className="capitalize">{a.dayOfWeek?.toLowerCase()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                          <Clock size={14}/>
                                          {a.startTime} - {a.endTime}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                                          a.sessionType === "PRACTICAL" 
                                            ? "bg-amber-100 text-amber-700" 
                                            : "bg-indigo-100 text-indigo-700"
                                        }`}>
                                          {a.sessionType}
                                          {a.sessionType === "PRACTICAL" && a.batchId?.name && ` (${a.batchId.name})`}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <button onClick={(e) => { e.stopPropagation(); onView(a); }} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-md transition-colors" title="View Details">
                                            <Eye size={16} />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); onEdit(a); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Edit">
                                            <Edit2 size={16} />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); onDelete(a._id); }} disabled={deleteLoading === a._id} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50" title="Delete">
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden flex flex-col divide-y divide-slate-100">
                              {division.assignments.map(a => (
                                <div key={a._id} className="p-3 sm:p-4 flex flex-col gap-3">
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <div className="font-semibold text-sm sm:text-base text-slate-700 leading-tight">{a.subjectId?.name || "N/A"}</div>
                                      <div className="text-xs text-slate-500 mt-0.5">{a.subjectId?.code || ""}</div>
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold ${
                                      a.sessionType === "PRACTICAL" 
                                        ? "bg-amber-100 text-amber-700" 
                                        : "bg-indigo-100 text-indigo-700"
                                    }`}>
                                      {a.sessionType}
                                      {a.sessionType === "PRACTICAL" && a.batchId?.name && ` (${a.batchId.name})`}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-1">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700">
                                        <Calendar size={14} className="text-blue-500"/>
                                        <span className="capitalize">{a.dayOfWeek?.toLowerCase()}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
                                        <Clock size={14}/>
                                        {a.startTime} - {a.endTime}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <button onClick={(e) => { e.stopPropagation(); onView(a); }} className="p-1.5 sm:p-2 text-sky-600 bg-sky-50 rounded-md active:bg-sky-100 transition-colors">
                                        <Eye size={16} />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); onEdit(a); }} className="p-1.5 sm:p-2 text-amber-600 bg-amber-50 rounded-md active:bg-amber-100 transition-colors">
                                        <Edit2 size={16} />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); onDelete(a._id); }} disabled={deleteLoading === a._id} className="p-1.5 sm:p-2 text-red-600 bg-red-50 rounded-md active:bg-red-100 transition-colors disabled:opacity-50">
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
