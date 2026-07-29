import { Inbox } from "lucide-react";

export default function Table({ columns, data, actions, emptyMessage = "No records found" }) {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600 select-none whitespace-nowrap"
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-600 select-none whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 bg-white">
            {safeData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="p-3 rounded-full bg-slate-50 border border-slate-100">
                      <Inbox size={28} className="text-slate-400 stroke-[1.5]" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600 mt-1">{emptyMessage}</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters or search terms</p>
                  </div>
                </td>
              </tr>
            ) : (
              safeData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="transition-colors duration-150 hover:bg-slate-50/80 group"
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-6 py-4 text-sm text-slate-800 font-medium whitespace-nowrap"
                    >
                      {column.render
                        ? column.render(row[column.accessor], row, rowIndex)
                        : row[column.accessor]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-2">
                        {actions(row, rowIndex)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
