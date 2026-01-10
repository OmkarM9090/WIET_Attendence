import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {createStudent,getStudents,updateStudent,deleteStudent} from "../controllers/studentAdminController.js";
import { uploadStudentsExcel } from "../controllers/adminStudentUploadController.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

router.post("/students", protect, allowRoles("admin"), createStudent);
router.get("/students", protect, allowRoles("admin"), getStudents);
router.patch("/students/:id", protect, allowRoles("admin"), updateStudent);
router.delete("/students/:id", protect, allowRoles("admin"), deleteStudent);
router.post(
  "/students/upload",
  protect,
  allowRoles("admin"),
  upload.single("file"),
  uploadStudentsExcel
);

export default router;
