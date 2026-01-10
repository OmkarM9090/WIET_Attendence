import { generateDefaulterPDF } from "../utils/defaulterPdf.js";

export const exportDefaulterPDF = async (req, res) => {
  const { defaulters, subjects, meta } = req.body;

  const doc = generateDefaulterPDF(defaulters, subjects, meta);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=Defaulter_List.pdf"
  );

  doc.pipe(res);
  doc.end();
};
