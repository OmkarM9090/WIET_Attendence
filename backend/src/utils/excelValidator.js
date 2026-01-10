import Branch from "../models/Branch.js";
import User from "../models/User.js";

export const validateStudentRow = async (row) => {
  const errors = [];

  if (!row.name) errors.push("Name missing");
  if (!row.email) errors.push("Email missing");
  if (!row.rollNo) errors.push("Roll No missing");
  if (!row.branchCode) errors.push("Branch code missing");
  if (!row.year) errors.push("Year missing");
  if (!row.division) errors.push("Division missing");

  if (row.email) {
    const exists = await User.findOne({ email: row.email });
    if (exists) errors.push("Email already exists");
  }

  if (row.branchCode) {
    const branch = await Branch.findOne({ code: row.branchCode });
    if (!branch) errors.push("Invalid branch code");
  }

  return errors;
};
