import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export const generateErrorExcel = async (errorRows) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Upload Errors");

  sheet.columns = [
    { header: "Row No", key: "rowNo", width: 10 },
    { header: "Name", key: "name", width: 20 },
    { header: "Email", key: "email", width: 25 },
    { header: "Roll No", key: "rollNo", width: 10 },
    { header: "Branch", key: "branchCode", width: 10 },
    { header: "Year", key: "year", width: 8 },
    { header: "Division", key: "division", width: 10 },
    { header: "Batch", key: "batch", width: 10 },
    { header: "Error Reason", key: "error", width: 40 },
  ];

  errorRows.forEach(row => sheet.addRow(row));

  const filePath = path.join(
    "exports",
    `student_upload_errors_${Date.now()}.xlsx`
  );

  await workbook.xlsx.writeFile(filePath);
  return filePath;
};
