import express from "express";
import {
  createBranch,
  getBranches,
  createSubject,
  getSubjects,
  deleteSubject,
  getBranchDeleteCount,
  deleteBranch,
  downloadStudentTemplate,
  downloadTeacherTemplate,
  getStudentCounts,
  previewBulkDelete,
  bulkDeleteStudents
} from "../controllers/adminController.js";
import {
  createTeachingAssignment,
  getTeachingAssignments,
} from "../controllers/teacherAssignmentController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// BRANCH
router.post("/branches", protect, allowRoles("admin"), createBranch);
router.get("/branches", protect, allowRoles("admin"), getBranches);
router.get("/branches/:id/delete-count", protect, allowRoles("admin"), getBranchDeleteCount);
router.delete("/branches/:id", protect, allowRoles("admin"), deleteBranch);

// SUBJECT
router.post("/subjects", protect, allowRoles("admin"), createSubject);
router.get("/subjects", protect, allowRoles("admin"), getSubjects);
router.delete("/subjects/:id", protect, allowRoles("admin"), deleteSubject);

// TEACHING ASSIGNMENTS (Timetable)
router.post(
  "/assign-teacher",
  protect,
  allowRoles("admin"),
  createTeachingAssignment
);
router.get(
  "/teacher-assignments",
  protect,
  allowRoles("admin"),
  getTeachingAssignments
);

// BULK STUDENT DELETE
router.get("/student-counts", protect, allowRoles("admin"), getStudentCounts);
router.get("/preview-bulk-delete", protect, allowRoles("admin"), previewBulkDelete);
router.post("/bulk-delete-students", protect, allowRoles("admin"), bulkDeleteStudents);

// TEMPLATE DOWNLOADS
router.get("/download-student-template", protect, allowRoles("admin"), downloadStudentTemplate);
router.get("/download-teacher-template", protect, allowRoles("admin"), downloadTeacherTemplate);

export default router;
