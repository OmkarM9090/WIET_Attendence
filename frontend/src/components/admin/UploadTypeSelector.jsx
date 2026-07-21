import React from 'react';
import { X, Zap, FileSpreadsheet } from 'lucide-react';

const UploadTypeSelector = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            📤 Upload Students Excel
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-8">
          <p className="text-slate-600 mb-6 text-center text-lg">
            Choose Upload Type:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Upload Option */}
            <div 
              onClick={() => onSelect('quick')}
              className="border-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl p-6 cursor-pointer transition-all flex flex-col h-full group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <Zap className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">🎯 Quick Upload</h3>
                  <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Recommended
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 mb-6 flex-1">
                Select Year, Division, Branch pehle, phir sirf <strong>Name + Roll No</strong> wala Excel upload karo.
              </p>
              
              <ul className="text-sm text-slate-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">✅ Fast & Easy</li>
                <li className="flex items-center gap-2">✅ Less Errors</li>
                <li className="flex items-center gap-2">✅ Auto Email Generation</li>
              </ul>
              
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors">
                Select →
              </button>
            </div>
            
            {/* Full Upload Option */}
            <div 
              onClick={() => onSelect('full')}
              className="border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-xl p-6 cursor-pointer transition-all flex flex-col h-full group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-slate-100 p-3 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <FileSpreadsheet className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">📋 Full Upload</h3>
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                    Advanced
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 mb-6 flex-1">
                Excel mein saare fields: Name, Email, Roll, Branch, Year, Division, Batch (Optional)
              </p>
              
              <ul className="text-sm text-slate-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">✅ Multi-class Upload</li>
                <li className="flex items-center gap-2">✅ Custom Emails</li>
                <li className="flex items-center gap-2">✅ Full Control</li>
              </ul>
              
              <button className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2.5 rounded-lg transition-colors">
                Select →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadTypeSelector;
