import { generateDefaulterExcel } from "../utils/defaulterExcel.js";

import Subject from "../models/Subject.js";

export const exportDefaulterExcel = async (req, res) => {
  const { defaulters } = req.body;
  const subjects = await Subject.find();

  const workbook = await generateDefaulterExcel(defaulters, subjects);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=Defaulter_List.xlsx"
  );

  await workbook.xlsx.write(res);
  res.end();
};
