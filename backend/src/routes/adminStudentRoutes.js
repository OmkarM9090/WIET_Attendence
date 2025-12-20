import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {createStudent,getStudents} from "../controllers/studentAdminController.js";

const router = express.Router();

router.post("/students", protect, allowRoles("admin"), createStudent);
router.get("/students", protect, allowRoles("admin"), getStudents);

export default router;
