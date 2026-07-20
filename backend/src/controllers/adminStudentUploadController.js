import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Student from "../models/Student.js";
import { parseStudentExcel } from "../utils/excelParser.js";
import { validateStudentRow } from "../utils/excelValidator.js";

// Helper function to auto-detect academic year
function getCurrentAcademicYear() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  
  if (month >= 7) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

export const uploadStudentsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Excel file required" });
    }

    const students = await parseStudentExcel(req.file.buffer);
    
    if (students.length === 0) {
      return res.status(400).json({ success: false, message: "Excel file is empty ya usme valid data nahi hai." });
    }

    const failedRows = [];
    const successfulStudents = [];
    const autoAcademicYear = getCurrentAcademicYear();
    
    const passwordHash = await bcrypt.hash("student123", 10);

    let rowNum = 2; // Row 1 is header
    for (const s of students) {
      const { errors, branch } = await validateStudentRow(s);
      
      if (errors.length > 0) {
        failedRows.push({
          rowNumber: rowNum,
          data: s,
          reason: errors.join(", "),
          simpleMessage: errors[0] // just show the first one as simple message
        });
        rowNum++;
        continue;
      }

      try {
        const user = await User.create({
          name: s.name,
          email: s.email,
          passwordHash,
          role: "student"
        });

        const student = await Student.create({
          userId: user._id,
          rollNo: s.rollNo,
          branch: branch._id,
          year: s.year,
          division: s.division.toUpperCase(),
          batch: s.batch || undefined,
          academicYear: autoAcademicYear,
          admissionDate: new Date()
        });
        
        successfulStudents.push(student._id);
      } catch (err) {
        failedRows.push({
          rowNumber: rowNum,
          data: s,
          reason: err.message,
          simpleMessage: "Database me save karte waqt error aayi."
        });
      }
      
      rowNum++;
    }

    res.json({
      success: true,
      message: "Upload completed",
      summary: {
        total: students.length,
        successful: successfulStudents.length,
        failed: failedRows.length,
        skipped: 0
      },
      failedRows,
      successfulStudents
    });

  } catch (error) {
    console.error("EXCEL UPLOAD ERROR:", error);
    res.status(500).json({ success: false, message: "Server error during upload" });
  }
};
