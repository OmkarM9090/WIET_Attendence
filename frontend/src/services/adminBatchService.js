/**
 * ADMIN BATCH SERVICE
 * Handles API communications for Batch Management (CRUD, Auto-Setup, Merging, Membership)
 */

import axiosInstance from "../utils/axios.js";

/**
 * Get all batches for a class
 * @param {Object} filters { branchId, year, division, academicYear }
 */
export const getBatches = async (filters = {}) => {
  try {
    const response = await axiosInstance.get("/admin/batches", { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch batches" };
  }
};

export const getBatchesByClass = getBatches;

/**
 * Get single batch details
 * @param {string} id 
 */
export const getBatch = async (id) => {
  try {
    const response = await axiosInstance.get(`/admin/batches/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch batch details" };
  }
};

/**
 * Quick auto-setup batches
 * @param {Object} data 
 */
export const quickSetupBatches = async (data) => {
  try {
    const response = await axiosInstance.post("/admin/batches/quick-setup", data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to execute quick setup" };
  }
};

/**
 * Create custom batch
 * @param {Object} data 
 */
export const createBatch = async (data) => {
  try {
    const response = await axiosInstance.post("/admin/batches", data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create batch" };
  }
};

/**
 * Update batch details
 * @param {string} id 
 * @param {Object} data 
 */
export const updateBatch = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/admin/batches/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update batch" };
  }
};

/**
 * Add students to batch
 * @param {string} batchId 
 * @param {Array<string>} studentIds 
 */
export const addStudentsToBatch = async (batchId, studentIds) => {
  try {
    const response = await axiosInstance.post(`/admin/batches/${batchId}/students`, { studentIds });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to add students to batch" };
  }
};

/**
 * Remove student from batch
 * @param {string} batchId 
 * @param {string} studentId 
 */
export const removeStudentFromBatch = async (batchId, studentId) => {
  try {
    const response = await axiosInstance.delete(`/admin/batches/${batchId}/students/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to remove student from batch" };
  }
};

/**
 * Bulk move students between batches
 * @param {string} fromBatchId 
 * @param {string} toBatchId 
 * @param {Array<string>} studentIds 
 */
export const moveBatchStudents = async (fromBatchId, toBatchId, studentIds) => {
  try {
    const response = await axiosInstance.post("/admin/batches/bulk-move", {
      fromBatchId,
      toBatchId,
      studentIds,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to move students" };
  }
};

/**
 * Create merged batch
 * @param {Object} data 
 */
export const createMergedBatch = async (data) => {
  try {
    const response = await axiosInstance.post("/admin/batches/merge", data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create merged batch" };
  }
};

/**
 * Delete batch (Soft Delete)
 * @param {string} id 
 * @param {boolean} force 
 */
export const deleteBatch = async (id, force = false) => {
  try {
    const response = await axiosInstance.delete(`/admin/batches/${id}${force ? "?force=true" : ""}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete batch" };
  }
};

/**
 * Get unassigned students for class
 * @param {Object} filters 
 */
export const getUnassignedStudents = async (filters = {}) => {
  try {
    const response = await axiosInstance.get("/admin/batches/unassigned", { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch unassigned students" };
  }
};

/**
 * Get batch statistics for class
 * @param {Object} filters 
 */
export const getBatchStats = async (filters = {}) => {
  try {
    const response = await axiosInstance.get("/admin/batches/stats", { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch batch statistics" };
  }
};
