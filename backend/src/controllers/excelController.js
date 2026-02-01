import { updateMonthlyAttendanceExcel } from "../utils/updateMonthlyAttendanceExcel.js";
import AttendanceSession from "../models/AttendanceSession.js";
import mongoose from "mongoose";

/**
 * MANUAL EXCEL UPDATE
 * POST /api/attendance/update-excel/:attendanceId
 * 
 * Manually triggers Excel update for a specific attendance session
 * Useful when teacher wants to force Excel generation or regeneration
 */
export const manualExcelUpdate = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const teacherId = req.user.id;

    // 1. Validate attendance ID
    if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendanceId format"
      });
    }

    // 2. Fetch attendance session
    const attendance = await AttendanceSession.findById(attendanceId).lean();

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance session not found"
      });
    }

    // 3. Verify teacher authorization
    if (
      attendance.teacher.toString() !== teacherId &&
      attendance.assignedTeacher.toString() !== teacherId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update Excel for this session"
      });
    }

    // 4. Trigger Excel update
    console.log(`📊 Manual Excel update requested for attendance: ${attendanceId}`);
    
    const result = await updateMonthlyAttendanceExcel(attendance);

    // 5. Return result
    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        filePath: result.filePath,
        skipped: result.skipped || false
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || "Excel update failed",
        error: result.error
      });
    }

  } catch (error) {
    console.error("MANUAL EXCEL UPDATE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while updating Excel"
    });
  }
};

export default manualExcelUpdate;
