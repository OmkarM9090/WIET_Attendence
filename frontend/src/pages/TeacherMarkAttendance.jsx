import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import ReportPreview from "../components/ReportPreview";
import EditAttendanceModal from "../components/EditAttendanceModal";
import { getMyTeachingAssignments } from "../services/teacherService";
import axiosInstance from "../utils/axios";
import SessionSelector from "../components/teacher/SessionSelector";
import StudentAttendanceList from "../components/teacher/StudentAttendanceList";
import { LayoutDashboard, UserCheck, History, FileText, Calendar, CheckCircle2, AlertTriangle, Info, BookOpen, Inbox, ArrowLeft } from "lucide-react";

export default function TeacherMarkAttendance() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dateError, setDateError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentError, setStudentError] = useState("");
  const [selectedAbsentStudents, setSelectedAbsentStudents] = useState([]);
  const [rollNumberInput, setRollNumberInput] = useState("");
  const [rollNumberError, setRollNumberError] = useState("");

  const [savingReport, setSavingReport] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");
  const [isUpdatingExcel, setIsUpdatingExcel] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [savedAttendanceId, setSavedAttendanceId] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [existingAttendanceId, setExistingAttendanceId] = useState(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const sidebarItems = [
    { label: "Dashboard", path: "/teacher", icon: <LayoutDashboard size={20} /> },
    { label: "Mark Attendance", path: "/teacher/mark-attendance", icon: <UserCheck size={20} /> },
    { label: "View Attendance", path: "/teacher/attendance-history", icon: <History size={20} /> },
    { label: "Reports", path: "/teacher/reports", icon: <FileText size={20} /> },
  ];

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (sessionId && assignments.length > 0) {
      const selected = assignments.find((a) => a._id === sessionId);
      if (selected) {
        setSelectedAssignment(selected);
        setError("");
      } else {
        setSelectedAssignment(null);
        setError("Teaching session not found or you do not have permission to access it.");
      }
    } else if (!sessionId) {
      setSelectedAssignment(null);
    }
  }, [sessionId, assignments]);

  useEffect(() => {
    if (selectedAssignment && selectedDate && !dateError) {
      fetchStudentsForSession();
    } else {
      setStudents([]);
      setSelectedAbsentStudents([]);
      setRollNumberInput("");
      setRollNumberError("");
      setReportText("");
      setReportError("");
    }
  }, [selectedAssignment, selectedDate, dateError]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyTeachingAssignments();
      setAssignments(data);
    } catch (err) {
      setError(err.message || "Failed to fetch teaching assignments");
      console.error("Error fetching assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = (assignmentId) => {
    if (!assignmentId) return;
    navigate(`/teacher/mark-attendance/${assignmentId}`);
  };

  const handleDateChange = (e) => {
    const selectedDateValue = e.target.value;
    setSelectedDate(selectedDateValue);

    const validation = validateDate(selectedDateValue);
    if (validation.isValid) {
      setDateError("");
    } else {
      setDateError(validation.error);
    }
  };

  const validateDate = (dateString) => {
    if (!dateString) {
      return { isValid: false, error: "Please select a date" };
    }

    const selectedDateObj = new Date(dateString + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (selectedDateObj > today) {
      return {
        isValid: false,
        error: "Cannot mark attendance for future dates. Please select today or yesterday.",
      };
    }

    if (selectedDateObj < yesterday) {
      return {
        isValid: false,
        error: "Cannot mark attendance for dates older than yesterday. Please select today or yesterday.",
      };
    }

    return { isValid: true, error: "" };
  };

  const getDatePickerLimits = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return {
      min: yesterday.toISOString().split("T")[0],
      max: today.toISOString().split("T")[0],
    };
  };

  const isContinueEnabled = () => {
    return selectedAssignment && selectedDate && !dateError;
  };

  const fetchStudentsForSession = async () => {
    try {
      setLoadingStudents(true);
      setStudentError("");

      const response = await axiosInstance.get(
        "/attendance/students-for-session",
        {
          params: {
            teachingAssignmentId: selectedAssignment._id,
          },
        }
      );

      if (response.data.success) {
        let fetchedStudents = response.data.data || [];
        fetchedStudents.sort((a, b) => {
          const rollA = String(a.rollNo || "").padStart(15, '0');
          const rollB = String(b.rollNo || "").padStart(15, '0');
          if (rollA !== rollB) return rollA.localeCompare(rollB);

          const nameA = String(a.name || "").toLowerCase();
          const nameB = String(b.name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setStudents(fetchedStudents);
        setReportText("");
        setReportError("");
        setReportSuccess("");
      } else {
        setStudentError(response.data.message || "Failed to fetch students");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudentError(
        err.response?.data?.message || "Failed to fetch students for this session"
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleAbsentStudent = (studentId) => {
    setSelectedAbsentStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleAddRollNumbers = () => {
    if (!rollNumberInput.trim()) return;

    const rollNumbers = rollNumberInput
      .split(/[,\s]+/)
      .map((roll) => roll.trim())
      .filter((roll) => roll);

    const matchingStudents = students.filter((student) =>
      rollNumbers.includes(student.rollNo?.toString())
    );

    const missingRolls = rollNumbers.filter(
      (roll) => !students.some((student) => student.rollNo?.toString() === roll)
    );

    if (missingRolls.length > 0) {
      setRollNumberError(`Invalid roll numbers: ${missingRolls.join(", ")}`);
    } else {
      setRollNumberError("");
    }

    const newAbsentIds = matchingStudents
      .map((s) => s._id)
      .filter((id) => !selectedAbsentStudents.includes(id));

    if (newAbsentIds.length > 0) {
      setSelectedAbsentStudents((prev) => [...prev, ...newAbsentIds]);
    }

    setRollNumberInput("");
  };

  const handleSaveAttendance = async () => {
    try {
      setSavingReport(true);
      setReportError("");

      if (!selectedAssignment || !selectedDate) {
        setReportError("Please select a session and date");
        return;
      }

      if (studentError) {
        setReportError("Fix student list errors before saving");
        return;
      }

      const studentMap = new Map(students.map((s) => [s._id, s]));
      const absentRollNumbers = selectedAbsentStudents
        .map((id) => studentMap.get(id))
        .filter(Boolean)
        .map((s) => s.rollNo);

      const missingIds = selectedAbsentStudents.filter((id) => !studentMap.has(id));
      if (missingIds.length > 0) {
        setReportError("Some selected students are missing roll numbers");
        return;
      }

      const response = await axiosInstance.post(
        "/attendance/mark-and-generate",
        {
          teachingAssignmentId: selectedAssignment._id,
          date: selectedDate,
          absentRollNumbers
        }
      );

      if (response.data?.alreadyExists === true) {
        setExistingAttendanceId(response.data.attendanceId);
        setShowEditModal(true);
        return;
      }

      if (response.data?.success) {
        setReportText(response.data.reportText || "");
        setSavedAttendanceId(response.data.attendance?._id || null);
        setReportError("");
      } else {
        setReportError(response.data?.message || "Failed to save attendance");
      }
    } catch (err) {
      console.error("Save attendance error:", err);

      if (err.response?.status === 409 && err.response?.data?.alreadyExists) {
        const attendanceId = err.response?.data?.attendanceId;
        if (attendanceId) {
          setExistingAttendanceId(attendanceId);
          setShowEditModal(true);
        } else {
          setReportError(
            "Attendance already exists. Please refresh and try editing the existing record."
          );
        }
        return;
      }

      setReportError(
        err.response?.data?.message || "Failed to save attendance"
      );
    } finally {
      setSavingReport(false);
    }
  };

  const handleEditAttendance = async () => {
    try {
      setSavingReport(true);
      setShowEditModal(false);
      setReportError("");

      const studentMap = new Map(students.map((s) => [s._id, s]));
      const absentRollNumbers = selectedAbsentStudents
        .map((id) => studentMap.get(id))
        .filter(Boolean)
        .map((s) => s.rollNo);

      const response = await axiosInstance.put(
        `/attendance/update/${existingAttendanceId}`,
        {
          absentRollNumbers
        }
      );

      if (response.data?.success) {
        setReportText(response.data.reportText || "");
        setSavedAttendanceId(existingAttendanceId);
        setIsEditingExisting(true);
        setReportError("");
      } else {
        setReportError(response.data?.message || "Failed to update attendance");
        setShowEditModal(true);
      }
    } catch (err) {
      console.error("Edit attendance error:", err);
      setReportError(
        err.response?.data?.message || "Failed to update attendance"
      );
      setShowEditModal(true);
    } finally {
      setSavingReport(false);
    }
  };

  const handleUpdateExcel = async () => {
    try {
      setIsUpdatingExcel(true);
      setReportError("");
      setReportSuccess("");

      if (!savedAttendanceId) {
        setReportError("No attendance session to update Excel for");
        return;
      }

      const response = await axiosInstance.post(
        `/attendance/update-excel/${savedAttendanceId}`
      );

      if (response.data?.success) {
        if (response.data.skipped) {
          setReportError("Excel update skipped (cancelled/holiday session)");
        } else {
          setReportError("");
          setReportSuccess("Excel file updated successfully!");
          setTimeout(() => {
            setReportSuccess("");
          }, 3000);
        }
      } else {
        setReportError(response.data?.message || "Failed to update Excel");
      }
    } catch (err) {
      console.error("Excel update error:", err);
      setReportError(
        err.response?.data?.message || "Failed to update Excel file"
      );
    } finally {
      setIsUpdatingExcel(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setIsDownloadingExcel(true);
      setReportError("");
      setReportSuccess("");

      if (!savedAttendanceId) {
        setReportError("No attendance session to download Excel for");
        return;
      }

      const response = await axiosInstance.get(
        `/attendance/download-excel/${savedAttendanceId}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'Attendance.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch.length === 2)
          filename = filenameMatch[1];
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      setReportError("");
      setReportSuccess("Download started!");
      setTimeout(() => {
        setReportSuccess("");
      }, 3000);

    } catch (err) {
      console.error("Excel download error:", err);

      if (err.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            setReportError(errorData.message || "Failed to download Excel file");
          } catch (e) {
            setReportError("Failed to download Excel file");
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setReportError(
          err.response?.data?.message || "Failed to download Excel file"
        );
      }
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setExistingAttendanceId(null);
  };

  const handleCopyReport = async () => {
    if (!reportText) return;
    await navigator.clipboard.writeText(reportText);
  };

  const handleShareWhatsApp = () => {
    if (!reportText) return;
    const url = `https://wa.me/?text=${encodeURIComponent(reportText)}`;
    window.open(url, "_blank");
  };

  const renderSessionDetails = () => {
    if (!selectedAssignment) return null;

    const {
      subject,
      branch,
      year,
      division,
      batch,
      dayOfWeek,
      startTime,
      endTime,
      sessionType,
      academicYear,
    } = selectedAssignment;

    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs mb-6">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          Session Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</span>
            <span className="font-bold text-slate-900">{subject?.name} ({subject?.code})</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch & Class</span>
            <span className="font-semibold text-slate-900">{branch?.name} • Year {year} Div {division}</span>
          </div>

          {batch && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Batch</span>
              <span className="font-semibold text-slate-900">{batch.name}</span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule</span>
            <span className="font-bold text-slate-900 font-mono">{dayOfWeek}, {startTime} – {endTime}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session Type</span>
            <div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${
                  sessionType === "PRACTICAL"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {sessionType}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Year</span>
            <span className="font-semibold text-slate-900">{academicYear}</span>
          </div>
        </div>
      </div>
    );
  };

  const pageTitle = sessionId && selectedAssignment 
    ? `Mark Attendance: ${selectedAssignment.subject?.name || 'Session'}`
    : "Mark Attendance";

  const pageSubtitle = sessionId && selectedAssignment
    ? `Year ${selectedAssignment.year} Div ${selectedAssignment.division} • ${selectedAssignment.startTime} - ${selectedAssignment.endTime}`
    : "Select teaching session to mark attendance";

  return (
    <DashboardLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      sidebarItems={sidebarItems}
    >
      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {assignments.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
              <Inbox size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                No Teaching Sessions Assigned
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
                You do not have any active teaching assignments for this academic year. Please contact the administrator.
              </p>
            </div>
          ) : !sessionId ? (
            /* SESSION SELECTION PAGE */
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs mb-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-xs">
                  1
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Select Teaching Session
                </h3>
              </div>

              <div className="mt-4">
                <SessionSelector
                  assignments={assignments}
                  selectedAssignmentId=""
                  onSelect={(id) => handleSessionSelect(id)}
                />
              </div>

              {assignments.length > 0 && (
                <p className="mt-4 text-xs text-slate-500 font-medium italic">
                  Click on any teaching session card above to mark attendance for that session. Found {assignments.length} session{assignments.length > 1 ? "s" : ""}.
                </p>
              )}
            </div>
          ) : (
            /* DEDICATED MARK ATTENDANCE PAGE FOR SPECIFIC SESSION */
            <>
              {/* Back Button Bar */}
              <div className="mb-6">
                <button
                  onClick={() => navigate("/teacher/mark-attendance")}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft size={18} className="text-slate-500" />
                  Back to Teaching Sessions
                </button>
              </div>

              {/* Session Details Card */}
              {renderSessionDetails()}

              {/* Step 1: Date Selection */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-xs">
                    1
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Select Attendance Date
                  </h3>
                </div>

                <FormInput
                  label="Date"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={getDatePickerLimits().min}
                  max={getDatePickerLimits().max}
                  required
                  icon={<Calendar size={16} />}
                />

                <p className="mt-2 text-xs text-slate-500 font-medium">
                  You can mark attendance only for today or yesterday
                </p>

                {dateError && (
                  <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-semibold">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <p>{dateError}</p>
                  </div>
                )}
              </div>

              {/* Step 2: Student List */}
              {selectedAssignment && selectedDate && !dateError && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-xs">
                      2
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Student Attendance Roll Call
                    </h3>
                  </div>

                  {studentError && (
                    <div className="mb-4">
                      <Alert type="error" message={studentError} />
                    </div>
                  )}

                  {loadingStudents ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <LoadingSpinner />
                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        Loading student list...
                      </p>
                    </div>
                  ) : students.length === 0 && !studentError ? (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-8 text-center">
                      <BookOpen size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="text-xs font-semibold text-slate-600">
                        No students found for this session
                      </p>
                    </div>
                  ) : (
                    <StudentAttendanceList
                      students={students}
                      selectedAbsentStudents={selectedAbsentStudents}
                      toggleAbsentStudent={toggleAbsentStudent}
                      selectedAssignment={selectedAssignment}
                      rollNumberInput={rollNumberInput}
                      setRollNumberInput={setRollNumberInput}
                      handleAddRollNumbers={handleAddRollNumbers}
                      rollNumberError={rollNumberError}
                    />
                  )}
                </div>
              )}

              {/* Action Button */}
              {selectedAssignment && (
                <div className="mt-6 flex flex-wrap justify-end gap-3 w-full border-t border-slate-200/80 pt-6">
                  <Button
                    onClick={handleSaveAttendance}
                    disabled={
                      !isContinueEnabled() ||
                      loadingStudents ||
                      !!studentError ||
                      !!rollNumberError ||
                      students.length === 0 ||
                      savingReport
                    }
                    loading={savingReport}
                    variant="primary"
                    size="lg"
                  >
                    Save Attendance & Generate Report
                  </Button>
                </div>
              )}

              {reportError && (
                <div className="mt-4">
                  <Alert type="error" message={reportError} />
                </div>
              )}
              {reportSuccess && (
                <div className="mt-4">
                  <Alert type="success" message={reportSuccess} />
                </div>
              )}

              {reportText && (
                <ReportPreview
                  reportText={reportText}
                  onCopy={handleCopyReport}
                  onShare={handleShareWhatsApp}
                  onUpdateExcel={handleUpdateExcel}
                  isUpdatingExcel={isUpdatingExcel}
                  onDownloadExcel={handleDownloadExcel}
                  isDownloadingExcel={isDownloadingExcel}
                  attendanceId={savedAttendanceId}
                />
              )}
            </>
          )}
        </>
      )}

      <EditAttendanceModal
        isOpen={showEditModal}
        onClose={handleCancelEdit}
        onEdit={handleEditAttendance}
        isLoading={savingReport}
      />

      <div className="mt-8 p-4 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-600 flex gap-2.5 items-start font-medium shadow-xs">
        <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Note:</strong> Only your assigned teaching sessions for the current academic year are displayed. After marking attendance, click "Save Attendance" to log entries and generate reports.
        </p>
      </div>
    </DashboardLayout>
  );
}
