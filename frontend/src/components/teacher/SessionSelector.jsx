import React, { useMemo } from 'react';
import { Calendar, Clock, MapPin, Users, BookOpen } from 'lucide-react';

const DAY_ORDER = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function SessionSelector({ assignments, selectedAssignmentId, onSelect }) {
  const groupedAndSorted = useMemo(() => {
    if (!assignments || !assignments.length) return [];

    // 1. Find today's day
    const todayIndex = new Date().getDay();
    const todayName = DAY_ORDER[todayIndex];

    // 2. Group assignments by day
    const byDay = {};
    assignments.forEach(a => {
      const day = a.dayOfWeek;
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(a);
    });

    // 3. For each day, group by division/class
    const formattedDays = Object.keys(byDay).map(day => {
      const dayAssignments = byDay[day];
      
      const byDiv = {};
      dayAssignments.forEach(a => {
        const divKey = `Year ${a.year || "-"} - Div ${a.division || "-"}`;
        if (!byDiv[divKey]) byDiv[divKey] = { label: divKey, assignments: [] };
        byDiv[divKey].assignments.push(a);
      });

      // Sort assignments inside division by time
      Object.values(byDiv).forEach(div => {
        div.assignments.sort((x, y) => (x.startTime || "").localeCompare(y.startTime || ""));
      });

      // Sort divisions
      const sortedDivs = Object.values(byDiv).sort((x, y) => x.label.localeCompare(y.label));

      return {
        day,
        isToday: day === todayName,
        divisions: sortedDivs
      };
    });

    // 4. Sort days: Today first, then the rest in standard order
    formattedDays.sort((a, b) => {
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      return DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
    });

    return formattedDays;
  }, [assignments]);

  if (!assignments || !assignments.length) return null;

  return (
    <div className="flex flex-col gap-5 w-full">
      {groupedAndSorted.map(dayGroup => (
        <div key={dayGroup.day} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h4 className={`text-base sm:text-lg font-bold flex items-center gap-2 pb-2 ${dayGroup.isToday ? 'text-blue-700' : 'text-slate-800'}`}>
              <Calendar size={18} className={dayGroup.isToday ? 'text-blue-600' : 'text-slate-500'}/>
              {dayGroup.isToday ? `Today (${dayGroup.day})` : dayGroup.day}
            </h4>
            {dayGroup.isToday && <span className="text-[10px] sm:text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full animate-pulse shadow-sm">Current Day</span>}
          </div>

          <div className="flex flex-col gap-4 pl-3 sm:pl-4 border-l-2 border-slate-200 ml-2 mt-1">
            {dayGroup.divisions.map(div => (
              <div key={div.label} className="ml-1 mb-2">
                <div className="inline-flex items-center gap-2 mb-3 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md shadow-sm border border-slate-200">
                  <Users size={14} className="text-slate-500" />
                  <h5 className="text-[12px] sm:text-sm font-bold uppercase tracking-wide">
                    {div.label}
                  </h5>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {div.assignments.map(a => {
                    const isSelected = selectedAssignmentId === a._id;
                    const isPractical = a.sessionType === "PRACTICAL";
                    
                    return (
                      <div
                        key={a._id}
                        onClick={() => onSelect(a._id)}
                        className={`relative cursor-pointer rounded-xl border p-3.5 transition-all duration-300 flex flex-col ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50/70 shadow-md ring-2 ring-blue-200 transform scale-[1.02]' 
                            : 'border-slate-200 bg-white shadow-sm hover:border-blue-400 hover:shadow-md hover:bg-slate-50 hover:-translate-y-1'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 text-blue-600">
                            <div className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-100">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="font-extrabold text-slate-800 text-sm pr-4 leading-tight truncate" title={a.subject?.name}>{a.subject?.name || "N/A"}</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 mb-3 font-semibold">
                          <span className={`px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ${isPractical ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                            <BookOpen size={10} />
                            {a.sessionType}
                            {isPractical && a.batch?.name && ` (${a.batch.name})`}
                          </span>
                          <span className="text-slate-300 font-bold">•</span>
                          <span className="truncate">{a.subject?.code || ""}</span>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100/80">
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-700 font-bold">
                            <Clock size={14} className={isSelected ? 'text-blue-500' : 'text-slate-400'} />
                            {a.startTime} - {a.endTime}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[40%] justify-end" title={a.branch?.code || a.branch?.name}>
                            <MapPin size={10} className="text-slate-400 shrink-0" />
                            <span className="truncate">{a.branch?.code || a.branch?.name || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
