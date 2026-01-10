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
