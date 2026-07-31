import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, Download, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  getClassInfo, 
  downloadSimpleTemplate, 
  uploadStudentsSimple 
} from '../../services/adminService';

const QuickUploadFlow = ({ branches, onSuccess, onClose }) => {
  const [step, setStep] = useState(1);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadErrorDetails, setUploadErrorDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const normalizeCellText = (value) => String(value || '').trim().toLowerCase();

  const detectDataStartIndex = (rows) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || [];
      const c1 = normalizeCellText(row[0]);
      const c2 = normalizeCellText(row[1]);

      const hasRollHeader = c1.includes('roll');
      const hasNameHeader = c2.includes('name');

      if (hasRollHeader && hasNameHeader) {
        return i + 1;
      }
    }

    return 0;
  };

  const hasMeaningfulData = (row = []) =>
    row.slice(0, 4).some((cell) => String(cell ?? '').trim() !== '');
  
  const fetchClassInfo = useCallback(async () => {
    try {
      const res = await getClassInfo(selectedBranch, selectedYear, selectedDivision);
      setClassInfo(res.classInfo);
    } catch (error) {
      showError(error.message || 'Class info fetch failed');
    }
  }, [selectedBranch, selectedYear, selectedDivision]);

  useEffect(() => {
    if (selectedBranch && selectedYear && selectedDivision) {
      fetchClassInfo();
    }
  }, [selectedBranch, selectedYear, selectedDivision, fetchClassInfo]);
  
  const handleDownloadTemplate = async () => {
    if (!classInfo) return;
    
    try {
      await downloadSimpleTemplate(
        classInfo.branchCode,
        classInfo.year,
        classInfo.division
      );
      showSuccess('Template downloaded!');
    } catch {
      showError('Template download failed');
    }
  };
  
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.xlsx')) {
      showError('Only .xlsx files supported');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      showError('File size must be under 5MB');
      return;
    }
    
    setFile(selectedFile);
    setUploadErrorDetails(null);
    setUploadResult(null);
    
    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const dataStartIndex = detectDataStartIndex(rows);
      const parsed = [];
      let logicalRowNumber = 0;

      for (let sourceRowIndex = dataStartIndex; sourceRowIndex < rows.length; sourceRowIndex++) {
        const row = rows[sourceRowIndex] || [];
        if (!hasMeaningfulData(row)) continue;

        logicalRowNumber += 1;
        const rollNo = row[0]?.toString().trim() || '';
        const name = row[1]?.toString().trim() || '';
        const email = row[2]?.toString().trim() || '';
        const batch = row[3]?.toString().trim() || '';

        const errors = [];
        if (!name) errors.push('Name required');
        if (!rollNo) errors.push('Roll no required');
        else if (!/^\d+$/.test(rollNo)) errors.push('Roll no must be numeric');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Invalid email');
        }

        parsed.push({
          rowNumber: logicalRowNumber,
          sourceRowNumber: sourceRowIndex + 1,
          name,
          rollNo,
          email: email || `${rollNo}.${classInfo.branchCode.toLowerCase()}@college.edu`,
          batch,
          isValid: errors.length === 0,
          errors
        });
      }
      
      setPreviewData(parsed);
      setStep(3);
    } catch (error) {
      showError('Failed to parse Excel file');
      console.error(error);
    }
  };
  
  const handleUpload = async () => {
    if (!file || !classInfo) return;
    
    setUploading(true);
    setUploadErrorDetails(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('branchId', classInfo.branchId);
      formData.append('year', classInfo.year);
      formData.append('division', classInfo.division);
      
      const res = await uploadStudentsSimple(formData);
      
      setUploadResult(res);
      showSuccess(`${res.summary.successful} students added successfully!`);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      if (error?.failedRows || error?.failureSummary || error?.summary) {
        setUploadErrorDetails({
          message: error.message || "Upload failed.",
          summary: error.summary || null,
          failureSummary: error.failureSummary || [],
          failedRows: error.failedRows || []
        });
      }
      showError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  const validCount = previewData?.filter(r => r.isValid).length || 0;
  const invalidCount = previewData?.filter(r => !r.isValid).length || 0;
  
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto pt-10 pb-10">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col my-auto max-h-[90vh] border border-slate-200/80">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <button onClick={() => step === 3 && !uploadResult ? setStep(1) : onClose()} className="p-1 hover:bg-slate-200 rounded-lg transition-colors mr-1">
                 {step === 3 && !uploadResult ? <ArrowLeft className="w-4 h-4"/> : <Upload className="w-5 h-5 text-blue-600"/>}
              </button>
              Quick Upload Students
            </h2>
            {classInfo && (
              <p className="text-xs text-slate-500 font-medium mt-0.5 ml-9">
                {classInfo.displayName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Messages */}
        {errorMsg && (
          <div className="bg-rose-50 text-rose-700 text-xs font-semibold p-3 mx-6 mt-4 rounded-xl flex items-center gap-2 border border-rose-200">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold p-3 mx-6 mt-4 rounded-xl flex items-center gap-2 border border-emerald-200">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}
        
        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Step 1: Select Class Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Branch <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                    >
                      <option value="">-- Select --</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>
                          {b.code} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Year <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                    >
                      <option value="">-- Select --</option>
                      <option value="1">1st Year (FE)</option>
                      <option value="2">2nd Year (SE)</option>
                      <option value="3">3rd Year (TE)</option>
                      <option value="4">4th Year (BE)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Division <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedDivision}
                      onChange={(e) => setSelectedDivision(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                    >
                      <option value="">-- Select --</option>
                      <option value="A">Division A</option>
                      <option value="B">Division B</option>
                      <option value="C">Division C</option>
                    </select>
                  </div>
                </div>
                
                {classInfo && (
                  <div className="mt-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-950 text-xs">
                          {classInfo.displayName}
                        </p>
                        <p className="text-xs text-emerald-700 mt-0.5 font-medium">
                          Academic Year: {classInfo.academicYear} | Current Students: {classInfo.currentStudentCount}
                        </p>
                        {classInfo.currentStudentCount > 0 && (
                          <p className="text-xs text-amber-700 mt-2 font-semibold">
                            This class already has student records. During upload, any row with an existing roll number or email address will be rejected.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {classInfo && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Step 2: Download Template
                  </h3>
                  
                  <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4">
                    <p className="text-xs text-blue-900 font-medium mb-3">
                      Roll No and Name are mandatory. Email and Batch are optional.
                    </p>
                    
                    <button
                      onClick={handleDownloadTemplate}
                      className="bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors shadow-2xs"
                    >
                      <Download className="w-4 h-4" />
                      Download Template for {classInfo.displayName}
                    </button>
                  </div>
                </div>
              )}
              
              {classInfo && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Step 3: Upload Excel File
                  </h3>
                  
                  <label className="block border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-colors">
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">
                      Click to upload or drag file here
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      .xlsx files only, max 5MB
                    </p>
                  </label>
                </div>
              )}
            </div>
          )}
          
          {step === 3 && previewData && !uploadResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <FileSpreadsheet className="w-6 h-6 text-blue-600 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-xs text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {(file.size / 1024).toFixed(1)} KB | Total: {previewData.length} | Valid: {validCount} | Invalid: {invalidCount}
                  </p>
                </div>
              </div>
              
              {invalidCount > 0 && (
                <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-xl text-xs">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-amber-950">
                        {invalidCount} rows have validation issues
                      </p>
                      <p className="text-amber-800 mt-0.5 font-medium">
                        Only valid rows will be uploaded. Invalid rows will be skipped.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {uploadErrorDetails && (
                <div className="space-y-3">
                  <div className="bg-rose-50 border border-rose-200/80 p-3.5 rounded-xl text-xs">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-rose-950">
                          {uploadErrorDetails.message}
                        </p>
                        {uploadErrorDetails.summary && (
                          <p className="text-rose-800 mt-0.5 font-medium">
                            Processed {uploadErrorDetails.summary.total} rows. Uploaded {uploadErrorDetails.summary.successful} and rejected {uploadErrorDetails.summary.failed}.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {uploadErrorDetails.failureSummary.length > 0 && (
                    <div className="bg-white border border-rose-200 rounded-xl p-4 text-xs">
                      <h4 className="font-bold text-slate-900 mb-2">
                        Why the upload was rejected
                      </h4>
                      <ul className="space-y-1 text-slate-700 font-medium">
                        {uploadErrorDetails.failureSummary.map((item) => (
                          <li key={item.reason}>
                            {item.reason}: {item.count} row{item.count > 1 ? "s" : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {uploadErrorDetails.failedRows.length > 0 && (
                    <div className="bg-white border border-rose-200 rounded-xl p-4 text-xs max-h-48 overflow-y-auto">
                      <h4 className="font-bold text-slate-900 mb-2">
                        Row-by-row issues
                      </h4>
                      <ul className="space-y-1 text-slate-700 font-medium">
                        {uploadErrorDetails.failedRows.slice(0, 12).map((row, index) => (
                          <li key={`${row.excelRowNumber || row.rowNumber}-${index}`}>
                            {row.simpleMessage}
                          </li>
                        ))}
                      </ul>
                      {uploadErrorDetails.failedRows.length > 12 && (
                        <p className="mt-2 text-slate-500 font-medium">
                          Showing first 12 issues out of {uploadErrorDetails.failedRows.length}.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-80 custom-scrollbar">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-slate-700 font-bold">
                      <tr>
                        <th className="px-4 py-2.5 text-left">Row</th>
                        <th className="px-4 py-2.5 text-left">Roll No</th>
                        <th className="px-4 py-2.5 text-left">Name</th>
                        <th className="px-4 py-2.5 text-left">Email</th>
                        <th className="px-4 py-2.5 text-left">Batch</th>
                        <th className="px-4 py-2.5 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-medium">
                      {previewData.map((row) => (
                        <tr 
                          key={row.rowNumber}
                          className={`hover:bg-slate-50 ${!row.isValid ? 'bg-rose-50/40' : ''}`}
                        >
                          <td className="px-4 py-2 text-slate-500">{row.rowNumber}</td>
                          <td className="px-4 py-2 font-mono font-bold">{row.rollNo || '-'}</td>
                          <td className="px-4 py-2 font-bold text-slate-900">{row.name || '-'}</td>
                          <td className="px-4 py-2 font-mono text-slate-500">{row.email}</td>
                          <td className="px-4 py-2">{row.batch || '-'}</td>
                          <td className="px-4 py-2">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                <CheckCircle2 size={13} /> OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-bold" title={row.errors.join(', ')}>
                                <XCircle size={13} /> Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {uploadResult && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Upload Completed
              </h3>
              <p className="text-xs font-semibold text-slate-600 mb-6">
                Added {uploadResult.summary.successful} students to {classInfo.displayName}
              </p>
              
              {uploadResult.summary.failed > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-left mb-6 max-h-48 overflow-y-auto text-xs">
                  <h4 className="font-bold text-rose-900 mb-2">
                    {uploadResult.summary.failed} rows failed:
                  </h4>
                  <ul className="text-rose-800 space-y-1 list-disc pl-5 font-medium">
                    {uploadResult.failedRows.map((f, i) => (
                      <li key={i}>{f.simpleMessage}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button 
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition-colors shadow-2xs"
              >
                Done
              </button>
            </div>
          )}
        </div>
        
        {step === 3 && !uploadResult && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
            <button 
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 text-xs font-bold transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload}
              disabled={validCount === 0 || uploading}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-2xs"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                `Add ${validCount} Students to ${classInfo.displayName.split(' ')[0]}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickUploadFlow;
