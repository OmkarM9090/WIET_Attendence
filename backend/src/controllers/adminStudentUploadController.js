import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Branch from "../models/Branch.js";
import Batch from "../models/Batch.js";
import ExcelJS from "exceljs";
import { parseStudentExcel, getCellValue } from "../utils/excelParser.js";
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
      const { errors, branch, batch } = await validateStudentRow(s);
      
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
          batch: batch ? batch._id : undefined,
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

// --- SIMPLIFIED UPLOAD LOGIC ---

export const getClassInfo = async (req, res) => {
  try {
    const { branchId, year, division } = req.query;
    
    if (!branchId || !year || !division) {
      return res.status(400).json({ success: false, message: 'Branch, Year aur Division select karna zaroori hai' });
    }
    
    const yearNum = parseInt(year);
    if (![1, 2, 3, 4].includes(yearNum)) {
      return res.status(400).json({ success: false, message: 'Year 1, 2, 3, ya 4 hona chahiye' });
    }
    
    const div = division.toUpperCase();
    if (!['A', 'B', 'C'].includes(div)) {
      return res.status(400).json({ success: false, message: 'Division A, B, ya C hona chahiye' });
    }
    
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch database mein exist nahi karta' });
    }
    
    const currentCount = await Student.countDocuments({
      branch: branchId,
      year: yearNum,
      division: div
    });
    
    const yearLabels = {
      1: 'FE (First Year)',
      2: 'SE (Second Year)',
      3: 'TE (Third Year)',
      4: 'BE (Fourth Year)'
    };
    
    const academicYear = getCurrentAcademicYear();
    
    res.json({
      success: true,
      classInfo: {
        branchId: branch._id,
        branchCode: branch.code,
        branchName: branch.name,
        year: yearNum,
        yearLabel: yearLabels[yearNum],
        division: div,
        academicYear,
        currentStudentCount: currentCount,
        displayName: `${yearLabels[yearNum].split(' ')[0]}-${div} ${branch.code}`
      }
    });
    
  } catch (error) {
    console.error('[CLASS-INFO ERROR]', error);
    res.status(500).json({ success: false, message: 'Class info fetch karne mein error aaya', error: error.message });
  }
};

const generateAutoEmail = (rollNumber, branchCode) => {
  return `${rollNumber}.${branchCode.toLowerCase()}@college.edu`;
};

const normalizeHeaderText = (value) => String(value || "").trim().toLowerCase();

const detectStudentDataStartRow = (sheet) => {
  const maxScanRow = Math.min(sheet.rowCount, 25);

  for (let rowIdx = 1; rowIdx <= maxScanRow; rowIdx++) {
    const row = sheet.getRow(rowIdx);
    const col1 = normalizeHeaderText(getCellValue(row.getCell(1)));
    const col2 = normalizeHeaderText(getCellValue(row.getCell(2)));

    const hasRollHeader = col1.includes("roll");
    const hasNameHeader = col2.includes("name");

    if (hasRollHeader && hasNameHeader) {
      return rowIdx + 1;
    }
  }

  return 2;
};

const hasStudentRowData = (row) => {
  const c1 = String(getCellValue(row.getCell(1)) || "").trim();
  const c2 = String(getCellValue(row.getCell(2)) || "").trim();
  const c3 = String(getCellValue(row.getCell(3)) || "").trim();
  const c4 = String(getCellValue(row.getCell(4)) || "").trim();
  return !!(c1 || c2 || c3 || c4);
};

