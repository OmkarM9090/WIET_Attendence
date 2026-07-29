import React from 'react';
import { X, Zap, FileSpreadsheet, CheckCircle2, ArrowRight, Upload } from 'lucide-react';

const UploadTypeSelector = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col border border-slate-200/80">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Upload Students Excel
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 md:p-8">
          <p className="text-slate-600 mb-6 text-center text-sm font-semibold">
            Select Your Preferred Upload Workflow:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Upload Option */}
            <div 
              onClick={() => onSelect('quick')}
              className="border border-blue-200 hover:border-blue-500 bg-white hover:bg-blue-50/40 rounded-xl p-6 cursor-pointer transition-all flex flex-col h-full group shadow-2xs"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Quick Upload</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Recommended
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 font-medium mb-4 flex-1 leading-relaxed">
                Select target class details first, then upload a simplified Excel file containing only <strong>Name + Roll No</strong>.
              </p>
              
              <ul className="text-xs text-slate-600 space-y-2 mb-6 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Fast & Simple</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Automatic Validation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Auto Account Setup</li>
              </ul>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs">
                Select Option <ArrowRight size={14} />
              </button>
            </div>
            
            {/* Full Upload Option */}
            <div 
              onClick={() => onSelect('full')}
              className="border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 rounded-xl p-6 cursor-pointer transition-all flex flex-col h-full group shadow-2xs"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-600 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Full Template</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                    Advanced
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 font-medium mb-4 flex-1 leading-relaxed">
                Complete multi-class template including Branch, Year, Division, Batch, and custom fields per row.
              </p>
              
              <ul className="text-xs text-slate-600 space-y-2 mb-6 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Multi-class Upload</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Custom Email Definitions</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Granular Roster Control</li>
              </ul>
              
              <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-slate-200">
                Select Option <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadTypeSelector;
