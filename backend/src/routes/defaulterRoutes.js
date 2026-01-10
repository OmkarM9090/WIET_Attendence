import express from "express";
import { generateDefaulters } from "../controllers/defaulterController.js";
import { exportDefaulterExcel } from "../controllers/defaulterExcelController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/defaulters", protect, allowRoles("admin"), generateDefaulters);
router.post("/defaulters/export", protect, allowRoles("admin"), exportDefaulterExcel);

router.post(
  "/defaulters/pdf",
  protect,
  allowRoles("admin"),
  exportDefaulterPDF
);


export default router;
