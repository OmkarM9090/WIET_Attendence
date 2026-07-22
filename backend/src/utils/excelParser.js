import ExcelJS from "exceljs";

const getRawValue = (cell) => {
  const raw = cell?.value;
  if (raw === undefined || raw === null) return null;
  
  if (typeof raw === "object") {
    if (raw instanceof Date) return raw;
    // Handle formulas
    if ("result" in raw) {
      if (raw.result instanceof Date) return raw.result;
      return raw.result;
    }
    // Handle rich text
    if ("richText" in raw && Array.isArray(raw.richText)) {
      return raw.richText.map(t => t.text).join("");
    }
    // Handle hyperlinks / other text objects
    if ("text" in raw) return raw.text;
  }
  return raw;
};

export const getCellValue = (cell, { asNumber = false } = {}) => {
  const raw = getRawValue(cell);
  
  if (raw === undefined || raw === null) return asNumber ? null : "";

  if (asNumber) {
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  }

  // If it's a Date, we shouldn't just String() it for generic text fields
  if (raw instanceof Date) {
    return raw.toISOString().split('T')[0];
  }

  return String(raw).trim();
};

const parseExcelDate = (cell) => {
  const raw = getRawValue(cell);
  if (raw === undefined || raw === null) return null;

  // 1. If it's already a Date object
  if (raw instanceof Date) {
    // Add timezone offset to prevent day shifting before converting to ISO string
    const offsetDate = new Date(raw.getTime() - (raw.getTimezoneOffset() * 60000));
    return offsetDate.toISOString().split('T')[0];
  }

  // 2. If it's a number (Excel serial date)
  if (typeof raw === "number") {
    // Excel epoch is Jan 1, 1900. 25569 is days between 1900 and 1970 (UNIX epoch).
    const excelEpochOffset = (raw - 25569) * 86400 * 1000;
    const d = new Date(excelEpochOffset);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }

  // 3. If it's a string
  if (typeof raw === "string") {
    const s = raw.trim();
    // Format: YYYY-MM-DD
    if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;
    
    // Format: DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      return `${dmyMatch[3]}-${month}-${day}`;
    }
    
    // Fallback: JS Date parser
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const offsetDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
      return offsetDate.toISOString().split('T')[0];
    }
  }

  return null;
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
      const parsedDate = parseExcelDate(cell);
      if (parsedDate) {
        dateColumns.push({ colIndex: colNumber, dateStr: parsedDate });
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

