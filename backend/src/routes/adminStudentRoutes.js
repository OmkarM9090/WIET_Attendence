import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {createStudent,getStudents,updateStudent,deleteStudent} from "../controllers/studentAdminController.js";
import { 
  uploadStudentsExcel,
  getClassInfo,
  downloadSimpleTemplate,
  uploadStudentsSimple 
} from "../controllers/adminStudentUploadController.js";
import { generateStudentTemplate } from "../utils/generateTemplate.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

router.post("/students", protect, allowRoles("admin"), createStudent);
router.get("/students", protect, allowRoles("admin", "teacher"), getStudents);
router.patch("/students/:id", protect, allowRoles("admin"), updateStudent);
router.delete("/students/:id", protect, allowRoles("admin"), deleteStudent);
router.post(
  "/students/upload",
  protect,
  allowRoles("admin"),
  upload.single("file"),
  uploadStudentsExcel
);

// Simplified Upload Routes
router.get(
  "/class-info",
  protect,
  allowRoles("admin"),
  getClassInfo
);

router.get(
  "/download-simple-template",
  protect,
  allowRoles("admin"),
  downloadSimpleTemplate
);

router.post(
  "/upload-students-simple",
  protect,
  allowRoles("admin"),
  upload.single("file"),
  uploadStudentsSimple
);

// Download Excel Template Route
router.get(
  "/download-student-template",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const buffer = await generateStudentTemplate();
      res.setHeader("Content-Disposition", "attachment; filename=Student_Upload_Template.xlsx");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buffer);
    } catch (error) {
      console.error("TEMPLATE DOWNLOAD ERROR:", error);
      res.status(500).json({ success: false, message: "Template generate karne me error aayi" });
    }
  }
);

export default router;
