// routes/adminBatchRoutes.js
// Express routes for Admin Batch Management APIs

import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  getBatches,
  getBatchById,
  quickSetupBatches,
  createBatch,
  updateBatch,
  addStudentsToBatchController,
  removeStudentFromBatchController,
  bulkMoveStudents,
  createMergedBatch,
  deleteBatch,
  getUnassignedStudents,
  getBatchStats,
  getAllBatchesForMerge,
  getStudentsForMerge,
} from "../controllers/adminBatchController.js";

const router = express.Router();

// Protect all batch routes for Admin access
router.use(protect);
router.use(allowRoles("admin"));

// Utility / Stat Routes (placed before :id param routes)
router.get("/all-for-merge", getAllBatchesForMerge);
router.get("/students-for-merge", getStudentsForMerge);
router.get("/unassigned", getUnassignedStudents);
router.get("/stats", getBatchStats);

// Batch Setup & Creation Routes
router.post("/quick-setup", quickSetupBatches);
router.post("/merge", createMergedBatch);
router.post("/bulk-move", bulkMoveStudents);

// Main Batch CRUD Routes
router.get("/", getBatches);
router.post("/", createBatch);
router.get("/:id", getBatchById);
router.put("/:id", updateBatch);
router.delete("/:id", deleteBatch);

// Batch Membership Routes
router.post("/:id/students", addStudentsToBatchController);
router.delete("/:id/students/:studentId", removeStudentFromBatchController);

export default router;
