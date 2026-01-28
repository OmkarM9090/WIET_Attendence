/**
 * AXIOS INSTANCE - Centralized HTTP Client
 * Handles base URL, default headers, interceptors, and error handling
 * Token management for authentication
 */

import axios from "axios";

// Get base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Create Axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle auth errors and format responses
axiosInstance.interceptors.response.use(
  (response) => {
    // Return the response data directly
    return response;
  },
  (error) => {
    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      // If 401 Unauthorized, token is invalid/expired
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(new Error("Session expired. Please login again."));
      }

      // If 403 Forbidden
      if (status === 403) {
        return Promise.reject(new Error(data.message || "Access denied"));
      }

      // Other errors
      const message = data.message || data.error || "An error occurred";
      error.message = message;
    } else if (error.request) {
      // Request made but no response received
      error.message = "Network error. Please check your connection.";
    } else {
      // Something else happened
      error.message = error.message || "An unexpected error occurred";
    }

    console.error("API Error:", error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
