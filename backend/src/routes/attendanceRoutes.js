import express from "express";
import {
  createAttendance,
  getTeacherAttendance
} from "../controllers/attendanceController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Teacher only
router.post("/", protect, allowRoles("teacher"), createAttendance);
router.get("/", protect, allowRoles("teacher"), getTeacherAttendance);

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