import React, { useState, useEffect } from 'react';
import { 
  Download, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Circle 
} from 'lucide-react';
import axiosInstance from '../../utils/axios';

const ExcelFormatGuide = ({ type = 'student' }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // Use localStorage to remember preference
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
        responseType: 'blob' // Important for file downloads
      });
      
      // Create download link
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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm mb-6 overflow-hidden transition-all duration-300">
      {/* Header Section (Always visible) */}
      <div className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-blue-100">
        <div>
          <button 
            onClick={toggleExpand}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              📋 Excel Format Guide
              {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
            </h2>
          </button>
          <p className="text-sm text-slate-600 mt-1 ml-7">
            Follow this format to upload {isStudent ? 'students' : 'teachers'} successfully
          </p>
        </div>
        
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold text-indigo-600 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? 'Downloading...' : 'Download Template'}
        </button>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 md:p-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* Important Rules */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800 mb-1">⚠️ IMPORTANT RULES:</h4>
              <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                <li>Only <strong>.xlsx</strong> format is supported (not .xls or .csv)</li>
                <li>Maximum file size: <strong>5 MB</strong></li>
                <li>Do NOT modify the first 2 rows (Headers)</li>
                <li>Data must start from <strong>Row 5</strong> (Row 3 has hints, Row 4 has samples)</li>
                <li>Column order MUST match the template exactly</li>
              </ul>
            </div>
          </div>

          {/* Sample Table (Scrollable) */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-800 mb-2 ml-1">📊 Required Columns (in order):</h4>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                    <th className="px-4 py-3 text-xs font-bold text-slate-700 text-center border-r border-slate-200 w-12">#</th>
                    {isStudent ? (
                      <>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                          Column A<div className="text-[10px] text-slate-500 font-normal mt-1">Name*</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                          Column B<div className="text-[10px] text-slate-500 font-normal mt-1">Email*</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                          Column C<div className="text-[10px] text-slate-500 font-normal mt-1">Roll No*</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                          Column D<div className="text-[10px] text-slate-500 font-normal mt-1">Branch Code*</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                          Column E<div className="text-[10px] text-slate-500 font-normal mt-1">Year*</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                          Column F<div className="text-[10px] text-slate-500 font-normal mt-1">Division*</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase bg-slate-50/50">
                          Column G<div className="text-[10px] text-slate-500 font-normal mt-1">Batch (Opt)</div>
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                          Column A<div className="text-[10px] text-slate-500 font-normal mt-1">Name*</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                          Column B<div className="text-[10px] text-slate-500 font-normal mt-1">Email*</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                          Column C<div className="text-[10px] text-slate-500 font-normal mt-1">Department*</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase bg-slate-50/50">
                          Column D<div className="text-[10px] text-slate-500 font-normal mt-1">Phone</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase bg-slate-50/50">
                          Column E<div className="text-[10px] text-slate-500 font-normal mt-1">Designation</div>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-800">
                  {isStudent ? (
                    <>
                      <tr className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-center text-slate-400 border-r border-slate-100">1</td>
                        <td className="px-4 py-2">Rahul Sharma</td>
                        <td className="px-4 py-2">rahul@college.edu</td>
                        <td className="px-4 py-2 font-mono text-xs">101</td>
                        <td className="px-4 py-2 font-semibold">COMP</td>
                        <td className="px-4 py-2 text-center">2</td>
                        <td className="px-4 py-2 text-center">A</td>
                        <td className="px-4 py-2 text-center bg-slate-50/30">B1</td>
                      </tr>
                      <tr className="border-b border-slate-100 bg-slate-50 hover:bg-slate-100">
                        <td className="px-4 py-2 text-center text-slate-400 border-r border-slate-100">2</td>
                        <td className="px-4 py-2">Priya Patel</td>
                        <td className="px-4 py-2">priya@college.edu</td>
                        <td className="px-4 py-2 font-mono text-xs">102</td>
                        <td className="px-4 py-2 font-semibold">IT</td>
                        <td className="px-4 py-2 text-center">3</td>
                        <td className="px-4 py-2 text-center">B</td>
                        <td className="px-4 py-2 text-center bg-slate-50/30 text-slate-400">-</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-center text-slate-400 border-r border-slate-100">1</td>
                        <td className="px-4 py-2">Dr. Ramesh Verma</td>
                        <td className="px-4 py-2">ramesh@college.edu</td>
                        <td className="px-4 py-2 font-semibold">COMP</td>
                        <td className="px-4 py-2 font-mono text-xs bg-slate-50/30">9876543210</td>
                        <td className="px-4 py-2 text-xs bg-slate-50/30">Professor</td>
                      </tr>
                      <tr className="border-b border-slate-100 bg-slate-50 hover:bg-slate-100">
                        <td className="px-4 py-2 text-center text-slate-400 border-r border-slate-100">2</td>
                        <td className="px-4 py-2">Prof. Anita Desai</td>
                        <td className="px-4 py-2">anita@college.edu</td>
                        <td className="px-4 py-2 font-semibold">IT</td>
                        <td className="px-4 py-2 font-mono text-xs bg-slate-50/30 text-slate-400">-</td>
                        <td className="px-4 py-2 text-xs bg-slate-50/30">Assistant Professor</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column Details */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-800 mb-4 ml-1">📖 Column Details:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-slate-900">Name (Required)</h5>
                  <p className="text-xs text-slate-600 mt-1">Full name of {isStudent ? 'student' : 'teacher'}.</p>
                  <div className="mt-1"><span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">e.g. Rahul Sharma</span></div>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-slate-900">Email (Required, Unique)</h5>
                  <p className="text-xs text-slate-600 mt-1">Valid email format. Used for login.</p>
                  <div className="mt-1"><span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">e.g. valid@email.com</span></div>
                </div>
              </div>

              {isStudent && (
                <>
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900">Roll No (Required, Unique)</h5>
                      <p className="text-xs text-slate-600 mt-1">Student roll number or ID.</p>
                      <div className="mt-1"><span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">e.g. 101 or CS101</span></div>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900">Branch Code (Required)</h5>
                      <p className="text-xs text-slate-600 mt-1">Must match exact code from DB.</p>
                      <div className="mt-1"><span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">e.g. COMP, IT, MECH</span></div>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900">Year & Division (Required)</h5>
                      <p className="text-xs text-slate-600 mt-1">Year (1-4) and Division (A,B,C).</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900">Batch (Optional)</h5>
                      <p className="text-xs text-slate-600 mt-1">Practical batch name. Auto-created if new.</p>
                      <div className="mt-1"><span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">e.g. B1, B2</span></div>
                    </div>
                  </div>
                </>
              )}

              {!isStudent && (
                <>
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900">Department Code (Required)</h5>
                      <p className="text-xs text-slate-600 mt-1">Must match exact branch code from DB.</p>
                      <div className="mt-1"><span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">e.g. COMP, IT</span></div>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900">Phone (Optional)</h5>
                      <p className="text-xs text-slate-600 mt-1">10-digit contact number.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900">Designation (Optional)</h5>
                      <p className="text-xs text-slate-600 mt-1">Professor, Assistant Professor, etc.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-900">
              <p className="font-semibold mb-1">💡 Good to know:</p>
              <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
                <li>Default password for all newly uploaded users is <strong>student123</strong></li>
                <li>Users will be prompted to change their password after first login</li>
                <li>Check the "Reference Data" sheet in the downloaded template for valid codes</li>
                {isStudent && <li>If a batch doesn't exist yet, it will be automatically created</li>}
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ExcelFormatGuide;
