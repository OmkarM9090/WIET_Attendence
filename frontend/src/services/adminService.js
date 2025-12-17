import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Get token from localStorage
const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token;
};

// Create axios instance with auth header
const axiosInstance = axios.create({
  baseURL: API,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Branches
export const createBranch = (data) =>
  axiosInstance.post("/admin/branches", data);

export const getBranches = () =>
  axiosInstance.get("/admin/branches");

// Subjects
export const createSubject = (data) =>
  axiosInstance.post("/admin/subjects", data);

export const getSubjects = () =>
  axiosInstance.get("/admin/subjects");
