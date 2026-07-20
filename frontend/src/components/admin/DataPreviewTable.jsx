import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Upload
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
        
        // Ensure we get headers correctly and all data
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        
        // Find header row index
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          if (jsonData[i] && jsonData[i].length > 0 && jsonData[i][0] && jsonData[i][0].toString().includes("Name")) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          // Fallback to row 1 (0-indexed) if not found explicitly, as per template
          headerRowIdx = 1;
        }

        const rows = jsonData.slice(headerRowIdx + 1); // Skip headers
        
        const issues = [];
        const validatedRows = rows.map((row, idx) => {
          // +2 to account for 1-based Excel row, and + header row
          const rowNum = headerRowIdx + 1 + idx + 1; 
          
          // Skip completely empty rows
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
        }).filter(Boolean); // Remove nulls (empty rows)
        
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
      <td className={`px-4 py-2 border-r border-slate-100 ${status.invalid ? 'bg-red-50' : ''}`}>
        <div className="flex items-center gap-2">
          {status.invalid ? (
            <XCircle className="w-4 h-4 text-red-500 shrink-0" title={status.message} />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          )}
          <span className={`truncate ${status.invalid ? 'text-red-700' : 'text-slate-700'}`}>
            {value || '-'}
          </span>
        </div>
      </td>
    );
  };

  if (parsing) {
    return (
      <div className="bg-white border rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-4"></div>
        <p className="font-medium text-slate-600">Parsing Excel file...</p>
      </div>
    );
  }

  if (!previewData) return null;

  const validCount = previewData.filter(r => r.isValid).length;
  const invalidCount = previewData.length - validCount;

  return (
    <div className="bg-white border rounded-2xl shadow-lg overflow-hidden flex flex-col max-h-[85vh]">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              🔍 Data Preview
            </h2>
            <p className="text-sm text-slate-500 mt-1">Review your data before uploading to the server</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600 shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{file?.name}</p>
              <p className="text-xs text-slate-500 font-medium">{(file?.size / 1024).toFixed(1)} KB • {previewData.length} records found</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="text-sm text-red-600 hover:text-red-700 font-semibold px-4 py-1.5 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
          >
            Choose Different File
          </button>
        </div>
      </div>

      {/* Issues Alert */}
      {validationIssues.length > 0 && (
        <div className="px-6 py-4 shrink-0">
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 max-h-40 overflow-y-auto shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-amber-900">⚠️ {validationIssues.length} Row(s) have validation issues</h4>
            </div>
            <ul className="text-sm text-amber-800 space-y-1.5 ml-7">
              {validationIssues.slice(0, 5).map((issue, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold whitespace-nowrap">Row {issue.row}:</span> 
                  <span>{issue.errors.map(e => e.message).join(' • ')}</span>
                </li>
              ))}
              {validationIssues.length > 5 && (
                <li className="italic text-amber-600 font-medium pt-1">
                  ...and {validationIssues.length - 5} more rows with issues
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Table Area (Scrollable) */}
      <div className="flex-1 overflow-auto px-6 py-2">
        <div className="flex items-center justify-between mb-3">
           <h4 className="font-bold text-slate-800">Preview <span className="text-slate-500 font-normal text-sm ml-2">(Showing first 100 rows)</span></h4>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-max">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b-2 border-slate-200">
                <tr>
                  <th className="px-4 py-3 border-r border-slate-200 text-center w-16 uppercase text-xs tracking-wider">Row</th>
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
              <tbody className="bg-white">
                {previewData.slice(0, 100).map((row, i) => (
                  <tr key={i} className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${!row.isValid ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-2 text-center text-slate-500 font-mono text-xs border-r border-slate-100 bg-slate-50/50">
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
      <div className="bg-white border-t border-slate-200 p-6 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Rows</p>
            <p className="text-3xl font-black text-slate-800">{previewData.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><CheckCircle2 className="w-16 h-16 text-green-500" /></div>
            <p className="text-xs text-green-700 uppercase font-bold tracking-wider mb-1 relative z-10">Valid & Ready</p>
            <p className="text-3xl font-black text-green-700 relative z-10">{validCount}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><XCircle className="w-16 h-16 text-red-500" /></div>
            <p className="text-xs text-red-700 uppercase font-bold tracking-wider mb-1 relative z-10">Invalid (Will Skip)</p>
            <p className="text-3xl font-black text-red-600 relative z-10">{invalidCount}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full shadow-sm">
              <Info className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-sm text-slate-700 font-medium">
              Only the <strong className="text-green-600">{validCount} valid rows</strong> will be uploaded to the server.
            </p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto bg-white" disabled={uploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={validCount === 0 || uploading}
              className={`w-full sm:w-auto shadow-sm ${validCount > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300'}`}
            >
              {uploading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </div>
              ) : (
                <div className="flex items-center font-bold">
                  <Upload className="w-4 h-4 mr-2" />
                  Proceed Upload ({validCount})
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Info icon to lucide-react imports if it's missing up top
import { Info } from 'lucide-react';

export default DataPreviewTable;
