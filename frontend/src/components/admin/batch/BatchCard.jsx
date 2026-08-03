import React from "react";
import { Users, MapPin, Edit2, Trash2, Layers, ChevronRight, Hash, GitMerge } from "lucide-react";

export default function BatchCard({ batch, onEdit, onDelete, onViewStudents }) {
  const isMerged = batch.isMerged || batch.batchType === "merged";

  return (
    <div className="bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
              isMerged 
                ? "bg-purple-50 text-purple-700 border border-purple-200" 
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}>
              {isMerged ? <GitMerge size={18} /> : batch.name}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {batch.displayName || batch.name}
                </h3>
                {isMerged && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-purple-100 text-purple-800 border border-purple-200">
                    Merged
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isMerged ? `Divisions: ${batch.divisions?.join(", ")}` : `Division ${batch.division}`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(batch); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Edit Batch"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(batch); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Delete Batch"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2.5 my-3 text-xs">
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-700">
            <Users size={16} className="text-blue-600 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Students</span>
              <span className="font-extrabold text-slate-900 text-sm">{batch.studentCount || batch.students?.length || 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-700">
            <MapPin size={16} className="text-emerald-600 shrink-0" />
            <div className="truncate">
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Lab Room</span>
              <span className="font-bold text-slate-800 truncate block">{batch.labRoom || "Not set"}</span>
            </div>
          </div>
        </div>

        {/* Roll Ranges */}
        {batch.rollRanges && batch.rollRanges.length > 0 && (
          <div className="mb-4 bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
              <Hash size={12} className="text-slate-400" /> Roll Ranges
            </span>
            <div className="flex flex-wrap gap-1.5">
              {batch.rollRanges.map((range, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white text-slate-700 text-[11px] font-mono border border-slate-200 font-semibold shadow-2xs"
                >
                  {range.division ? `Div ${range.division}: ` : ""}{range.from}-{range.to}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Button */}
      <button
        onClick={() => onViewStudents(batch)}
        className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 border border-slate-200/80 hover:border-blue-600 shadow-2xs cursor-pointer"
      >
        <span>View Students & Manage</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
