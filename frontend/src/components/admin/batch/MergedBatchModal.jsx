import React, { useState, useEffect } from "react";
import { X, GitMerge, AlertCircle, RefreshCw, CheckSquare, Square, Search, Filter } from "lucide-react";
import { getAllBatchesForMerge, getStudentsForMerge } from "../../../services/adminBatchService";

export default function MergedBatchModal({ isOpen, onClose, classData, onSuccess }) {
  const [mergeMode, setMergeMode] = useState("batch"); // 'batch' | 'students'
  const [name, setName] = useState("");
  const [labRoom, setLabRoom] = useState("");
  const [description, setDescription] = useState("");
  
  const [batches, setBatches] = useState([]);
  const [groupedBatches, setGroupedBatches] = useState({});
  const [selectedBatches, setSelectedBatches] = useState([]);
  
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDivision, setFilterDivision] = useState("all");
  
  const [loading, setLoading] = useState({ data: false, submit: false });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !classData?.branchId || !classData?.year) return;
    
    const fetchMergeData = async () => {
      setLoading(p => ({ ...p, data: true }));
      setError("");
      try {
        const params = {
          branchId: classData.branchId,
          year: classData.year,
          academicYear: classData.academicYear,
        };
        
        const [batchRes, studentRes] = await Promise.all([
          getAllBatchesForMerge(params),
          getStudentsForMerge(params)
        ]);
        
        setBatches(batchRes.batches || []);
        setGroupedBatches(batchRes.groupedByDivision || {});
        setAllStudents(studentRes.students || []);
      } catch (err) {
        setError(err.message || "Failed to load merge data");
      } finally {
        setLoading(p => ({ ...p, data: false }));
      }
    };
    fetchMergeData();
  }, [isOpen, classData]);

  // Reset modal state on close or re-open
  useEffect(() => {
    if (isOpen) {
      setMergeMode("batch");
      setName("");
      setLabRoom("");
      setDescription("");
      setSelectedBatches([]);
      setSelectedStudents([]);
      setSearchQuery("");
      setFilterDivision("all");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleModeChange = (newMode) => {
    if (newMode === mergeMode) return;
    if (selectedBatches.length > 0 || selectedStudents.length > 0) {
      const confirm = window.confirm("Switching modes will clear your current selections. Continue?");
      if (!confirm) return;
    }
    setSelectedBatches([]);
    setSelectedStudents([]);
    setSearchQuery("");
    setFilterDivision("all");
    setName("");
    setMergeMode(newMode);
    setError("");
  };

  const handleToggleBatch = (bId) => {
    let updated = [...selectedBatches];
    if (updated.includes(bId)) {
      updated = updated.filter(id => id !== bId);
    } else {
      updated.push(bId);
    }
    setSelectedBatches(updated);

    const selectedNames = batches.filter(b => updated.includes(b._id)).map(b => b.name);
    if (selectedNames.length > 0 && !name) {
      setName(selectedNames.join("-"));
    }
  };

  const handleToggleStudent = (sId) => {
    let updated = [...selectedStudents];
    if (updated.includes(sId)) {
      updated = updated.filter(id => id !== sId);
    } else {
      updated.push(sId);
    }
    setSelectedStudents(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Merged batch name is required");
      return;
    }

    if (mergeMode === "batch" && selectedBatches.length < 2) {
      setError("Please select at least 2 batches");
      return;
    }

    if (mergeMode === "students" && selectedStudents.length === 0) {
      setError("Please select at least 1 student");
      return;
    }

    setLoading(p => ({ ...p, submit: true }));
    setError("");

    try {
      const payload = {
        name: name.trim(),
        branchId: classData.branchId,
        year: classData.year,
        academicYear: classData.academicYear,
        sourceBatchIds: mergeMode === "batch" ? selectedBatches : [],
        studentIds: mergeMode === "students" ? selectedStudents : [],
        labRoom: labRoom.trim(),
        description: description.trim(),
      };

      await onSuccess(payload);
      onClose();
    } catch (err) {
      // Improved error message mapping could be done here if needed
      setError(err.message || "Failed to create merged batch");
    } finally {
      setLoading(p => ({ ...p, submit: false }));
    }
  };

  const filteredStudents = allStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || String(s.rollNo).includes(searchQuery);
    const matchesDiv = filterDivision === "all" || s.division === filterDivision;
    return matchesSearch && matchesDiv;
  });

  const selectedBatchObjects = batches.filter(b => selectedBatches.includes(b._id));
  const uniqueDivisions = [...new Set(selectedBatchObjects.map(b => b.division))];
  const totalStudentsSelected = selectedBatchObjects.reduce((acc, b) => acc + (b.students?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <GitMerge size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create Merged Batch</h2>
              <p className="text-xs text-slate-500 font-medium">
                Combine students across divisions for shared practicals
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => handleModeChange('batch')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                mergeMode === 'batch' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Select by Batch
            </button>
            <button
              onClick={() => handleModeChange('students')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                mergeMode === 'students' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Select Students
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 font-medium">
                <AlertCircle size={18} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Merged Batch Name *
              </label>
              <input
                type="text"
                placeholder="e.g. BA3-BB1 or Custom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-purple-600 outline-none"
                required
              />
            </div>

            {loading.data ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : mergeMode === "batch" ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Source Batches (At least 2 required)
                </label>
                {batches.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-xl border-slate-300">
                    <p className="text-slate-500 font-medium">No active batches found for Year {classData?.year}</p>
                    <p className="text-sm text-slate-400 mt-1">Please create regular batches first before merging.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-60 overflow-y-auto border border-slate-200/80 rounded-2xl bg-slate-50/50 p-3 custom-scrollbar">
                    {Object.entries(groupedBatches).map(([div, divBatches]) => (
                      <div key={div}>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Division {div}</h4>
                        <div className="space-y-1.5">
                          {divBatches.map(batch => {
                            const isSelected = selectedBatches.includes(batch._id);
                            return (
                              <div
                                key={batch._id}
                                onClick={() => handleToggleBatch(batch._id)}
                                className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors ${
                                  isSelected ? "bg-purple-50 border border-purple-300 text-purple-950 font-bold" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {isSelected ? <CheckSquare size={18} className="text-purple-600 shrink-0" /> : <Square size={18} className="text-slate-400 shrink-0" />}
                                <span className="ml-3 font-semibold text-sm flex-1">{batch.name}</span>
                                <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">{batch.students?.length || 0} students</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedBatches.length > 0 && (
                  <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm">
                    <h4 className="font-bold text-slate-900 mb-2">Merge Preview</h4>
                    <div className="space-y-1 text-slate-700">
                      <p>📚 Selected Batches: <strong className="text-slate-900">{selectedBatches.length}</strong></p>
                      <p>👥 Total Students: <strong className="text-slate-900">{totalStudentsSelected}</strong></p>
                      <p>🏛️ Divisions Involved: <strong className="text-slate-900">{uniqueDivisions.join(', ')}</strong></p>
                      <p>🎯 New Batch Name: <strong className="text-indigo-700 font-bold">{name || '-'}</strong></p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Individual Students ({selectedStudents.length} selected)
                </label>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search name or roll..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div className="relative w-1/3">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                      value={filterDivision}
                      onChange={e => setFilterDivision(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
                    >
                      <option value="all">All Divs</option>
                      {[...new Set(allStudents.map(s => s.division))].sort().map(d => (
                        <option key={d} value={d}>Div {d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {allStudents.length === 0 ? (
                   <div className="text-center py-8 border border-dashed rounded-xl border-slate-300 text-slate-500 text-sm font-medium">
                     No students found in this class.
                   </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm border rounded-xl">No matches found.</div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y custom-scrollbar">
                    {filteredStudents.map(student => (
                      <label key={student._id} className="flex items-center p-3 hover:bg-slate-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => handleToggleStudent(student._id)}
                          className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600"
                        />
                        <div className="ml-3 flex-1 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-bold text-slate-800 mr-2">{student.rollNo}</span>
                            <span className="text-sm font-medium text-slate-700">{student.name}</span>
                          </div>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold">Div {student.division}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {selectedStudents.length > 0 && (
                  <div className="mt-3 text-sm text-indigo-600 font-semibold">
                    Selected: {selectedStudents.length} students
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Lab Room (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Lab-401"
                  value={labRoom}
                  onChange={(e) => setLabRoom(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Merging rationale"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={loading.submit} className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer">
                {loading.submit ? <RefreshCw size={16} className="animate-spin" /> : <GitMerge size={16} />}
                <span>Create Merged Batch</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
