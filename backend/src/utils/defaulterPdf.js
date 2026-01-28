import PDFDocument from "pdfkit";

export const generateDefaulterPDF = (
  defaulters,
  subjects,
  meta // branch, year, division, dates
) => {
  const doc = new PDFDocument({ size: "A4", margin: 30 });
  doc.fontSize(14).text("Defaulter List", { align: "center" });
  doc.moveDown();

  doc.fontSize(10).text(
    `Branch: ${meta.branch} | Year: ${meta.year} | Division: ${meta.division}`
  );
  doc.text(`Academic Year: ${meta.academicYear || 'N/A'}`);
  doc.text(`Period: ${meta.startDate} to ${meta.endDate}`);
  doc.moveDown(2);

  // Table header
  let x = 30;
  doc.fontSize(9).text("Roll", x, doc.y); x += 40;
  doc.text("Name", x, doc.y); x += 120;
  doc.text("Batch", x, doc.y); x += 40;

  subjects.forEach(sub => {
    doc.text(`${sub.code} L`, x, doc.y); x += 35;
    doc.text(`${sub.code} P`, x, doc.y); x += 35;
    doc.text(`${sub.code} T`, x, doc.y); x += 35;
  });

  doc.text("Remark", x, doc.y);
  doc.moveDown();

  // Rows
  defaulters.forEach(stu => {
    x = 30;
    doc.text(stu.rollNo, x); x += 40;
    doc.text(stu.name, x); x += 120;
    doc.text(stu.batch, x); x += 40;

    subjects.forEach(sub => {
      const s = stu.subjects[sub.code] || {};
      doc.text(s.lec || "0/0", x); x += 35;
      doc.text(s.prac || "0/0", x); x += 35;
      doc.text(s.total || 0, x); x += 35;
    });

    doc.text(stu.remark, x);
    doc.moveDown();
  });

  return doc;
};
