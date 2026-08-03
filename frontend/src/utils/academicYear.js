/**
 * Dynamic Academic Year Helper
 * Calculates the current academic year dynamically based on today's date.
 * Academic year transitions in June (Month index 5).
 */

export const getCurrentAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth(); // 0 = Jan, 5 = June
  const year = now.getFullYear();
  const startYear = month >= 5 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

export const getAcademicYearOptions = () => {
  const current = getCurrentAcademicYear();
  const [start] = current.split("-").map(Number);

  return [
    `${start - 1}-${start}`,
    current,
    `${start + 1}-${start + 2}`,
  ];
};
