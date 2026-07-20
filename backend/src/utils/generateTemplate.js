import ExcelJS from "exceljs";

export const generateStudentTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Students");

  // Row 1: Instructions (Merged)
  sheet.mergeCells("A1:G1");
  const instructionCell = sheet.getCell("A1");
  instructionCell.value = "INSTRUCTIONS: Do not change column headers. Ensure Roll No, Year, and Division are valid. Year should be 1, 2, 3, or 4. Division should be A, B, or C.";
  instructionCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  instructionCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0070C0" }
  };
  instructionCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  sheet.getRow(1).height = 40;

  // Row 2: Headers
  const headers = ["Name", "Email", "Roll No", "Branch Code", "Year", "Division", "Batch"];
  const headerRow = sheet.getRow(2);
  headerRow.values = headers;
  
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" }
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  // Set column widths
  sheet.columns = [
    { key: "name", width: 25 },
    { key: "email", width: 30 },
    { key: "rollNo", width: 10 },
    { key: "branchCode", width: 15 },
    { key: "year", width: 10 },
    { key: "division", width: 10 },
    { key: "batch", width: 10 },
  ];

  // Row 3: Sample Data
  const sampleRow = sheet.getRow(3);
  sampleRow.values = ["Rahul Sharma", "rahul.s@example.com", 101, "COMP", 2, "A", "A1"];
  sampleRow.eachCell((cell) => {
    cell.font = { italic: true, color: { argb: "FF808080" } };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
