import ExcelJS from 'exceljs';

const addReferenceSheet = (workbook, branches) => {
  const referenceSheet = workbook.addWorksheet('Reference Data');

  // Column widths
  referenceSheet.columns = [
    { width: 15 }, // Code
    { width: 35 }, // Name
    { width: 5 },  // Spacer
    { width: 45 }, // Notes
  ];

  // Title: Branches
  referenceSheet.getCell('A1').value = 'AVAILABLE BRANCH CODES';
  referenceSheet.getCell('A1').font = { bold: true, size: 12 };
  referenceSheet.mergeCells('A1:B1');

  // Branch Headers
  referenceSheet.getCell('A2').value = 'Branch Code';
  referenceSheet.getCell('B2').value = 'Branch Name';
  referenceSheet.getRow(2).font = { bold: true };
  referenceSheet.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };

  // Add branches dynamically
  let rowIdx = 3;
  if (branches && branches.length > 0) {
    branches.forEach(b => {
      referenceSheet.getCell(`A${rowIdx}`).value = b.code;
      referenceSheet.getCell(`B${rowIdx}`).value = b.name;
      rowIdx++;
    });
  } else {
    referenceSheet.getCell(`A${rowIdx}`).value = 'No branches found';
    rowIdx++;
  }

  rowIdx += 2; // Add some space

  // Title: Other Validations
  referenceSheet.getCell(`A${rowIdx}`).value = 'OTHER AVAILABLE VALUES';
  referenceSheet.getCell(`A${rowIdx}`).font = { bold: true, size: 12 };
  referenceSheet.mergeCells(`A${rowIdx}:B${rowIdx}`);
  rowIdx++;

  referenceSheet.getCell(`A${rowIdx}`).value = 'Available Years';
  referenceSheet.getCell(`B${rowIdx}`).value = '1, 2, 3, 4';
  rowIdx++;
  
  referenceSheet.getCell(`A${rowIdx}`).value = 'Available Divisions';
  referenceSheet.getCell(`B${rowIdx}`).value = 'A, B, C';
  rowIdx++;

  // Notes Section (on the right side D column)
  referenceSheet.getCell('D1').value = 'IMPORTANT NOTES';
  referenceSheet.getCell('D1').font = { bold: true, size: 12 };
  
  const notes = [
    '• Default password for all students/teachers: student123',
    '• Users can change password after first login',
    '• If batch doesn\'t exist, it will be auto-created during upload',
    '• Leave batch empty if not applicable (like for Lectures)',
    '• Email must be unique for each user'
  ];

  notes.forEach((note, idx) => {
    referenceSheet.getCell(`D${2 + idx}`).value = note;
  });
};

export const generateStudentTemplate = async (branches) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Students');
  
  // Row 1: Instructions (Multiline)
  sheet.mergeCells('A1:G1');
  const instructionCell = sheet.getCell('A1');
  instructionCell.value = `⚠️ INSTRUCTIONS: 
• Fill data starting from Row 5 (Row 3 has hints, Row 4+ has samples)
• Do NOT modify Row 2 (headers)
• Save as .xlsx format only
• Check "Reference Data" sheet for available codes
• Default password will be: student123`;
  instructionCell.font = { bold: true, color: { argb: 'FF9C4400' } };
  instructionCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF3CD' }
  };
  instructionCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  sheet.getRow(1).height = 90;
  
  // Row 2: Headers
  const headers = ['Name*', 'Email*', 'Roll No*', 'Branch Code*', 'Year*', 'Division*', 'Batch'];
  sheet.getRow(2).values = headers;
  sheet.getRow(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(2).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' } // Indigo 600
  };
  sheet.getRow(2).alignment = { horizontal: 'center' };
  sheet.getRow(2).height = 25;
  
  // Row 3: Hints
  const hints = ['Full Name', 'valid@email.com', 'Number', 'From Sheet 2', '1/2/3/4', 'A/B/C', 'Optional'];
  sheet.getRow(3).values = hints;
  sheet.getRow(3).font = { italic: true, color: { argb: 'FF9CA3AF' }, size: 10 };
  sheet.getRow(3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF9FAFB' } 
  };
  sheet.getRow(3).alignment = { horizontal: 'center' };

  // Row 4+: Sample Data
  const samples = [
    ['Rahul Sharma', 'rahul.sharma@college.edu', 101, 'COMP', 2, 'A', 'B1'],
    ['Priya Patel', 'priya.patel@college.edu', 102, 'COMP', 2, 'A', 'B1'],
    ['Amit Kumar', 'amit.kumar@college.edu', 103, 'IT', 3, 'B', 'B2']
  ];
  
  samples.forEach((row, idx) => {
    sheet.addRow(row);
    sheet.getRow(idx + 4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7F5E7' } // Light Green
    };
  });
  
  // Column widths
  sheet.columns = [
    { width: 25 }, // Name
    { width: 30 }, // Email
    { width: 15 }, // Roll No
    { width: 18 }, // Branch
    { width: 12 }, // Year
    { width: 15 }, // Division
    { width: 12 }, // Batch
  ];
  
  // Add borders to all cells up to the last sample row
  for(let i=2; i <= 6; i++) {
    const row = sheet.getRow(i);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }
  
  // Add data validation for Year (1-4)
  sheet.dataValidations.add('E5:E1000', {
    type: 'list',
    allowBlank: false,
    formulae: ['"1,2,3,4"'],
    showErrorMessage: true,
    errorTitle: 'Invalid Year',
    error: 'Year must be 1, 2, 3, or 4'
  });
  
  // Add data validation for Division (A, B, C)
  sheet.dataValidations.add('F5:F1000', {
    type: 'list',
    allowBlank: false,
    formulae: ['"A,B,C"'],
    showErrorMessage: true,
    errorTitle: 'Invalid Division',
    error: 'Division must be A, B, or C'
  });

  // Add footer row
  const footerRow = Math.max(7, sheet.rowCount + 2);
  sheet.mergeCells(`A${footerRow}:G${footerRow}`);
  const footerCell = sheet.getCell(`A${footerRow}`);
  footerCell.value = `Template downloaded on: ${new Date().toLocaleString('en-IN')} | WIET Attendance System`;
  footerCell.font = { italic: true, color: { argb: 'FF9CA3AF' }, size: 9 };
  footerCell.alignment = { horizontal: 'center' };
  
  // Add Reference Sheet
  addReferenceSheet(workbook, branches);

  return workbook;
};

