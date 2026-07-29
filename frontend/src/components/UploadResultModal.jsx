import React from 'react';
import Modal from "./Modal";
import Button from "./Button";
import { CheckCircle2, XCircle, AlertTriangle, AlertCircle, Lightbulb } from 'lucide-react';

export default function UploadResultModal({ isOpen, onClose, result, type = 'student' }) {
  if (!result) return null;

  const { summary, failedRows } = result;
  const total = summary?.total || 0;
  const success = summary?.successful || 0;
  const failed = summary?.failed || 0;

  let state = 'success';
  if (failed > 0 && success > 0) state = 'warning';
  if (failed > 0 && success === 0) state = 'error';

  const isStudent = type === 'student';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Results Summary"
      size="lg"
    >
      <div className="space-y-6 max-w-2xl mx-auto">
        
        {/* Status Alert */}
        {state === 'success' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-emerald-900 font-bold">Upload Successful!</h4>
              <p className="text-sm text-emerald-800 mt-1">
                All {success} {isStudent ? 'students' : 'teachers'} were processed and created successfully.
              </p>
            </div>
          </div>
        )}

        {state === 'warning' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-900 font-bold">Partial Success</h4>
              <p className="text-sm text-amber-800 mt-1">
                {success} {isStudent ? 'students' : 'teachers'} were uploaded, but {failed} failed due to errors.
              </p>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
            <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-rose-900 font-bold">Upload Failed</h4>
              <p className="text-sm text-rose-800 mt-1">
                None of the records could be uploaded. Please review the issues below.
              </p>
            </div>
          </div>
        )}

        {/* Summary Metric Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">Total</h4>
            <p className="text-3xl font-extrabold text-slate-900">{total}</p>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-center">
            <h4 className="text-xs uppercase tracking-wider font-bold text-emerald-700 mb-1">Created</h4>
            <p className="text-3xl font-extrabold text-emerald-700">{success}</p>
          </div>
          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 text-center">
            <h4 className="text-xs uppercase tracking-wider font-bold text-rose-700 mb-1">Failed</h4>
            <p className="text-3xl font-extrabold text-rose-700">{failed}</p>
          </div>
        </div>

        {/* Failed Rows Detail */}
        {failed > 0 && failedRows && failedRows.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Failed Records ({failedRows.length})
            </h4>
            
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {failedRows.map((fail, idx) => (
                <div key={idx} className="bg-rose-50/50 border border-rose-200/80 p-3 rounded-xl flex flex-col sm:flex-row sm:items-start gap-2">
                  <div className="bg-rose-100 text-rose-800 font-mono text-xs px-2.5 py-1 rounded-md inline-block whitespace-nowrap self-start font-bold">
                    Row {fail.rowNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {fail.data?.name || "Unknown Name"} 
                      <span className="text-slate-500 font-medium text-xs ml-2">
                        ({fail.data?.email || "No Email"})
                      </span>
                    </p>
                    <p className="text-xs text-rose-700 mt-1 font-semibold bg-rose-100/60 px-2 py-0.5 rounded-md inline-block">
                      {fail.simpleMessage || fail.reason || "Unknown validation error"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-4 text-xs text-slate-700 flex items-start gap-2.5">
              <Lightbulb size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Tip:</strong> Fix these specific rows in your original Excel file, remove the already processed rows to prevent duplicates, and re-upload.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="primary" className="px-6">
            Got it, Thanks!
          </Button>
        </div>
      </div>
    </Modal>
  );
}
