import React from 'react';
import Modal from "./Modal";
import Button from "./Button";
import { CheckCircle2, XCircle, AlertTriangle, AlertCircle } from 'lucide-react';

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
      title="📊 Upload Results"
      size="xl"
    >
      <div className="space-y-6 max-w-2xl mx-auto">
        
        {/* Status Alert */}
        {state === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-green-800 font-bold">Upload Successful!</h4>
              <p className="text-sm text-green-700 mt-1">
                All {success} {isStudent ? 'students' : 'teachers'} were uploaded and created successfully.
              </p>
            </div>
          </div>
        )}

        {state === 'warning' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-800 font-bold">Partial Success</h4>
              <p className="text-sm text-amber-700 mt-1">
                {success} {isStudent ? 'students' : 'teachers'} were uploaded, but {failed} failed due to errors.
              </p>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-bold">Upload Failed</h4>
              <p className="text-sm text-red-700 mt-1">
                None of the records could be uploaded. Please check the errors below.
              </p>
            </div>
          </div>
        )}

        {/* Summary Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">Total</h4>
            <p className="text-3xl font-black text-slate-800">{total}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <h4 className="text-xs uppercase tracking-wider font-bold text-green-600 mb-1">Created</h4>
            <p className="text-3xl font-black text-green-700">{success}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <h4 className="text-xs uppercase tracking-wider font-bold text-red-500 mb-1">Failed</h4>
            <p className="text-3xl font-black text-red-600">{failed}</p>
          </div>
        </div>

        {/* Failed Rows Detail */}
        {failed > 0 && failedRows && failedRows.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Failed Records ({failedRows.length})
            </h4>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {failedRows.map((fail, idx) => (
                <div key={idx} className="bg-red-50/50 border border-red-100 p-3 rounded-lg flex flex-col sm:flex-row sm:items-start gap-2">
                  <div className="bg-red-100 text-red-700 font-mono text-xs px-2 py-1 rounded inline-block whitespace-nowrap self-start">
                    Row {fail.rowNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">
                      {fail.data?.name || "Unknown Name"} 
                      <span className="text-slate-500 font-normal text-sm ml-2">
                        ({fail.data?.email || "No Email"})
                      </span>
                    </p>
                    <p className="text-sm text-red-600 mt-1 font-medium bg-red-100/50 px-2 py-1 rounded inline-block">
                      {fail.simpleMessage || fail.reason || "Unknown validation error"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-4 text-sm text-slate-600 flex items-start gap-2">
              <span className="text-lg leading-none">💡</span>
              <p>
                <strong>Tip:</strong> Fix these specific rows in your original Excel file, delete the successful rows (so they don't duplicate), and re-upload the fixed rows.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end pt-2">
          <Button onClick={onClose} className="px-6">
            Got it, Thanks!
          </Button>
        </div>
      </div>
    </Modal>
  );
}
