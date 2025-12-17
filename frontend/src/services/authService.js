import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Get token from localStorage
const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token;
};

export const loginUser = (data) =>
  axios.post(`${API}/auth/login`, data);

export const forgotPassword = (data) =>
  axios.post(`${API}/auth/forgot-password`, data);

export const resetPassword = (data) =>
  axios.post(`${API}/auth/reset-password`, data);

// ADMIN CREATE USER (SIGNUP) - requires authentication
export const registerUser = (data) => {
  const token = getToken();
  return axios.post(`${API}/auth/register`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

