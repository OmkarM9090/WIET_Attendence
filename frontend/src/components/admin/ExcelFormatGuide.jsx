import React, { useState, useEffect } from 'react';
import { 
  Download, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Circle,
  FileSpreadsheet,
  BookOpen
} from 'lucide-react';
import axiosInstance from '../../utils/axios';

const ExcelFormatGuide = ({ type = 'student' }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem(`excelGuideExpanded_${type}`);
    if (savedState !== null) {
      setIsExpanded(savedState === 'true');
    }
  }, [type]);

  const toggleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem(`excelGuideExpanded_${type}`, newState.toString());
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const endpoint = type === 'student' 
        ? '/admin/download-student-template' 
        : '/admin/download-teacher-template';
      
      const response = await axiosInstance.get(endpoint, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `${type}_upload_template_${date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Template download failed:", error);
      alert('Failed to download template. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const isStudent = type === 'student';

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl shadow-2xs mb-6 overflow-hidden transition-all duration-300">
      {/* Header Section */}
      <div className="p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100">
        <div>
          <button 
            onClick={toggleExpand}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Excel Format Guide
              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </h2>
          </button>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Follow this specification to upload {isStudent ? 'students' : 'teachers'} without formatting errors
          </p>
        </div>
        
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full sm:w-auto bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-blue-600" />
          {isDownloading ? 'Downloading...' : 'Download Template'}
        </button>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 md:p-6 animate-in fade-in duration-200">
          
          {/* Important Rules */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 mb-6 flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-950 uppercase tracking-wider mb-1">Important Rules:</h4>
              <ul className="list-disc list-inside font-medium space-y-1">
                <li>Only <strong>.xlsx</strong> format is supported (not .xls or .csv)</li>
                <li>Maximum file size: <strong>5 MB</strong></li>
                <li>Do NOT modify the header rows</li>
                <li>Data starts from <strong>Row 5</strong> (Row 3 has hints, Row 4 has samples)</li>
                <li>Column order MUST match the template layout exactly</li>
              </ul>
            </div>
          </div>

          {/* Sample Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Required Columns (in order):</h4>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[600px] text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="px-4 py-2.5 font-bold text-center border-r border-slate-200 w-12">#</th>
                    {isStudent ? (
                      <>
                        <th className="px-4 py-2.5 font-bold uppercase">Column A <span className="font-normal text-slate-400">(Name*)</span></th>
                        <th className="px-4 py-2.5 font-bold uppercase">Column B <span className="font-normal text-slate-400">(Email*)</span></th>
                        <th className="px-4 py-2.5 font-bold uppercase">Column C <span className="font-normal text-slate-400">(Roll No*)</span></th>
                        <th className="px-4 py-2.5 font-bold uppercase">Column D <span className="font-normal text-slate-400">(Branch Code*)</span></th>
                        <th className="px-4 py-2.5 font-bold uppercase">Column E <span className="font-normal text-slate-400">(Year*)</span></th>
                        <th className="px-4 py-2.5 font-bold uppercase">Column F <span className="font-normal text-slate-400">(Division*)</span></th>
                        <th className="px-4 py-2.5 font-bold uppercase">Column G <span className="font-normal text-slate-400">(Batch Opt)</span></th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-2.5 font-bold uppercase">Column A <span className="font-normal text-slate-400">(Name*)</span></th>
                        <th className="px-4 py-2.5 font-bold uppercase">Column B <span className="font-normal text-slate-400">(Email*)</span></th>
                        <th className="px-4 py-2.5 font-bold uppercase">Column C <span className="font-normal text-slate-400">(Department*)</span></th>
                        <th className="px-4 py-2.5 font-bold uppercase">Column D <span className="font-normal text-slate-400">(Phone)</span></th>
                        <th className="px-4 py-2.5 font-bold uppercase">Column E <span className="font-normal text-slate-400">(Designation)</span></th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="text-slate-800 font-medium">
                  {isStudent ? (
                    <>
                      <tr className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-center text-slate-400 border-r border-slate-100">1</td>
                        <td className="px-4 py-2 font-bold">Rahul Sharma</td>
                        <td className="px-4 py-2 font-mono text-slate-600">rahul@college.edu</td>
                        <td className="px-4 py-2 font-mono">101</td>
                        <td className="px-4 py-2 font-bold text-blue-700">COMP</td>
                        <td className="px-4 py-2">2</td>
                        <td className="px-4 py-2">A</td>
                        <td className="px-4 py-2">B1</td>
                      </tr>
                      <tr className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-center text-slate-400 border-r border-slate-100">2</td>
                        <td className="px-4 py-2 font-bold">Priya Patel</td>
                        <td className="px-4 py-2 font-mono text-slate-600">priya@college.edu</td>
                        <td className="px-4 py-2 font-mono">102</td>
                        <td className="px-4 py-2 font-bold text-blue-700">IT</td>
                        <td className="px-4 py-2">3</td>
                        <td className="px-4 py-2">B</td>
                        <td className="px-4 py-2 text-slate-400">-</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-center text-slate-400 border-r border-slate-100">1</td>
                        <td className="px-4 py-2 font-bold">Dr. Ramesh Verma</td>
                        <td className="px-4 py-2 font-mono text-slate-600">ramesh@college.edu</td>
                        <td className="px-4 py-2 font-bold text-blue-700">COMP</td>
                        <td className="px-4 py-2 font-mono">9876543210</td>
                        <td className="px-4 py-2">Professor</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column Details */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Column Specifications:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex gap-2.5 items-start p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-900">Name (Required)</h5>
                  <p className="text-slate-500 mt-0.5">Full name of {isStudent ? 'student' : 'teacher'}.</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-900">Email (Required, Unique)</h5>
                  <p className="text-slate-500 mt-0.5">Valid email address used for system login.</p>
                </div>
              </div>

              {isStudent && (
                <>
                  <div className="flex gap-2.5 items-start p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-slate-900">Roll No (Required, Unique)</h5>
                      <p className="text-slate-500 mt-0.5">Numeric or alphanumeric student ID.</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-slate-900">Branch Code (Required)</h5>
                      <p className="text-slate-500 mt-0.5">Must match an existing registered branch code (e.g. COMP, IT).</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-blue-50/50 border border-blue-200/60 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Important Notes:</p>
              <ul className="list-disc list-inside space-y-0.5 font-medium text-blue-800">
                <li>Default password for all newly uploaded accounts is <strong>student123</strong></li>
                <li>Users will be prompted to change password upon initial login</li>
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ExcelFormatGuide;