export const generateTeacherTemplate = async (branches) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Teachers');
  
  // Row 1: Instructions
  sheet.mergeCells('A1:E1');
  const instructionCell = sheet.getCell('A1');
  instructionCell.value = `⚠️ INSTRUCTIONS: 
• Fill data starting from Row 5 (Row 3 has hints, Row 4+ has samples)
• Do NOT modify Row 2 (headers)
• Save as .xlsx format only
• Check "Reference Data" sheet for available codes
• Default password will be: student123`;
  instructionCell.font = { bold: true, color: { argb: 'FF9C4400' } };
  instructionCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF3CD' }
  };
  instructionCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  sheet.getRow(1).height = 90;
  
  // Row 2: Headers
  const headers = ['Name*', 'Email*', 'Department Code*', 'Phone Number', 'Designation'];
  sheet.getRow(2).values = headers;
  sheet.getRow(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(2).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }
  };
  sheet.getRow(2).alignment = { horizontal: 'center' };
  sheet.getRow(2).height = 25;

  // Row 3: Hints
  const hints = ['Full Name', 'valid@email.com', 'From Sheet 2', '10 Digits', 'Optional'];
  sheet.getRow(3).values = hints;
  sheet.getRow(3).font = { italic: true, color: { argb: 'FF9CA3AF' }, size: 10 };
  sheet.getRow(3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF9FAFB' } 
  };
  sheet.getRow(3).alignment = { horizontal: 'center' };
  
  // Row 4: Sample Data
  const samples = [
    ['Dr. Ramesh Verma', 'ramesh.verma@college.edu', 'COMP', '9876543210', 'Professor'],
    ['Prof. Anita Desai', 'anita.desai@college.edu', 'IT', '8765432109', 'Assistant Professor']
  ];
  
  samples.forEach((row, idx) => {
    sheet.addRow(row);
    sheet.getRow(idx + 4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7F5E7' }
    };
  });
  
  // Column widths
  sheet.columns = [
    { width: 25 }, // Name
    { width: 30 }, // Email
    { width: 18 }, // Dept
    { width: 18 }, // Phone
    { width: 25 }, // Designation
  ];
  
  for(let i=2; i <= 5; i++) {
    const row = sheet.getRow(i);
    row.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  }

  // Add data validation for Designation
  sheet.dataValidations.add('E5:E1000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"Professor,Associate Professor,Assistant Professor,Lecturer"'],
  });

  // Add footer row
  const footerRow = Math.max(6, sheet.rowCount + 2);
  sheet.mergeCells(`A${footerRow}:E${footerRow}`);
  const footerCell = sheet.getCell(`A${footerRow}`);
  footerCell.value = `Template downloaded on: ${new Date().toLocaleString('en-IN')} | WIET Attendance System`;
  footerCell.font = { italic: true, color: { argb: 'FF9CA3AF' }, size: 9 };
  footerCell.alignment = { horizontal: 'center' };

  // Add Reference Sheet
  addReferenceSheet(workbook, branches);

  return workbook;
};
