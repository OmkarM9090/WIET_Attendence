import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  createTeacher,
  assignTeacher,
  getTeachers,
  updateTeacher,
  deleteTeacher,
  deleteAllTeachers,
  getTeachingAssignments,
  updateTeachingAssignment,
  deleteTeachingAssignment,
} from "../controllers/teacherAdminController.js";

const router = express.Router();

router.post("/teachers", protect, allowRoles("admin"), createTeacher);
router.get("/teachers", protect, allowRoles("admin"), getTeachers);
router.delete("/teachers", protect, allowRoles("admin"), deleteAllTeachers);
router.patch("/teachers/:id", protect, allowRoles("admin"), updateTeacher);
router.delete("/teachers/:id", protect, allowRoles("admin"), deleteTeacher);
router.post("/assign-teacher", protect, allowRoles("admin"), assignTeacher);
router.get("/teaching-assignments", protect, allowRoles("admin"), getTeachingAssignments);
router.patch("/teaching-assignments/:id", protect, allowRoles("admin"), updateTeachingAssignment);
router.delete("/teaching-assignments/:id", protect, allowRoles("admin"), deleteTeachingAssignment);

export default router;

/*/WHY TEACHER ADMIN APIs EXIST
In your college:
A teacher can teach multiple subjects
A subject belongs to a branch + semester
A teacher teaches a subject for a specific Year + Division
So we must answer questions like:
Which teacher teaches CN for TE COMP B?
When teacher logs in, which classes should they see?
Which students’ attendance can a teacher mark?
* This cannot be hardcoded.
* It must be controlled by Admin.
That’s why Teacher Admin APIs are critical.*/