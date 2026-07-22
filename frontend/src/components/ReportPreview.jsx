/**
 * REPORT PREVIEW COMPONENT
 * Shows session summary and WhatsApp report text with copy/share actions.
 */

import { theme } from "../styles/theme";
import Button from "./Button";

export default function ReportPreview({ 
  reportText, 
  onCopy, 
  onShare, 
  onUpdateExcel, 
  isUpdatingExcel, 
  onDownloadExcel,
  isDownloadingExcel,
  attendanceId 
}) {
  return (
    <div
      style={{
        marginTop: "24px",
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "12px",
        padding: "24px",
        boxShadow: theme.shadows.sm,
      }}
    >
      <h3
        style={{
          fontSize: "16px",
          fontWeight: "600",
          color: theme.colors.text.primary,
          marginBottom: "16px",
        }}
      >
        ✅ WhatsApp Report Preview
      </h3>

      <div
        style={{
          backgroundColor: theme.colors.neutral[50],
          border: `1px solid ${theme.colors.border}`,
          borderRadius: "8px",
          padding: "16px",
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          fontSize: "13px",
          color: theme.colors.text.primary,
          lineHeight: "1.6",
        }}
      >
        {reportText}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:justify-end w-full border-t border-slate-200 pt-5">
        {attendanceId && onUpdateExcel && (
          <button 
            onClick={onUpdateExcel}
            disabled={isUpdatingExcel || isDownloadingExcel}
            className={`
              flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 shadow-sm
              ${isUpdatingExcel || isDownloadingExcel 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 hover:shadow-md'}
              flex-1 sm:flex-none
            `}
          >
            {isUpdatingExcel ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Updating...
              </>
            ) : "📊 Update Excel"}
          </button>
        )}
        {attendanceId && onDownloadExcel && (
          <button 
            onClick={onDownloadExcel}
            disabled={isDownloadingExcel || isUpdatingExcel}
            className={`
              flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 shadow-sm
              ${isDownloadingExcel || isUpdatingExcel 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 hover:shadow-md'}
              flex-1 sm:flex-none
            `}
          >
            {isDownloadingExcel ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Downloading...
              </>
            ) : "⬇️ Download Excel"}
          </button>
        )}
        <button 
          onClick={onCopy} 
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 shadow-sm bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-md"
        >
          📋 Copy
        </button>
        <button 
          onClick={onShare} 
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 shadow-md bg-[#25D366] hover:bg-[#1fbd59] text-white hover:shadow-lg hover:-translate-y-0.5"
        >
          💬 Share WhatsApp
        </button>
      </div>
    </div>
  );
}
