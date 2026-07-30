/**
 * DAILY REPORT GENERATOR
 * Generates WhatsApp-friendly attendance report text.
 */

const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const getYearLabel = (year) => {
  const map = {
    1: "FE",
    2: "SE",
    3: "TE",
    4: "BE"
  };
  return map[year] || `Year ${year}`;
};

const getBranchLabel = (branchCode, branchName) => {
  const normalizedCode = String(branchCode || "").trim().toUpperCase();
  const normalizedName = String(branchName || "").trim().toLowerCase();

  if (normalizedCode === "COMP" || normalizedCode === "COMPUTER") return "Comp";
  if (normalizedCode === "IT") return "IT";
  if (normalizedCode === "ENTC") return "ENTC";
  if (normalizedCode === "MECH") return "Mech";
  if (normalizedCode === "CIVIL") return "Civil";

  if (normalizedName.includes("computer")) return "Comp";
  if (normalizedName.includes("information")) return "IT";
  if (normalizedName.includes("electronics")) return "ENTC";
  if (normalizedName.includes("mechanical")) return "Mech";
  if (normalizedName.includes("civil")) return "Civil";

  return "";
};

const formatAcademicYearShort = (academicYear) => {
  const yearText = String(academicYear || "").trim();
  const match = yearText.match(/^(\d{4})-(\d{4})$/);

  if (!match) {
    return yearText || "2026-27";
  }

  const [, startYear, endYear] = match;
  return `${startYear}-${endYear.slice(-2)}`;
};

const formatTimeForReport = (time) => {
  if (!time || typeof time !== "string") return "";

  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;

  const period = hour >= 12 ? "pm" : "Am";
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, "0")}.${String(minute).padStart(2, "0")} ${period}`;
};

/**
 * Generate daily attendance report text
 * 
 * @param {Object} attendanceSession - Attendance session record
 * @param {Array} absentStudents - Array of { rollNo, name }
 * @param {Object} teacher - Teacher user document
 * @param {Object} subject - Subject document
 * @returns {String} WhatsApp report text
 */
export const generateDailyReport = (
  attendanceSession,
  absentStudents,
  teacher,
  subject
) => {
  const branchLabel = getBranchLabel(attendanceSession.branchCode, attendanceSession.branchName);
  const classLabel = branchLabel
    ? `${getYearLabel(attendanceSession.year)} ${branchLabel} Div: ${attendanceSession.division}`
    : `${getYearLabel(attendanceSession.year)} Div: ${attendanceSession.division}`;
  const dateText = formatDate(attendanceSession.date).replace(/-/g, "/");
  const startTime = formatTimeForReport(attendanceSession.startTime);
  const endTime = formatTimeForReport(attendanceSession.endTime);
  const timeText = startTime && endTime ? `${startTime} to ${endTime}` : "";

  let report = "Daily Attendance Report\n";
  report += `Class: ${classLabel}\n`;
  report += `A.Y.: ${formatAcademicYearShort(attendanceSession.academicYear)}\n`;
  report += `Subject: ${subject?.name || ""}\n`;
  report += `Date: ${dateText}\n`;
  report += `Time: ${timeText}\n`;
  report += `Subject Teacher: ${teacher?.name || ""}\n\n`;
  report += "Details of Absent Students\n";
  report += "Roll No.  Name of the Students\n";

  if (absentStudents.length === 0) {
    report += "Nil\n";
    return report;
  }

  absentStudents.forEach((student) => {
    report += `${student.rollNo}  ${student.name}\n`;
  });

  return report;
};
