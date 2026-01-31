import ExcelJS from "exceljs";

/**
 * GENERATE DEFAULTER EXCEL EXPORT
 * 
 * ENHANCED WITH:
 * - Academic Year column
 * - Semester column
 * - Batch column
 * - Separate Lecture and Practical columns per subject
 * - Lecture percentage
 * - Practical percentage
 * - Overall percentage
 * - Remark (Defaulter / Clear)
 * - Cancelled lectures excluded (handled in controller)
 */
export const generateDefaulterExcel = async (defaulters, subjects, metadata = {}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Defaulter List");

  // METADATA: Add header information
  if (metadata.academicYear) {
    sheet.addRow([`Academic Year: ${metadata.academicYear}`]);
  }
  if (metadata.semester) {
    sheet.addRow([`Semester: ${metadata.semester}`]);
  }
  if (metadata.dateRange) {
    sheet.addRow([`Period: ${metadata.dateRange.startDate} to ${metadata.dateRange.endDate}`]);
  }
  if (metadata.threshold) {
    sheet.addRow([`Attendance Threshold: ${metadata.threshold}%`]);
  }
  sheet.addRow([]); // Empty row

  // COLUMN DEFINITIONS
  const columns = [
    { header: "Roll No", key: "rollNo", width: 10 },
    { header: "Student Name", key: "name", width: 25 },
    { header: "Academic Year", key: "academicYear", width: 15 },
    { header: "Semester", key: "semester", width: 10 },
    { header: "Batch", key: "batch", width: 10 }
  ];

  // Add subject-wise columns (Lecture, Practical, Total, Percentage)
  subjects.forEach(sub => {
    columns.push(
      { header: `${sub.code}\nLEC`, key: `${sub.code}_lec`, width: 12 },
      { header: `${sub.code}\nLEC %`, key: `${sub.code}_lecPercent`, width: 10 },
      { header: `${sub.code}\nPRAC`, key: `${sub.code}_prac`, width: 12 },
      { header: `${sub.code}\nPRAC %`, key: `${sub.code}_pracPercent`, width: 10 },
      { header: `${sub.code}\nTOTAL %`, key: `${sub.code}_total`, width: 12 }
    );
  });

  // Overall percentage and remark
  columns.push(
    { header: "Overall %", key: "overallPercentage", width: 12 },
    { header: "Remark", key: "remark", width: 15 }
  );

  sheet.columns = columns;

  // STYLE HEADER ROW
  const headerRow = sheet.getRow(metadata.academicYear ? 5 : 1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF366092' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  // ADD DATA ROWS
  defaulters.forEach(stu => {
    const row = {
      rollNo: stu.rollNo,
      name: stu.name,
      academicYear: stu.academicYear || "N/A",
      semester: stu.semester || "N/A",
      batch: stu.batch || "N/A",
      overallPercentage: stu.overallPercentage || 0,
      remark: stu.remark
    };

    // Add subject data
    subjects.forEach(sub => {
      const data = stu.subjects[sub.code] || { 
        lec: "0/0", 
        lecPercent: 0,
        prac: "0/0", 
        pracPercent: 0,
        total: 0 
      };
      row[`${sub.code}_lec`] = data.lec;
      row[`${sub.code}_lecPercent`] = data.lecPercent || 0;
      row[`${sub.code}_prac`] = data.prac;
      row[`${sub.code}_pracPercent`] = data.pracPercent || 0;
      row[`${sub.code}_total`] = data.total;
    });

    const addedRow = sheet.addRow(row);

    // COLOR CODE BASED ON REMARK
    if (stu.remark === "Defaulter") {
      addedRow.getCell("remark").fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF0000' } // Red
      };
      addedRow.getCell("remark").font = { color: { argb: 'FFFFFFFF' }, bold: true };
    } else {
      addedRow.getCell("remark").fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00FF00' } // Green
      };
      addedRow.getCell("remark").font = { bold: true };
    }

    // Color code percentages
    addedRow.getCell("overallPercentage").font = {
      bold: true,
      color: { argb: stu.overallPercentage < 75 ? 'FFFF0000' : 'FF00AA00' }
    };
  });

  // AUTO-FIT COLUMNS
  sheet.columns.forEach(column => {
    if (!column.width) column.width = 15;
  });

  return workbook;
};