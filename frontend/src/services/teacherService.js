/**
 * TEACHER SERVICE
 * API calls for teacher-related operations
 * Used in Teacher Dashboard pages
 */

import axiosInstance from "../utils/axios";

/**
 * Get my teaching assignments
 * Fetches all active teaching assignments for logged-in teacher
 * Used in attendance marking dropdown
 * 
 * @returns {Promise<Array>} List of teaching assignments
 */
export const getMyTeachingAssignments = async () => {
  try {
    const response = await axiosInstance.get("/teacher/my-assignments");
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching my teaching assignments:", error);
    throw error.response?.data || { message: "Failed to fetch teaching assignments" };
  }
};

/**
 * Get teacher profile
 * @returns {Promise<Object>} Teacher profile data
 */
export const getTeacherProfile = async () => {
  try {
    const response = await axiosInstance.get("/teacher/me");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch teacher profile" };
  }
};

/**
 * Get dashboard statistics for teacher
 * @returns {Promise<Object>} Dashboard statistics
 */
export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get("/teacher/dashboard-stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch dashboard stats" };
  }
};

