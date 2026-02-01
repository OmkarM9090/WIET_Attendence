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
  const classLabel = `${getYearLabel(attendanceSession.year)} Div ${attendanceSession.division}`;
  const dateText = formatDate(attendanceSession.date);
  const timeText = `${attendanceSession.startTime || ""} to ${attendanceSession.endTime || ""}`.trim();

  let report = "Watumull College of Engineering and Technology\n\n";
  report += "Daily Attendance Report\n";
  report += `Class: ${classLabel}\n`;
  report += `Subject: ${subject?.name || ""}\n`;
  report += `Date: ${dateText}\n`;
  report += `Time: ${timeText}\n`;
  report += `Teacher: ${teacher?.name || ""}\n\n`;
  report += "Absent Students:\n";
  report += "Roll No   Name\n";

  if (absentStudents.length === 0) {
    report += "--      None\n";
    return report;
  }

  absentStudents.forEach((student) => {
    report += `${student.rollNo}   ${student.name}\n`;
  });

  return report;
};
