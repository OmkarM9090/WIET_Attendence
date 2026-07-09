import ExcelJS from "exceljs";

const getCellValue = (cell, { asNumber = false } = {}) => {
  const raw = cell?.value;

  // ExcelJS wraps hyperlink cells in an object with a text property
  let value = raw && typeof raw === "object" && "text" in raw ? raw.text : raw;

  if (value === undefined || value === null) return asNumber ? null : "";

  if (asNumber) {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  return String(value).trim();
};

export const parseStudentExcel = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  const students = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    students.push({
      name: getCellValue(row.getCell(1)),
      email: getCellValue(row.getCell(2)),
      rollNo: getCellValue(row.getCell(3), { asNumber: true }),
      branchCode: getCellValue(row.getCell(4)),
      year: getCellValue(row.getCell(5), { asNumber: true }),
      division: getCellValue(row.getCell(6)),
      batch: getCellValue(row.getCell(7))
    });
  });

  return students;
};

export const parseAttendanceExcel = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  
  // Find header row (usually row 6, but let's find the row with 'Roll No')
  let headerRow = null;
  let headerRowIdx = -1;
  sheet.eachRow((row, rowNumber) => {
    if (getCellValue(row.getCell(1)) === "Roll No") {
      headerRow = row;
      headerRowIdx = rowNumber;
    }
  });

  if (!headerRow) {
    throw new Error("Invalid Excel format: Could not find 'Roll No' column");
  }

  // Find date columns
  const dateColumns = []; // { colIndex, dateStr }
  const baseColumns = getCellValue(headerRow.getCell(3)) === "Batch" ? 3 : 2;
  
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber > baseColumns) {
      const val = getCellValue(cell);
      if (val && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateColumns.push({ colIndex: colNumber, dateStr: val });
      }
    }
  });

  const attendanceData = {
    dates: dateColumns.map(d => d.dateStr),
    records: {} // { "2024-10-01": { present: [roll1, roll2], absent: [roll3] } }
  };

  dateColumns.forEach(d => {
    attendanceData.records[d.dateStr] = { present: [], absent: [] };
  });

  // Read students
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > headerRowIdx) {
      const rollNo = getCellValue(row.getCell(1), { asNumber: true });
      if (rollNo) {
        dateColumns.forEach(d => {
          const val = getCellValue(row.getCell(d.colIndex));
          // Accept 1 or "1" or "P" or "present" etc
          if (val === "1" || val === 1 || String(val).toLowerCase() === "p" || String(val).toLowerCase() === "present") {
            attendanceData.records[d.dateStr].present.push(rollNo);
          } else if (val === "0" || val === 0 || String(val).toLowerCase() === "a" || String(val).toLowerCase() === "absent") {
            attendanceData.records[d.dateStr].absent.push(rollNo);
          }
        });
      }
    }
  });

  return attendanceData;
};

