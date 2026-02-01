/**
 * DATE VALIDATOR UTILITY
 * 
 * Validates attendance dates to ensure:
 * - No future dates
 * - No dates older than yesterday
 * - Only today or yesterday are allowed
 */

/**
 * Validate if a date is allowed for attendance marking
 * 
 * Rules:
 * - Date must be today or yesterday
 * - Future dates are NOT allowed
 * - Dates older than yesterday are NOT allowed
 * 
 * @param {String|Date} date - Date to validate (ISO string or Date object)
 * @returns {Boolean} - Returns true if valid, throws error if invalid
 * @throws {Error} - Throws error with descriptive message for invalid dates
 */
const validateAttendanceDate = (date) => {
  // Convert input to Date object
  const inputDate = new Date(date);
  
  // Check if date is invalid
  if (isNaN(inputDate.getTime())) {
    throw new Error("Invalid date format provided");
  }

  // Get today at midnight (00:00:00)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get yesterday at midnight (00:00:00)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Set input date to midnight for comparison
  const dateToCheck = new Date(inputDate);
  dateToCheck.setHours(0, 0, 0, 0);

  // Validate: date must not be in the future
  if (dateToCheck > today) {
    throw new Error("Cannot mark attendance for future dates. Please select today or yesterday.");
  }

  // Validate: date must not be older than yesterday
  if (dateToCheck < yesterday) {
    throw new Error("Cannot mark attendance for dates older than yesterday. Please select today or yesterday.");
  }

  // Date is valid (today or yesterday)
  return true;
};

/**
 * Get allowed date range for attendance marking
 * 
 * @returns {Object} - Object with yesterday and today dates
 */
const getAllowedDateRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    yesterday: yesterday.toISOString().split('T')[0],
    today: today.toISOString().split('T')[0],
    yesterdayDate: yesterday,
    todayDate: today
  };
};

/**
 * Check if a date is today
 * 
 * @param {String|Date} date - Date to check
 * @returns {Boolean} - True if date is today
 */
const isToday = (date) => {
  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return inputDate.getTime() === today.getTime();
};

/**
 * Check if a date is yesterday
 * 
 * @param {String|Date} date - Date to check
 * @returns {Boolean} - True if date is yesterday
 */
const isYesterday = (date) => {
  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return inputDate.getTime() === yesterday.getTime();
};

export {
  validateAttendanceDate,
  getAllowedDateRange,
  isToday,
  isYesterday
};
