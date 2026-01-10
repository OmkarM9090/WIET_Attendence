/**
 * AUTH SERVICE
 * Handles all authentication-related API calls
 * Login, Forgot Password, Reset Password, User Registration
 */

import axiosInstance from "../utils/axios.js";

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} Response with token, role, name
 */
export const loginUser = async (email, password) => {
  try {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

/**
 * Request password reset OTP
 * @param {string} email - User email
 * @returns {Promise} Success message
 */
export const forgotPassword = async (email) => {
  try {
    const response = await axiosInstance.post("/auth/forgot-password", {
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Request failed" };
  }
};

/**
 * Reset password with OTP
 * @param {string} email - User email
 * @param {string} otp - OTP from email
 * @param {string} newPassword - New password
 * @returns {Promise} Success message
 */
export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await axiosInstance.post("/auth/reset-password", {
      email,
      otp,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Reset failed" };
  }
};

/**
 * Register new user (Admin only)
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} Success message
 */
export const registerUser = async (name, email, password) => {
  try {
    const response = await axiosInstance.post("/auth/register", {
      name,
      email,
      password,
      role: "admin",
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Registration failed" };
  }
};

