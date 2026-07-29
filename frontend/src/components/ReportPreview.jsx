import { MessageSquare, Copy, Download, FileSpreadsheet, CheckCircle2, Loader2 } from "lucide-react";

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
    <div className="mt-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
          <CheckCircle2 size={20} />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          WhatsApp Report Preview
        </h3>
      </div>

      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
        {reportText}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:justify-end w-full border-t border-slate-100 pt-5">
        {attendanceId && onUpdateExcel && (
          <button 
            onClick={onUpdateExcel}
            disabled={isUpdatingExcel || isDownloadingExcel}
            className={`
              flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-xs
              ${isUpdatingExcel || isDownloadingExcel 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300'}
              flex-1 sm:flex-none
            `}
          >
            {isUpdatingExcel ? (
              <>
                <Loader2 size={16} className="animate-spin text-slate-400" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet size={16} className="text-emerald-600" />
                <span>Update Excel</span>
              </>
            )}
          </button>
        )}

        {attendanceId && onDownloadExcel && (
          <button 
            onClick={onDownloadExcel}
            disabled={isDownloadingExcel || isUpdatingExcel}
            className={`
              flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-xs
              ${isDownloadingExcel || isUpdatingExcel 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300'}
              flex-1 sm:flex-none
            `}
          >
            {isDownloadingExcel ? (
              <>
                <Loader2 size={16} className="animate-spin text-slate-400" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download size={16} className="text-blue-600" />
                <span>Download Excel</span>
              </>
            )}
          </button>
        )}

        <button 
          onClick={onCopy} 
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-xs bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/80"
        >
          <Copy size={16} className="text-slate-600" />
          <span>Copy Text</span>
        </button>

        <button 
          onClick={onShare} 
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
        >
          <MessageSquare size={16} />
          <span>Share WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
