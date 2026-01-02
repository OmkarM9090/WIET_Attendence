import express from "express";
import { getStudentAttendance } from "../controllers/studentAttendanceController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/attendance",protect,allowRoles("student"),getStudentAttendance);

export default router;
