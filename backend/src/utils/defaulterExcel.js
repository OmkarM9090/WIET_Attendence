import ExcelJS from "exceljs";

export const generateDefaulterExcel = async (defaulters, subjects) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Defaulter List");

  const columns = [
    { header: "Roll No", key: "rollNo", width: 10 },
    { header: "Student Name", key: "name", width: 25 },
    { header: "Academic Year", key: "academicYear", width: 15 },
    { header: "Batch", key: "batch", width: 10 }
  ];

  subjects.forEach(sub => {
    columns.push(
      { header: `${sub.code} LEC`, key: `${sub.code}_lec`, width: 12 },
      { header: `${sub.code} PR`, key: `${sub.code}_prac`, width: 12 },
      { header: `${sub.code} TOTAL`, key: `${sub.code}_total`, width: 12 }
    );
  });

  columns.push({ header: "Remark", key: "remark", width: 15 });
  sheet.columns = columns;

  defaulters.forEach(stu => {
    const row = {
      rollNo: stu.rollNo,
      name: stu.name,
      academicYear: stu.academicYear || "N/A",  // Academic Year
      batch: stu.batch,
      remark: stu.remark
    };

    subjects.forEach(sub => {
      const data = stu.subjects[sub.code] || { lec: "0/0", prac: "0/0", total: 0 };
      row[`${sub.code}_lec`] = data.lec;
      row[`${sub.code}_prac`] = data.prac;
      row[`${sub.code}_total`] = data.total;
    });

    sheet.addRow(row);
  });

  return workbook;
};