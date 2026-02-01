import ExcelJS from "exceljs";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import os from "os";
import Student from "../models/Student.js";
import User from "../models/User.js";
import Subject from "../models/Subject.js";
import Branch from "../models/Branch.js";
import mongoose from "mongoose";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ====================================================
 * MAIN FUNCTION: UPDATE MONTHLY ATTENDANCE EXCEL
 * ====================================================
 * 
 * Automatically creates or updates Monthly Excel Attendance Sheet
 * whenever attendance is CREATED or UPDATED.
 * 
 * @param {Object} attendanceSession - Attendance session document
 * @returns {Promise<Object>} - { success, filePath, message }
 */
export const updateMonthlyAttendanceExcel = async (attendanceSession) => {
  try {
    // ============ 1. SKIP IF CANCELLED/HOLIDAY ============
    if (attendanceSession.isCancelled) {
      console.log("⏭️  Skipping Excel update for cancelled/holiday session");
      return {
        success: true,
        skipped: true,
        message: "Excel update skipped for cancelled session"
      };
    }

    // ============ 2. EXTRACT SESSION DETAILS ============
    const {
      date,
      academicYear,
      sessionType,
      batch,
      subject: subjectId,
      branch: branchId,
      year,
      division,
      absentStudents,
      teacher: teacherId
    } = attendanceSession;

    // ============ 3. FETCH RELATED DATA ============
    const [subject, branch, teacher] = await Promise.all([
      Subject.findById(subjectId).select("name code").lean(),
      Branch.findById(branchId).select("name code").lean(),
      User.findById(teacherId).select("name").lean()
    ]);

    if (!subject) {
      throw new Error(`Subject not found with ID: ${subjectId}`);
    }
    if (!branch) {
      throw new Error(`Branch not found with ID: ${branchId}`);
    }
    if (!teacher) {
      throw new Error(`Teacher not found with ID: ${teacherId}`);
    }

    console.log(`📊 Excel update for: ${branch.name} ${division} - ${subject.name} - ${teacher.name}`);

    // ============ 4. DETERMINE FILE PATH ============
    const filePath = await buildExcelFilePath(
      academicYear,
      branch.name,
      division,
      subject.name,
      date,
      sessionType,
      batch
    );

    // ============ 5. CREATE OR LOAD WORKBOOK ============
    let workbook;
    let worksheet;
    let isNewFile = false;

    try {
      // Try to load existing file
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      worksheet = workbook.worksheets[0];
      console.log(`📖 Loaded existing Excel file: ${path.basename(filePath)}`);
    } catch (error) {
      // File doesn't exist - create new workbook
      isNewFile = true;
      workbook = new ExcelJS.Workbook();
      worksheet = workbook.addWorksheet("Attendance");
      console.log(`📝 Creating new Excel file: ${path.basename(filePath)}`);

      // Create template structure
      await createExcelTemplate(
        worksheet,
        branch.name,
        year,
        division,
        subject.name,
        teacher.name,
        sessionType,
        batch
      );
    }

    // ============ 6. FETCH ELIGIBLE STUDENTS ============
    const students = await fetchEligibleStudents(
      branchId,
      year,
      division,
      academicYear,
      sessionType,
      batch,
      date
    );

    if (!students || students.length === 0) {
      throw new Error("No eligible students found for this session");
    }

    // ============ 7. ENSURE ALL STUDENTS ARE IN SHEET ============
    if (isNewFile) {
      // Add all students to new sheet
      await addStudentsToSheet(worksheet, students, sessionType);
    } else {
      // Check for new students and add them
      await addMissingStudents(worksheet, students, sessionType);
    }

    // ============ 8. FIND OR CREATE DATE COLUMN ============
    const dateColumn = findOrCreateDateColumn(worksheet, date, sessionType);

    // ============ 9. MARK ATTENDANCE FOR THIS DATE ============
    await markAttendanceInColumn(
      worksheet,
      dateColumn,
      students,
      absentStudents,
      sessionType
    );

    // ============ 10. RECALCULATE TOTALS & PERCENTAGES ============
    recalculateTotalsAndPercentages(worksheet, sessionType);

    // ============ 11. APPLY STYLING ============
    applyExcelStyling(worksheet, sessionType);

    // ============ 12. SAVE WORKBOOK ============
    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ Excel file saved successfully: ${path.basename(filePath)}`);

    return {
      success: true,
      filePath,
      message: `Excel file ${isNewFile ? "created" : "updated"} successfully`
    };

  } catch (error) {
    console.error("❌ ERROR in updateMonthlyAttendanceExcel:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Attendance session data:", {
      date: attendanceSession?.date,
      academicYear: attendanceSession?.academicYear,
      sessionType: attendanceSession?.sessionType,
      subjectId: attendanceSession?.subject,
      branchId: attendanceSession?.branch,
      teacherId: attendanceSession?.teacher
    });
    
    // Don't throw error - log and return failure
    // This ensures main API doesn't crash
    return {
      success: false,
      error: error.message,
      message: "Excel update failed but attendance was saved"
    };
  }
};

/**
 * ====================================================
 * ENSURE DIRECTORY EXISTS
 * ====================================================
 * 
 * Creates directory structure if it doesn't exist
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
};

/**
 * ====================================================
 * GET USER DOCUMENTS PATH
 * ====================================================
 * 
 * Returns the user's Documents folder path or C:\Attendance_Excel
 */
const getAttendanceExcelBasePath = () => {
  // For Windows, use C:\Attendance_Excel for easy access
  // This makes it visible in File Explorer without navigating deep folders
  if (process.platform === "win32") {
    return "C:\\Attendance_Excel";
  }
  
  // For other OS, use Documents folder
  const homeDir = os.homedir();
  return path.join(homeDir, "Documents", "Attendance_Excel");
};

/**
 * ====================================================
 * BUILD FILE PATH
 * ====================================================
 * 
 * Creates file path based on naming convention:
 * C:\Attendance_Excel\{academicYear}\{branch}_{division}_{subject}_{month}.xlsx
 * 
 * For PRACTICAL sessions, includes batch in filename
 */
const buildExcelFilePath = async (
  academicYear,
  branchName,
  division,
  subjectName,
  date,
  sessionType,
  batch
) => {
  // Get month name
  const dateObj = new Date(date);
  const monthName = dateObj.toLocaleDateString("en-US", { month: "long" });

  // Clean names (remove special characters)
  const cleanBranch = branchName.replace(/[^a-zA-Z0-9]/g, "");
  const cleanSubject = subjectName.replace(/[^a-zA-Z0-9]/g, "");
  const cleanBatch = batch ? batch.replace(/[^a-zA-Z0-9]/g, "") : "";

  // Build filename: BranchName_SubjectName_Division_AcademicYear_Month.xlsx
  let filename;
  if (sessionType === "PRACTICAL" && cleanBatch) {
    filename = `${cleanBranch}_${cleanSubject}_${division}_Batch${cleanBatch}_${academicYear}_${monthName}.xlsx`;
  } else {
    filename = `${cleanBranch}_${cleanSubject}_${division}_${academicYear}_${monthName}.xlsx`;
  }

  // Build directory path - Now uses C:\Attendance_Excel
  const baseDir = path.join(getAttendanceExcelBasePath(), academicYear);
  
  // Ensure directory exists
  await ensureDirectoryExists(baseDir);
  
  const fullPath = path.join(baseDir, filename);
  
  console.log(`📂 Excel file path: ${fullPath}`);

  return fullPath;
};

/**
 * ====================================================
 * CREATE EXCEL TEMPLATE
 * ====================================================
 * 
 * Creates the header structure for new Excel files
 * Follows Mumbai University college format
 */
const createExcelTemplate = async (
  worksheet,
  branchName,
  year,
  division,
  subjectName,
  teacherName,
  sessionType,
  batch
) => {
  // Row 1: College Name
  worksheet.mergeCells("A1:F1");
  worksheet.getCell("A1").value = "Watumull Institute of Electronics Engineering & Computer Technology";
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

  // Row 2: Class Information
  const yearMap = { 1: "FE", 2: "SE", 3: "TE", 4: "BE" };
  const classInfo = `Class: ${branchName} ${yearMap[year]} Div ${division}${
    sessionType === "PRACTICAL" && batch ? ` - Batch ${batch}` : ""
  }`;
  worksheet.mergeCells("A2:F2");
  worksheet.getCell("A2").value = classInfo;
  worksheet.getCell("A2").font = { bold: true, size: 12 };
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  // Row 3: Subject
  worksheet.mergeCells("A3:F3");
  worksheet.getCell("A3").value = `Subject: ${subjectName}`;
  worksheet.getCell("A3").font = { bold: true, size: 11 };
  worksheet.getCell("A3").alignment = { horizontal: "center" };

  // Row 4: Teacher
  worksheet.mergeCells("A4:F4");
  worksheet.getCell("A4").value = `Teacher: ${teacherName}`;
  worksheet.getCell("A4").font = { bold: true, size: 11 };
  worksheet.getCell("A4").alignment = { horizontal: "center" };

  // Row 5: Blank
  worksheet.getCell("A5").value = "";

  // Row 6: Header Row
  const headerRow = worksheet.getRow(6);
  let colIndex = 1;

  headerRow.getCell(colIndex++).value = "Roll No";
  headerRow.getCell(colIndex++).value = "Student Name";

  if (sessionType === "PRACTICAL") {
    headerRow.getCell(colIndex++).value = "Batch";
  }

  // Date columns will be added dynamically
  // Reserve columns for Total Present and Percentage at the end

  // Style header row
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 20;

  // Set column widths
  worksheet.getColumn(1).width = 12; // Roll No
  worksheet.getColumn(2).width = 30; // Student Name
  if (sessionType === "PRACTICAL") {
    worksheet.getColumn(3).width = 10; // Batch
  }
};

/**
 * ====================================================
 * FETCH ELIGIBLE STUDENTS
 * ====================================================
 * 
 * Gets all students eligible for this attendance session
 * Applies late admission logic
 */
const fetchEligibleStudents = async (
  branchId,
  year,
  division,
  academicYear,
  sessionType,
  batch,
  sessionDate
) => {
  const studentFilter = {
    branch: mongoose.Types.ObjectId.isValid(branchId)
      ? new mongoose.Types.ObjectId(branchId)
      : branchId,
    year: parseInt(year),
    division,
    status: "active",
    academicYear,
    admissionDate: { $lte: new Date(sessionDate) } // Late admission logic
  };

  // Filter by batch for practicals
  if (sessionType === "PRACTICAL" && batch) {
    studentFilter.$or = [
      { batch },
      { batchName: batch }
    ];
  }

  const students = await Student.find(studentFilter)
    .populate("userId", "name email")
    .select("rollNo userId batch batchName")
    .sort({ rollNo: 1 })
    .lean();

  // Format student data
  return students.map((s) => ({
    _id: s._id,
    rollNo: s.rollNo,
    name: s.userId?.name || "Unknown",
    batch: s.batchName || s.batch || ""
  }));
};

/**
 * ====================================================
 * ADD STUDENTS TO SHEET
 * ====================================================
 * 
 * Adds all students to a new Excel sheet
 */
const addStudentsToSheet = async (worksheet, students, sessionType) => {
  const startRow = 7; // After header at row 6
  let rowIndex = startRow;

  for (const student of students) {
    const row = worksheet.getRow(rowIndex);
    let colIndex = 1;

    row.getCell(colIndex++).value = student.rollNo;
    row.getCell(colIndex++).value = student.name;

    if (sessionType === "PRACTICAL") {
      row.getCell(colIndex++).value = student.batch;
    }

    rowIndex++;
  }

  console.log(`✅ Added ${students.length} students to sheet`);
};

/**
 * ====================================================
 * ADD MISSING STUDENTS
 * ====================================================
 * 
 * Checks existing sheet and adds any new students
 * (Handles late admissions)
 */
const addMissingStudents = async (worksheet, students, sessionType) => {
  // Get existing roll numbers from sheet
  const existingRolls = new Set();
  let lastRow = 6; // Start after header

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 6) {
      const rollNo = row.getCell(1).value;
      if (rollNo && typeof rollNo === "number") {
        existingRolls.add(rollNo);
        lastRow = rowNumber;
      }
    }
  });

  // Find missing students
  const missingStudents = students.filter(
    (s) => !existingRolls.has(s.rollNo)
  );

  if (missingStudents.length === 0) {
    return;
  }

  // Add missing students
  let rowIndex = lastRow + 1;
  for (const student of missingStudents) {
    const row = worksheet.getRow(rowIndex);
    let colIndex = 1;

    row.getCell(colIndex++).value = student.rollNo;
    row.getCell(colIndex++).value = student.name;

    if (sessionType === "PRACTICAL") {
      row.getCell(colIndex++).value = student.batch;
    }

    rowIndex++;
  }

  console.log(`➕ Added ${missingStudents.length} new students to sheet`);
};

/**
 * ====================================================
 * FIND OR CREATE DATE COLUMN
 * ====================================================
 * 
 * Finds existing date column or creates new one
 * Date format: DD-MM
 * 
 * @returns {number} - Column index for this date
 */
const findOrCreateDateColumn = (worksheet, date, sessionType) => {
  const dateObj = new Date(date);
  const dateStr = dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }); // Format: DD-MM-YYYY

  const headerRow = worksheet.getRow(6);
  const baseColumns = sessionType === "PRACTICAL" ? 3 : 2; // Roll, Name, (Batch)

  // Search for existing date column
  let dateColumn = null;
  let lastDateColumn = baseColumns;
  let maxCol = baseColumns;

  headerRow.eachCell((cell, colNumber) => {
    if (colNumber > baseColumns) {
      const cellValue = cell.value;
      
      // Check if it's a date column
      if (cellValue === dateStr) {
        dateColumn = colNumber;
        return false; // Stop iteration
      }
      
      // Track last date column (before Total Present)
      if (cellValue && cellValue !== "Total Present" && cellValue !== "Percentage") {
        if (typeof cellValue === "string" && cellValue.match(/\d{2}-\d{2}-\d{4}/)) {
          lastDateColumn = colNumber;
        }
      }
      
      maxCol = Math.max(maxCol, colNumber);
    }
  });

  // If date column exists, return it
  if (dateColumn) {
    console.log(`📅 Found existing date column: ${dateStr} at column ${dateColumn}`);
    return dateColumn;
  }

  // Create new date column after last date column
  const newColumn = lastDateColumn + 1;
  
  // Don't use spliceColumns - just add data to the new column
  // Set header
  headerRow.getCell(newColumn).value = dateStr;
  headerRow.getCell(newColumn).font = { bold: true };
  headerRow.getCell(newColumn).alignment = { horizontal: "center", vertical: "middle" };
  
  // Set column width
  worksheet.getColumn(newColumn).width = 12;

  console.log(`➕ Created new date column: ${dateStr} at column ${newColumn}`);
  return newColumn;
};

/**
 * ====================================================
 * MARK ATTENDANCE IN COLUMN
 * ====================================================
 * 
 * Writes 0 (absent) or 1 (present) for each student
 */
const markAttendanceInColumn = async (
  worksheet,
  dateColumn,
  students,
  absentStudentIds,
  sessionType
) => {
  // Convert absentStudentIds to Set of strings for fast lookup
  const absentSet = new Set(
    absentStudentIds.map((id) => id.toString())
  );

  // Create roll number to student ID map
  const rollToId = new Map(
    students.map((s) => [s.rollNo, s._id.toString()])
  );

  // Iterate through student rows (starting from row 7)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 6) {
      const rollNo = row.getCell(1).value;
      
      if (rollNo && typeof rollNo === "number") {
        const studentId = rollToId.get(rollNo);
        
        if (studentId) {
          // Check if student is absent
          const isAbsent = absentSet.has(studentId);
          const attendanceValue = isAbsent ? 0 : 1;
          
          // Write attendance
          row.getCell(dateColumn).value = attendanceValue;
          row.getCell(dateColumn).alignment = { horizontal: "center", vertical: "middle" };
        }
      }
    }
  });

  console.log(`✅ Marked attendance for ${students.length} students`);
};

/**
 * ====================================================
 * RECALCULATE TOTALS AND PERCENTAGES
 * ====================================================
 * 
 * Updates Total Present and Percentage columns
 */
const recalculateTotalsAndPercentages = (worksheet, sessionType) => {
  const headerRow = worksheet.getRow(6);
  const baseColumns = sessionType === "PRACTICAL" ? 3 : 2;

  // Find all date columns and other columns
  const dateColumns = [];
  let totalPresentCol = null;
  let percentageCol = null;
  let maxCol = baseColumns;

  // First pass: find all existing columns
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber > baseColumns) {
      const value = cell.value;
      maxCol = Math.max(maxCol, colNumber);
      
      if (value === "Total Present") {
        totalPresentCol = colNumber;
      } else if (value === "Percentage") {
        percentageCol = colNumber;
      } else if (value && typeof value === "string" && value.match(/\d{2}-\d{2}-\d{4}/)) {
        dateColumns.push(colNumber);
      }
    }
  });

  console.log(`📊 Found ${dateColumns.length} date columns: ${dateColumns.join(", ")}`);

  // Determine where to place Total Present and Percentage columns
  const lastDateCol = dateColumns.length > 0 ? Math.max(...dateColumns) : baseColumns;

  // If Total Present column doesn't exist or is in wrong place, set it
  if (!totalPresentCol || totalPresentCol <= lastDateCol) {
    totalPresentCol = lastDateCol + 1;
    headerRow.getCell(totalPresentCol).value = "Total Present";
    headerRow.getCell(totalPresentCol).font = { bold: true };
    headerRow.getCell(totalPresentCol).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getColumn(totalPresentCol).width = 14;
  }

  // If Percentage column doesn't exist or is in wrong place, set it
  if (!percentageCol || percentageCol <= totalPresentCol) {
    percentageCol = totalPresentCol + 1;
    headerRow.getCell(percentageCol).value = "Percentage";
    headerRow.getCell(percentageCol).font = { bold: true };
    headerRow.getCell(percentageCol).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getColumn(percentageCol).width = 12;
  }

  const totalLectures = dateColumns.length;
  console.log(`📊 Total lectures: ${totalLectures}, Total Present col: ${totalPresentCol}, Percentage col: ${percentageCol}`);

  if (totalLectures === 0) {
    console.log("⚠️ No date columns found to calculate attendance");
    return;
  }

  // Calculate totals for each student
  let studentsProcessed = 0;
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 6) {
      const rollNo = row.getCell(1).value;
      
      if (rollNo && typeof rollNo === "number") {
        // Sum attendance values
        let totalPresent = 0;
        
        for (const col of dateColumns) {
          const value = row.getCell(col).value;
          if (value === 1 || value === "1") {
            totalPresent++;
          }
        }

        // Write Total Present
        row.getCell(totalPresentCol).value = totalPresent;
        row.getCell(totalPresentCol).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(totalPresentCol).font = { bold: true };

        // Calculate and write Percentage
        const percentage = totalLectures > 0 
          ? ((totalPresent / totalLectures) * 100).toFixed(2)
          : "0.00";
        
        row.getCell(percentageCol).value = `${percentage}%`;
        row.getCell(percentageCol).alignment = { horizontal: "center", vertical: "middle" };
        
        // Color code percentage (Green >= 75%, Yellow >= 60%, Red < 60%)
        const percentValue = parseFloat(percentage);
        if (percentValue >= 75) {
          row.getCell(percentageCol).font = { color: { argb: "FF008000" }, bold: true };
        } else if (percentValue >= 60) {
          row.getCell(percentageCol).font = { color: { argb: "FFFFA500" }, bold: true };
        } else {
          row.getCell(percentageCol).font = { color: { argb: "FFFF0000" }, bold: true };
        }

        studentsProcessed++;
      }
    }
  });

  console.log(`✅ Recalculated totals for ${studentsProcessed} students (${totalLectures} lectures)`);
};

/**
 * ====================================================
 * APPLY EXCEL STYLING
 * ====================================================
 * 
 * Applies borders and formatting to the sheet
 */
const applyExcelStyling = (worksheet, sessionType) => {
  const baseColumns = sessionType === "PRACTICAL" ? 3 : 2;
  
  // Find the last used column and row
  let lastColumn = baseColumns;
  let lastRow = 6;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 6) {
      row.eachCell((cell, colNumber) => {
        if (cell.value !== null && cell.value !== undefined) {
          lastColumn = Math.max(lastColumn, colNumber);
        }
      });
      
      if (rowNumber > 6 && row.getCell(1).value) {
        lastRow = rowNumber;
      }
    }
  });

  // Apply borders to all cells in the attendance table
  for (let row = 6; row <= lastRow; row++) {
    for (let col = 1; col <= lastColumn; col++) {
      const cell = worksheet.getRow(row).getCell(col);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    }
  }

  // Freeze header rows
  worksheet.views = [
    { state: "frozen", xSplit: 0, ySplit: 6 }
  ];

  console.log("🎨 Applied styling to Excel sheet");
};

export default updateMonthlyAttendanceExcel;
