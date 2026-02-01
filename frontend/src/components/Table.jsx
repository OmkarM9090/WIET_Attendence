/**
 * TABLE COMPONENT
 * Reusable data table with sorting, actions
 * Responsive and theme-controlled
 */

import { theme } from "../styles/theme";

export default function Table({ columns, data, actions, emptyMessage = "No data available" }) {
  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];
  
  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead
            style={{
              backgroundColor: theme.colors.neutral[50],
              borderBottom: `2px solid ${theme.colors.border}`,
            }}
          >
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: theme.colors.text.secondary }}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th
                  className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y" style={{ borderColor: theme.colors.border }}>
            {safeData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-12 text-center"
                  style={{ color: theme.colors.text.secondary }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">📭</span>
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              safeData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-6 py-4 text-sm"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {column.render
                        ? column.render(row[column.accessor], row, rowIndex)
                        : row[column.accessor]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
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
