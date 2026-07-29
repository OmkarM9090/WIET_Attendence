import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Upload,
  Info
} from 'lucide-react';
import Button from '../Button';

const DataPreviewTable = ({ file, type = 'student', onCancel, onConfirm }) => {
  const [previewData, setPreviewData] = useState(null);
  const [validationIssues, setValidationIssues] = useState([]);
  const [parsing, setParsing] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (file) {
      parseFile(file);
    }
  }, [file]);

  const parseFile = (file) => {
    setParsing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          if (jsonData[i] && jsonData[i].length > 0 && jsonData[i][0] && jsonData[i][0].toString().includes("Name")) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          headerRowIdx = 1;
        }

        const rows = jsonData.slice(headerRowIdx + 1);
        
        const issues = [];
        const validatedRows = rows.map((row, idx) => {
          const rowNum = headerRowIdx + 1 + idx + 1; 
          
          if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
            return null;
          }

          const rowIssues = type === 'student' ? validateStudentRow(row) : validateTeacherRow(row);
          
          if (rowIssues.length > 0) {
            issues.push({ row: rowNum, errors: rowIssues });
          }
          
          let rowData = {};
          if (type === 'student') {
             rowData = {
                name: row[0]?.toString().trim() || "",
                email: row[1]?.toString().trim() || "",
                rollNo: row[2]?.toString().trim() || "",
                branch: row[3]?.toString().trim() || "",
                year: row[4]?.toString().trim() || "",
                division: row[5]?.toString().trim() || "",
                batch: row[6]?.toString().trim() || ""
             };
          } else {
             rowData = {
                name: row[0]?.toString().trim() || "",
                email: row[1]?.toString().trim() || "",
                department: row[2]?.toString().trim() || "",
                phone: row[3]?.toString().trim() || "",
                designation: row[4]?.toString().trim() || ""
             };
          }

          return {
            row: rowNum,
            data: rowData,
            errors: rowIssues,
            isValid: rowIssues.length === 0
          };
        }).filter(Boolean);
        
        setPreviewData(validatedRows);
        setValidationIssues(issues);
      } catch (err) {
        console.error("Error parsing Excel:", err);
        alert("Failed to parse the Excel file. Please ensure it's a valid .xlsx file.");
        onCancel();
      } finally {
        setParsing(false);
      }
    };
    reader.onerror = () => {
      alert("Error reading file.");
      setParsing(false);
      onCancel();
    };
    reader.readAsArrayBuffer(file);
  };

  const validateStudentRow = (row) => {
    const errors = [];
    
    if (!row[0] || row[0].toString().trim() === '') {
      errors.push({ field: 'name', message: 'Name is required' });
    }
    
    if (!row[1] || row[1].toString().trim() === '') {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row[1])) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
    
    if (!row[2] || row[2].toString().trim() === '') {
      errors.push({ field: 'rollNo', message: 'Roll number is required' });
    }
    
    if (!row[3] || row[3].toString().trim() === '') {
      errors.push({ field: 'branch', message: 'Branch code is required' });
    }
    
    const year = parseInt(row[4]);
    if (!year || year < 1 || year > 4) {
      errors.push({ field: 'year', message: 'Year must be 1, 2, 3, or 4' });
    }
    
    const div = row[5]?.toString().toUpperCase();
    if (!div || !['A', 'B', 'C'].includes(div)) {
      errors.push({ field: 'division', message: 'Division must be A, B, or C' });
    }
    
    return errors;
  };

  const validateTeacherRow = (row) => {
    const errors = [];
    
    if (!row[0] || row[0].toString().trim() === '') {
      errors.push({ field: 'name', message: 'Name is required' });
    }
    
    if (!row[1] || row[1].toString().trim() === '') {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row[1])) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
    
    if (!row[2] || row[2].toString().trim() === '') {
      errors.push({ field: 'department', message: 'Department code is required' });
    }
    
    return errors;
  };

  const handleConfirm = async () => {
    const validRows = previewData.filter(r => r.isValid);
    if (validRows.length === 0) return;
    
    setUploading(true);
    await onConfirm(file, validRows.map(r => r.data));
    setUploading(false);
  };

  const getCellStatus = (row, fieldName) => {
    const error = row.errors.find(e => e.field === fieldName);
    if (error) return { invalid: true, message: error.message };
    return { invalid: false, message: "" };
  };

  const renderCell = (row, fieldName, value) => {
    const status = getCellStatus(row, fieldName);
    return (
      <td className={`px-4 py-2 border-r border-slate-100 ${status.invalid ? 'bg-rose-50' : ''}`}>
        <div className="flex items-center gap-2">
          {status.invalid ? (
            <XCircle className="w-4 h-4 text-rose-500 shrink-0" title={status.message} />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          <span className={`truncate ${status.invalid ? 'text-rose-700 font-semibold' : 'text-slate-800'}`}>
            {value || '-'}
          </span>
        </div>
      </td>
    );
  };

  if (parsing) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 min-h-[350px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="font-semibold text-slate-700">Parsing Excel file...</p>
      </div>
    );
  }

  if (!previewData) return null;

  const validCount = previewData.filter(r => r.isValid).length;
  const invalidCount = previewData.length - validCount;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" /> Data Import Preview
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Review imported records before confirming</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{file?.name}</p>
              <p className="text-xs text-slate-500 font-medium">{(file?.size / 1024).toFixed(1)} KB • {previewData.length} records found</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-3.5 py-1.5 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors shadow-xs"
          >
            Change File
          </button>
        </div>
      </div>

      {/* Issues Alert */}
      {validationIssues.length > 0 && (
        <div className="px-6 py-3 shrink-0">
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 max-h-36 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <h4 className="font-bold text-amber-900 text-sm">{validationIssues.length} Row(s) have validation issues</h4>
            </div>
            <ul className="text-xs text-amber-800 space-y-1 ml-7">
              {validationIssues.slice(0, 5).map((issue, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold whitespace-nowrap">Row {issue.row}:</span> 
                  <span>{issue.errors.map(e => e.message).join(' • ')}</span>
                </li>
              ))}
              {validationIssues.length > 5 && (
                <li className="italic text-amber-700 font-medium pt-0.5">
                  ...and {validationIssues.length - 5} more rows with issues
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Table Area */}
      <div className="flex-1 overflow-auto px-6 py-2 custom-scrollbar">
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-max">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 border-r border-slate-200 text-center w-16 uppercase tracking-wider">Row</th>
                  {type === 'student' ? (
                    <>
                      <th className="px-4 py-3 border-r border-slate-200">Name</th>
                      <th className="px-4 py-3 border-r border-slate-200">Email</th>
                      <th className="px-4 py-3 border-r border-slate-200">Roll No</th>
                      <th className="px-4 py-3 border-r border-slate-200">Branch</th>
                      <th className="px-4 py-3 border-r border-slate-200">Year</th>
                      <th className="px-4 py-3 border-r border-slate-200">Div</th>
                      <th className="px-4 py-3 border-r border-slate-200">Batch</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 border-r border-slate-200">Name</th>
                      <th className="px-4 py-3 border-r border-slate-200">Email</th>
                      <th className="px-4 py-3 border-r border-slate-200">Department</th>
                      <th className="px-4 py-3 border-r border-slate-200">Phone</th>
                      <th className="px-4 py-3 border-r border-slate-200">Designation</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {previewData.slice(0, 100).map((row, i) => (
                  <tr key={i} className={`hover:bg-slate-50 ${!row.isValid ? 'bg-rose-50/40' : ''}`}>
                    <td className="px-4 py-2 text-center text-slate-400 font-mono text-xs border-r border-slate-100 bg-slate-50/50 font-bold">
                      {row.row}
                    </td>
                    {type === 'student' ? (
                      <>
                        {renderCell(row, 'name', row.data.name)}
                        {renderCell(row, 'email', row.data.email)}
                        {renderCell(row, 'rollNo', row.data.rollNo)}
                        {renderCell(row, 'branch', row.data.branch)}
                        {renderCell(row, 'year', row.data.year)}
                        {renderCell(row, 'division', row.data.division)}
                        {renderCell(row, 'batch', row.data.batch)}
                      </>
                    ) : (
                      <>
                        {renderCell(row, 'name', row.data.name)}
                        {renderCell(row, 'email', row.data.email)}
                        {renderCell(row, 'department', row.data.department)}
                        {renderCell(row, 'phone', row.data.phone)}
                        {renderCell(row, 'designation', row.data.designation)}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Area */}
      <div className="bg-white border-t border-slate-200 p-6 shrink-0 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Rows</p>
            <p className="text-2xl font-extrabold text-slate-900">{previewData.length}</p>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 text-center">
            <p className="text-[11px] text-emerald-700 uppercase font-bold tracking-wider mb-1">Valid & Ready</p>
            <p className="text-2xl font-extrabold text-emerald-700">{validCount}</p>
          </div>
          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 text-center">
            <p className="text-[11px] text-rose-700 uppercase font-bold tracking-wider mb-1">Invalid (Skipped)</p>
            <p className="text-2xl font-extrabold text-rose-700">{invalidCount}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-xs text-slate-700 font-medium">
              Only <strong className="text-emerald-700">{validCount} valid rows</strong> will be imported.
            </p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="secondary" onClick={onCancel} disabled={uploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={validCount === 0 || uploading}
              loading={uploading}
              variant="primary"
            >
              Upload ({validCount})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPreviewTable;
