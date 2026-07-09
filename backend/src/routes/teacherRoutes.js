import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { getTeacherProfile, getTeacherAssignments } from "../controllers/teacherController.js";
import { getMyTeachingAssignments } from "../controllers/teacherAssignmentController.js";
import { getDashboardStats } from "../controllers/teacherDashboardController.js";

const router = express.Router();

// Get logged-in teacher's profile
router.get("/me", protect, allowRoles("teacher"), getTeacherProfile);

// Get teacher's assignments
router.get("/assignments/:teacherId", protect, allowRoles("teacher"), getTeacherAssignments);

// Get my teaching assignments for attendance marking
router.get("/my-assignments", protect, allowRoles("teacher"), getMyTeachingAssignments);

// Get teacher dashboard stats
router.get("/dashboard-stats", protect, allowRoles("teacher"), getDashboardStats);

export default router;
