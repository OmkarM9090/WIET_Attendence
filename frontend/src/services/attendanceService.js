/**
 * ATTENDANCE SERVICE
 * Handles attendance marking, retrieval, and defaulter generation
 */

import axiosInstance from "../utils/axios.js";

// ============ ATTENDANCE MARKING ============

/**
 * Create/Mark attendance for a session
 * @param {object} attendanceData - Attendance details
 * - date: Session date (YYYY-MM-DD)
 * - subjectId: Subject ID
 * - branchId: Branch ID
 * - year: Year (e.g., 1, 2, 3)
 * - division: Division (e.g., "A", "B")
 * - academicYear: Academic Year (e.g., "2024-2025") - REQUIRED
 * - sessionType: "LECTURE" or "PRACTICAL"
 * - batch: Batch number (required only for PRACTICAL)
 * - absentStudentIds: Array of absent student IDs
 */
export const createAttendance = async (attendanceData) => {
  try {
    const response = await axiosInstance.post("/attendance", attendanceData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to save attendance" };
  }
};

// ============ ATTENDANCE RETRIEVAL ============

/**
 * Get attendance sessions for logged-in teacher
 */
export const getTeacherAttendance = async () => {
  try {
    const response = await axiosInstance.get("/attendance");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch attendance" };
  }
};

/**
 * Get monthly attendance summary
 * @param {object} filters - Query parameters
 * - branchId: Branch ID (required for admin, optional for teacher)
 * - year: Year
 * - division: Division
 * - academicYear: Academic Year (e.g., "2024-2025") - REQUIRED
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 */
export const getMonthlyAttendance = async (filters = {}) => {
  try {
    const response = await axiosInstance.get("/attendance/monthly", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch monthly attendance" };
  }
};

// ============ DEFAULTERS MANAGEMENT ============

/**
 * Generate defaulters report for a class
 * @param {object} filters - Query parameters
 * - branchId: Branch ID (required)
 * - year: Year (required)
 * - division: Division (required)
 * - academicYear: Academic Year (e.g., "2024-2025") - REQUIRED
 * - startDate: Start date (required, YYYY-MM-DD)
 * - endDate: End date (required, YYYY-MM-DD)
 * - threshold: Attendance threshold (default 75)
 */
export const generateDefaulters = async (filters) => {
  try {
    const response = await axiosInstance.get("/attendance/defaulters", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to generate defaulters report" };
  }
};

/**
 * Get defaulters report (may be same as generateDefaulters depending on backend)
 */
export const getDefaultersReport = async (filters) => {
  try {
    const response = await axiosInstance.get("/defaulters", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch defaulters report" };
  }
};

/**
 * Export defaulters report to PDF
 */
export const exportDefaultersPDF = async (filters) => {
  try {
    const response = await axiosInstance.get("/reports/defaulters/pdf", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to export PDF" };
  }
};

/**
 * Export defaulters report to Excel
 */
export const exportDefaultersExcel = async (filters) => {
  try {
    const response = await axiosInstance.get("/reports/defaulters/excel", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to export Excel" };
  }
};
