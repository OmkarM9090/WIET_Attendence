import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { getTeacherProfile, getTeacherAssignments } from "../controllers/teacherController.js";

const router = express.Router();

// Get logged-in teacher's profile
router.get("/me", protect, allowRoles("teacher"), getTeacherProfile);

// Get teacher's assignments
router.get("/assignments/:teacherId", protect, allowRoles("teacher"), getTeacherAssignments);

export default router;
