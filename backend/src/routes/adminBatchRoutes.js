import express from "express";
import {
  getBatches,
  getBatch,
  quickSetupBatches,
  createBatch,
  updateBatch,
  addStudentsToBatch,
  removeStudentFromBatch,
  bulkMoveStudents,
  createMergedBatch,
  deleteBatch,
  getUnassignedStudents,
  getBatchStats,
} from "../controllers/adminBatchController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// All routes are admin-only
// Protect + allowRoles('admin')

// GET all batches (with filters)
router.get(
  "/",
  protect,
  allowRoles("admin"),
  getBatches
);

// GET single batch with full students
router.get(
  "/:id",
  protect,
  allowRoles("admin"),
  getBatch
);

// Quick auto-setup batches
router.post(
  "/quick-setup",
  protect,
  allowRoles("admin"),
  quickSetupBatches
);

// Create custom batch
router.post(
  "/",
  protect,
  allowRoles("admin"),
  createBatch
);

// Update batch metadata
router.put(
  "/:id",
  protect,
  allowRoles("admin"),
  updateBatch
);

// Add students to batch
router.post(
  "/:id/students",
  protect,
  allowRoles("admin"),
  addStudentsToBatch
);

// Remove student from batch
router.delete(
  "/:id/students/:studentId",
  protect,
  allowRoles("admin"),
  removeStudentFromBatch
);

// Bulk move students between batches
router.post(
  "/bulk-move",
  protect,
  allowRoles("admin"),
  bulkMoveStudents
);

// Create merged batch
router.post(
  "/merge",
  protect,
  allowRoles("admin"),
  createMergedBatch
);

// Delete (soft) batch
router.delete(
  "/:id",
  protect,
  allowRoles("admin"),
  deleteBatch
);

// Get unassigned students
router.get(
  "/unassigned",
  protect,
  allowRoles("admin"),
  getUnassignedStudents
);

// Get batch statistics
router.get(
  "/stats",
  protect,
  allowRoles("admin"),
  getBatchStats
);

export default router;
