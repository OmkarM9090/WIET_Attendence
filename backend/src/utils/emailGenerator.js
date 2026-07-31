/**
 * Generates a unique student email from roll number, branch code, and admission year.
 * Format: {rollNo}.{branchCode}.{admissionYear}@{domain}
 */
export const generateStudentEmail = (rollNumber, branchCode, admissionYear) => {
  if (!rollNumber || !branchCode || !admissionYear) {
    throw new Error("Roll number, branch code, and admission year are required.");
  }

  const cleanRoll = String(rollNumber).trim();
  const cleanBranch = String(branchCode).trim().toLowerCase();
  const cleanYear = Number(admissionYear);

  if (!/^\d+$/.test(cleanRoll)) {
    throw new Error("Roll number must contain digits only.");
  }

  if (!cleanBranch) {
    throw new Error("Branch code is required.");
  }

  if (!Number.isInteger(cleanYear) || cleanYear < 2000 || cleanYear > 2100) {
    throw new Error("Admission year must be a valid year between 2000 and 2100.");
  }

  const domain = process.env.COLLEGE_EMAIL_DOMAIN || "college.edu";
  return `${cleanRoll}.${cleanBranch}.${cleanYear}@${domain}`;
};

/**
 * Calculates admission year from the student's current year and the academic year string.
 * Example: current year 4 in academic year 2026-2027 => admission year 2023
 */
export const calculateAdmissionYear = (currentYear, academicYearString) => {
  if (!currentYear || !academicYearString) {
    throw new Error("Current year and academic year are required.");
  }

  const yearNum = Number(currentYear);
  if (!Number.isInteger(yearNum) || yearNum < 1 || yearNum > 4) {
    throw new Error("Current year must be 1, 2, 3, or 4.");
  }

  const academicYear = String(academicYearString).trim();
  const match = academicYear.match(/^(\d{4})-(\d{4})$/);
  if (!match) {
    throw new Error('Academic year must be in "YYYY-YYYY" format.');
  }

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (endYear !== startYear + 1) {
    throw new Error('Academic year must be in sequential "YYYY-YYYY" format.');
  }

  return startYear - (yearNum - 1);
};

/**
 * Returns the current academic year.
 * July onwards is treated as the start of the new academic year.
 */
export const getCurrentAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (month >= 7) {
    return `${year}-${year + 1}`;
  }

  return `${year - 1}-${year}`;
};
