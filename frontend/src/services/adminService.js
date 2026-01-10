/**
 * ADMIN SERVICE
 * Handles all admin-related API calls
 * Branch management, Subject management, Teacher assignment, Student management
 */

import axiosInstance from "../utils/axios.js";

// ============ BRANCH MANAGEMENT ============

/**
 * Create a new branch
 * @param {string} name - Branch name (e.g., "Computer Science")
 * @param {string} code - Branch code (e.g., "CS")
 */
export const createBranch = async (name, code) => {
  try {
    const response = await axiosInstance.post("/admin/branches", {
      name,
      code,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create branch" };
  }
};

/**
 * Get all branches
 */
export const getBranches = async () => {
  try {
    const response = await axiosInstance.get("/admin/branches");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch branches" };
  }
};

// ============ SUBJECT MANAGEMENT ============

/**
 * Create a new subject
 * @param {string} name - Subject name
 * @param {string} code - Subject code
 * @param {string} branch - Branch ID
 * @param {number} semester - Semester number
 */
export const createSubject = async (name, code, branch, semester) => {
  try {
    const response = await axiosInstance.post("/admin/subjects", {
      name,
      code,
      branch,
      semester,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create subject" };
  }
};

/**
 * Get subjects with optional filters
 * @param {string} branch - Filter by branch ID (optional)
 * @param {number} semester - Filter by semester (optional)
 */
export const getSubjects = async (branch = null, semester = null) => {
  try {
    const params = {};
    if (branch) params.branch = branch;
    if (semester) params.semester = semester;

    const response = await axiosInstance.get("/admin/subjects", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch subjects" };
  }
};

// ============ STUDENT MANAGEMENT ============

/**
 * Create a new student
 * @param {object} studentData - Student information
 */
export const createStudent = async (studentData) => {
  try {
    const response = await axiosInstance.post("/admin/students", studentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create student" };
  }
};

/**
 * Get all students with optional filters
 * @param {string} branch - Filter by branch ID
 * @param {number} year - Filter by year
 * @param {string} division - Filter by division
 */
export const getStudents = async (branch = null, year = null, division = null, search = null) => {
  try {
    const params = {};
    if (branch) params.branch = branch;
    if (year) params.year = year;
    if (division) params.division = division;
    if (search) params.search = search;

    const response = await axiosInstance.get("/admin/students", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch students" };
  }
};

/**
 * Upload students via Excel file
 * @param {File} file - Excel file containing student data
 */
export const uploadStudentsExcel = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post(
      "/admin/students/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to upload students" };
  }
};

/**
 * Update a student
 */
export const updateStudent = async (id, studentData) => {
  try {
    const response = await axiosInstance.patch(`/admin/students/${id}`, studentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update student" };
  }
};

/**
 * Delete a student
 */
export const deleteStudent = async (id) => {
  try {
    const response = await axiosInstance.delete(`/admin/students/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete student" };
  }
};

// ============ TEACHER MANAGEMENT ============

/**
 * Create a new teacher
 * @param {object} teacherData - Teacher information
 */
export const createTeacher = async (teacherData) => {
  try {
    const response = await axiosInstance.post("/admin/teachers", teacherData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create teacher" };
  }
};

/**
 * Assign a teacher to a subject for a specific class
 * @param {object} assignmentData - Assignment details
 */
export const assignTeacher = async (assignmentData) => {
  try {
    const response = await axiosInstance.post(
      "/admin/assign-teacher",
      assignmentData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to assign teacher" };
  }
};

/**
 * Get all teachers (populated with user + department)
 */
export const getTeachers = async () => {
  try {
    const response = await axiosInstance.get("/admin/teachers");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch teachers" };
  }
};
