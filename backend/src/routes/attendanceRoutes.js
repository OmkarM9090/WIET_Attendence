import express from "express";
import {
  createAttendance,
  getTeacherAttendance,
  getStudentsForSession,
  markAndGenerateAttendance,
  updateAttendance,
  manualExcelUpdate,
  getSessionDetails
} from "../controllers/attendanceController.js";
import { generateDefaulters } from "../controllers/defaulterController.js";
import { getMonthlyAttendance } from "../controllers/monthlyAttendanceController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Teacher only
router.post("/", protect, allowRoles("teacher"), createAttendance);
router.get("/", protect, allowRoles("teacher"), getTeacherAttendance);
router.post(
  "/mark-and-generate",
  protect,
  allowRoles("teacher"),
  markAndGenerateAttendance
);
// PUT route for updating existing attendance
router.put(
  "/update/:attendanceId",
  protect,
  allowRoles("teacher"),
  updateAttendance
);
// POST route for manual Excel update
router.post(
  "/update-excel/:attendanceId",
  protect,
  allowRoles("teacher"),
  manualExcelUpdate
);
router.get(
  "/students-for-session",
  protect,
  allowRoles("teacher"),
  getStudentsForSession
);

router.get(
  "/session/:sessionId/details",
  protect,
  allowRoles("admin", "teacher"),
  getSessionDetails
);

router.get(
  "/monthly",
  protect,
  allowRoles("admin", "teacher"),
  getMonthlyAttendance
);

router.get(
  "/defaulters",
  protect,
  allowRoles("admin", "teacher"),
  generateDefaulters
);

export default router;

/*/WHAT WE ARE BUILDING

Teacher will:
Select Branch + Year + Division + Subject
Select Date
Mark Absent students
Save attendance once only

Later:

View attendance
Generate reports
Monthly defaulters
So attendance APIs are the core of your entire project.*/