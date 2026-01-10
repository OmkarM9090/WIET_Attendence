import ExcelJS from "exceljs";

export const parseStudentExcel = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  const students = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    students.push({
      name: row.getCell(1).value,
      email: row.getCell(2).value,
      rollNo: row.getCell(3).value,
      branchCode: row.getCell(4).value,
      year: row.getCell(5).value,
      division: row.getCell(6).value,
      batch: row.getCell(7).value
    });
  });

  return students;
};
