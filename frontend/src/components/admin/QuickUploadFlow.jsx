import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Download, Upload, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  getClassInfo, 
  downloadSimpleTemplate, 
  uploadStudentsSimple 
} from '../../services/adminService';

const QuickUploadFlow = ({ branches, onSuccess, onClose }) => {
  const [step, setStep] = useState(1); // 1: Select Class, 2: Upload File, 3: Preview
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
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
  
  // Fetch class info when all 3 fields selected
  useEffect(() => {
    if (selectedBranch && selectedYear && selectedDivision) {
      fetchClassInfo();
    }
  }, [selectedBranch, selectedYear, selectedDivision]);
  
  const fetchClassInfo = async () => {
    try {
      const res = await getClassInfo(selectedBranch, selectedYear, selectedDivision);
      setClassInfo(res.classInfo);
    } catch (error) {
      showError(error.message || 'Class info fetch failed');
    }
  };
  
  const handleDownloadTemplate = async () => {
    if (!classInfo) return;
    
    try {
      await downloadSimpleTemplate(
        classInfo.branchCode,
        classInfo.year,
        classInfo.division
      );
      showSuccess('Template downloaded!');
    } catch (error) {
      showError('Template download failed');
    }
  };
  
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Validate file
    if (!selectedFile.name.endsWith('.xlsx')) {
      showError('Only .xlsx files supported');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      showError('File size must be under 5MB');
      return;
    }
    
    setFile(selectedFile);
    
    // Parse for preview
    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      // Skip header rows (first 3 rows are class info + instructions + headers)
      const dataRows = rows.slice(3).filter(row => row.length > 0);
      
      // Parse and validate
      const parsed = dataRows.map((row, idx) => {
        const rowNum = idx + 4; // Since we skipped 3 rows
        const name = row[0]?.toString().trim() || '';
        const rollNo = row[1]?.toString().trim() || '';
        const email = row[2]?.toString().trim() || '';
        const batch = row[3]?.toString().trim() || '';
        
        const errors = [];
        if (!name) errors.push('Name required');
        if (!rollNo) errors.push('Roll no required');
        else if (!/^\d+$/.test(rollNo)) errors.push('Roll no must be numeric');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Invalid email');
        }
        
        return {
          rowNumber: rowNum,
          name,
          rollNo,
          email: email || `${rollNo}.${classInfo.branchCode.toLowerCase()}@college.edu`,
          batch,
          isValid: errors.length === 0,
          errors
        };
      });
      
      setPreviewData(parsed);
      setStep(3); // Move to preview
    } catch (error) {
      showError('Failed to parse Excel file');
      console.error(error);
    }
  };
  
  const handleUpload = async () => {
    if (!file || !classInfo) return;
    
    setUploading(true);
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
      showError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  const validCount = previewData?.filter(r => r.isValid).length || 0;
  const invalidCount = previewData?.filter(r => !r.isValid).length || 0;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto pt-10 pb-10">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <button onClick={() => step === 3 && !uploadResult ? setStep(1) : onClose()} className="p-1 hover:bg-slate-200 rounded-lg transition-colors mr-1">
                 {step === 3 && !uploadResult ? <ArrowLeft className="w-5 h-5"/> : '🎯'}
              </button>
              Quick Upload Students
            </h2>
            {classInfo && (
              <p className="text-sm text-slate-600 mt-1 ml-9">
                {classInfo.displayName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Messages */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 mx-6 mt-4 rounded-lg flex items-center gap-2 border border-red-200">
            <AlertTriangle className="w-5 h-5" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 text-green-600 p-3 mx-6 mt-4 rounded-lg flex items-center gap-2 border border-green-200">
            <CheckCircle className="w-5 h-5" />
            {successMsg}
          </div>
        )}
        
        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Step 1: Class Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  📍 Step 1: Select Class Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Branch */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Branch <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">-- Select --</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>
                          {b.code} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Year */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">-- Select --</option>
                      <option value="1">1st Year (FE)</option>
                      <option value="2">2nd Year (SE)</option>
                      <option value="3">3rd Year (TE)</option>
                      <option value="4">4th Year (BE)</option>
                    </select>
                  </div>
                  
                  {/* Division */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Division <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedDivision}
                      onChange={(e) => setSelectedDivision(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">-- Select --</option>
                      <option value="A">Division A</option>
                      <option value="B">Division B</option>
                      <option value="C">Division C</option>
                    </select>
                  </div>
                </div>
                
                {/* Class Info Display */}
                {classInfo && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-900">
                          {classInfo.displayName}
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          Academic Year: {classInfo.academicYear} | 
                          Current Students: {classInfo.currentStudentCount}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {classInfo && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    📥 Step 2: Download Template
                  </h3>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-900 mb-3">
                      Template mein sirf <strong>Name</strong> aur <strong>Roll Number</strong> mandatory hai. 
                      Email aur Batch optional hain (auto-generate honge if empty).
                    </p>
                    
                    <button
                      onClick={handleDownloadTemplate}
                      className="bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Template for {classInfo.displayName}
                    </button>
                  </div>
                </div>
              )}
              
              {classInfo && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    📤 Step 3: Upload Excel File
                  </h3>
                  
                  <label className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-700 font-medium">
                      Click to upload or drag file here
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      .xlsx files only, max 5MB
                    </p>
                  </label>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Preview (Show parsed data) */}
          {step === 3 && previewData && !uploadResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-600">
                    {(file.size / 1024).toFixed(1)} KB | 
                    Total: {previewData.length} | 
                    Valid: {validCount} ✅ | 
                    Invalid: {invalidCount} ❌
                  </p>
                </div>
              </div>
              
              {invalidCount > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">
                        {invalidCount} rows have issues
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Sirf valid rows upload honge. Invalid rows skip ho jayenge.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Row</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Name</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Roll No</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Email</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Batch</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row) => (
                        <tr 
                          key={row.rowNumber}
                          className={`border-b border-slate-100 ${!row.isValid ? 'bg-red-50' : ''}`}
                        >
                          <td className="px-4 py-2 text-slate-600">{row.rowNumber}</td>
                          <td className="px-4 py-2">{row.name || '-'}</td>
                          <td className="px-4 py-2 font-mono">{row.rollNo || '-'}</td>
                          <td className="px-4 py-2 text-xs text-slate-600">{row.email}</td>
                          <td className="px-4 py-2">{row.batch || '-'}</td>
                          <td className="px-4 py-2">
                            {row.isValid ? (
                              <span className="text-green-600 font-medium">✅ OK</span>
                            ) : (
                              <span className="text-red-600 font-medium" title={row.errors.join(', ')}>
                                ❌ Error
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
          
          {/* Success Result View */}
          {uploadResult && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Upload Successful!
              </h3>
              <p className="text-lg text-slate-600 mb-8">
                Added {uploadResult.summary.successful} students to {classInfo.displayName}
              </p>
              
              {uploadResult.summary.failed > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left mb-6 max-h-48 overflow-y-auto">
                  <h4 className="font-semibold text-red-800 mb-2">
                    ⚠️ {uploadResult.summary.failed} rows failed:
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1 list-disc pl-5">
                    {uploadResult.failedRows.map((f, i) => (
                      <li key={i}>{f.simpleMessage}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button 
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
        
        {/* Footer Actions (Preview Mode) */}
        {step === 3 && !uploadResult && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
            <button 
              onClick={() => setStep(1)}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload}
              disabled={validCount === 0 || uploading}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                `✅ Add ${validCount} Students to ${classInfo.displayName.split(' ')[0]}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickUploadFlow;
