import express from "express";
import {
  createBranch,
  getBranches,
  createSubject,
  getSubjects,
} from "../controllers/adminController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// BRANCH
router.post("/branches", protect, allowRoles("admin"), createBranch);
router.get("/branches", protect, allowRoles("admin"), getBranches);

// SUBJECT
router.post("/subjects", protect, allowRoles("admin"), createSubject);
router.get("/subjects", protect, allowRoles("admin"), getSubjects);

export default router;