export const downloadSimpleTemplate = async (req, res) => {
  try {
    const { branchCode = 'COMP', year = 2, division = 'A' } = req.query;
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${branchCode}-Y${year}-${division}`);
    
    sheet.mergeCells('A1:D1');
    const infoCell = sheet.getCell('A1');
    infoCell.value = `📚 Class: ${branchCode} - Year ${year} - Division ${division}`;
    infoCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;
    
    sheet.mergeCells('A2:D2');
    const instructionCell = sheet.getCell('A2');
    instructionCell.value = '⚠️ Fill Roll No & Name of the Student (mandatory). Email & Batch are optional.';
    instructionCell.font = { italic: true, color: { argb: 'FF92400E' } };
    instructionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    instructionCell.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 25;
    
    const headers = ['Roll No*', 'Name of the Student*', 'Email (Optional)', 'Batch (Optional)'];
    sheet.getRow(3).values = headers;
    sheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
    sheet.getRow(3).alignment = { horizontal: 'center' };
    sheet.getRow(3).height = 25;
    
    const samples = [
      [101, 'Rahul Sharma', '', 'B1'],
      [102, 'Priya Patel', 'priya@college.edu', 'B1'],
      [103, 'Amit Kumar', '', 'B2']
    ];
    
    samples.forEach((sample, idx) => {
      sheet.getRow(idx + 4).values = sample;
      sheet.getRow(idx + 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F5E7' } };
    });
    
    sheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 30 },
      { width: 15 }
    ];
    
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=students_${branchCode}_Y${year}_${division}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('[TEMPLATE ERROR]', error);
    res.status(500).json({ success: false, message: 'Template download failed' });
  }
};

export const uploadStudentsSimple = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Excel file upload karo pehle' });
    }
    
    const { branchId, year, division } = req.body;
    
    if (!branchId || !year || !division) {
      return res.status(400).json({ success: false, message: 'Branch, Year, aur Division select karna zaroori hai' });
    }
    
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Selected branch database mein exist nahi karta' });
    }
    
    const yearNum = parseInt(year);
    if (![1, 2, 3, 4].includes(yearNum)) {
      return res.status(400).json({ success: false, message: 'Invalid year. 1, 2, 3, ya 4 hona chahiye' });
    }
    
    const div = division.toUpperCase();
    if (!['A', 'B', 'C'].includes(div)) {
      return res.status(400).json({ success: false, message: 'Invalid division. A, B, ya C hona chahiye' });
    }
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.getWorksheet(1);
    
    if (!sheet) {
      return res.status(400).json({ success: false, message: 'Excel file mein koi sheet nahi hai' });
    }
    
    const academicYear = getCurrentAcademicYear();
    
    const existingStudents = await Student.find({
      branch: branchId,
      year: yearNum,
      division: div
    }).select('rollNo');
    
    const existingRollNumbers = new Set(
      existingStudents.map(s => s.rollNo.toString())
    );
    
    const allExistingUsers = await User.find({ role: 'student' }).select('email');
    const allExistingEmails = new Set(allExistingUsers.map(u => u.email));
    
    const successful = [];
    const failed = [];
    const processedRollNumbers = new Set();
    const processedEmails = new Set();

    const dataStartRow = detectStudentDataStartRow(sheet);
    let logicalRowNumber = 0;
    let totalDataRows = 0;

    const pushFailedRow = (excelRowNumber, data, reason, simpleMessage) => {
      failed.push({
        rowNumber: logicalRowNumber,
        excelRowNumber,
        data,
        reason,
        simpleMessage
      });
    };

    for (let rowIdx = dataStartRow; rowIdx <= sheet.rowCount; rowIdx++) {
      const row = sheet.getRow(rowIdx);

      if (!hasStudentRowData(row)) continue;

      logicalRowNumber += 1;
      totalDataRows += 1;

      const rawRollNo = getCellValue(row.getCell(1));
      const rollNo = rawRollNo ? String(rawRollNo).trim() : '';
      const name = getCellValue(row.getCell(2));
      const emailCell = getCellValue(row.getCell(3));
      const batchCell = getCellValue(row.getCell(4));

      if (!name) {
        pushFailedRow(rowIdx, { name, rollNo }, 'Name missing', `Row ${logicalRowNumber} mein name empty hai`);
        continue;
      }

      if (!rollNo) {
        pushFailedRow(rowIdx, { name, rollNo }, 'Roll number missing', `Row ${logicalRowNumber} mein roll number empty hai`);
        continue;
      }

      if (!/^\d+$/.test(rollNo)) {
        pushFailedRow(rowIdx, { name, rollNo }, 'Invalid roll number', `Row ${logicalRowNumber}: Roll number sirf numbers hone chahiye`);
        continue;
      }

      if (existingRollNumbers.has(rollNo)) {
        pushFailedRow(rowIdx, { name, rollNo }, 'Duplicate roll number', `Row ${logicalRowNumber}: Roll number ${rollNo} is class mein pehle se exist karta hai`);
        continue;
      }

      if (processedRollNumbers.has(rollNo)) {
        pushFailedRow(rowIdx, { name, rollNo }, 'Duplicate in Excel', `Row ${logicalRowNumber}: Roll number ${rollNo} Excel mein multiple baar hai`);
        continue;
      }

      let email = emailCell;
      if (!email || email === '') {
        email = generateAutoEmail(rollNo, branch.code);
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        pushFailedRow(rowIdx, { name, rollNo, email }, 'Invalid email', `Row ${logicalRowNumber}: Email format galat hai (${email})`);
        continue;
      }

      if (allExistingEmails.has(email)) {
        pushFailedRow(rowIdx, { name, rollNo, email }, 'Duplicate email', `Row ${logicalRowNumber}: Email ${email} pehle se registered hai`);
        continue;
      }

      if (processedEmails.has(email)) {
        pushFailedRow(rowIdx, { name, rollNo, email }, 'Duplicate email in Excel', `Row ${logicalRowNumber}: Email ${email} Excel mein multiple baar hai`);
        continue;
      }
      
      let batchId = null;
      if (batchCell && batchCell !== '') {
        let batch = await Batch.findOne({ name: batchCell, branch: branchId, year: yearNum, division: div });
        
        if (!batch) {
          batch = await Batch.create({
            name: batchCell,
            branch: branchId,
            year: yearNum,
            division: div,
            academicYear,
            isActive: true,
            autoCreated: true
          });
          console.log(`[BATCH] Auto-created batch: ${batchCell} for ${branch.code}-Y${yearNum}-${div}`);
        }
        
        batchId = batch._id;
      }
      
      successful.push({
        name,
        rollNo: rollNo, // user schema has rollNo not rollNumber
        email,
        branch: branchId,
        year: yearNum,
        division: div,
        batch: batchId,
        academicYear
      });
      
      processedRollNumbers.add(rollNo);
      processedEmails.add(email);
    }
    
    if (successful.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Koi valid students nahi mile Excel mein',
        summary: { total: totalDataRows, successful: 0, failed: failed.length },
        failedRows: failed
      });
    }
    
    const passwordHash = await bcrypt.hash('student123', 10);
    const addedStudents = [];
    
    for (const studentData of successful) {
      try {
        const user = await User.create({
          name: studentData.name,
          email: studentData.email,
          passwordHash,
          role: 'student'
        });
        
        const student = await Student.create({
          userId: user._id,
          rollNo: studentData.rollNo,
          branch: studentData.branch,
          year: studentData.year,
          division: studentData.division,
          batch: studentData.batch,
          academicYear: studentData.academicYear,
          admissionDate: new Date()
        });
        
        addedStudents.push({
          id: student._id,
          name: user.name,
          rollNo: student.rollNo,
          email: user.email
        });
        
      } catch (createError) {
        console.error(`[CREATE ERROR] Row ${studentData.rollNo}:`, createError.message);
        failed.push({
          rowNumber: 'DB',
          data: studentData,
          reason: 'Database error',
          simpleMessage: `${studentData.name} ko add karne mein database error aaya`
        });
      }
    }
    
    const timeTaken = Date.now() - startTime;
    
    res.json({
      success: true,
      message: `${addedStudents.length} students successfully added`,
      classInfo: {
        branch: branch.code,
        branchName: branch.name,
        year: yearNum,
        division: div,
        academicYear
      },
      summary: {
        total: totalDataRows,
        successful: addedStudents.length,
        failed: failed.length,
        timeTakenMs: timeTaken
      },
      addedStudents,
      failedRows: failed
    });
    
  } catch (error) {
    console.error('[UPLOAD ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Upload mein error aaya. Please try again.',
      error: error.message
    });
  }
};
