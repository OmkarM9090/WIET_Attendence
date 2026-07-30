import express from "express";
import {
  getSubjectsForClass,
  getTeachersForClass
} from "../controllers/attendanceController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get(
  "/teachers-for-class",
  protect,
  allowRoles("teacher"),
  getTeachersForClass
);

router.get(
  "/subjects-for-class",
  protect,
  allowRoles("teacher"),
  getSubjectsForClass
);

export default router;
