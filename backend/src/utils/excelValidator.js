import Branch from "../models/Branch.js";
import User from "../models/User.js";

export const validateStudentRow = async (row) => {
  const errors = [];
  
  if (!row.name) errors.push("Name missing hai.");
  if (!row.rollNo) errors.push("Roll No missing hai.");
  if (!row.branchCode) errors.push("Branch code missing hai.");
  
  if (row.year && ![1, 2, 3, 4].includes(row.year)) {
    errors.push("Invalid Year (should be 1, 2, 3, or 4).");
  } else if (!row.year) {
    errors.push("Year missing hai.");
  }
  
  if (row.division && !["A", "B", "C"].includes(row.division.toUpperCase())) {
    errors.push("Division must be A, B, or C.");
  } else if (!row.division) {
    errors.push("Division missing hai.");
  }

  if (row.email) {
    const exists = await User.findOne({ email: row.email });
    if (exists) errors.push("Yeh email pehle se registered hai.");
  } else {
    errors.push("Email missing hai.");
  }

  let branchObj = null;
  if (row.branchCode) {
    const branch = await Branch.findOne({ code: row.branchCode.toUpperCase() });
    if (!branch) {
      errors.push(`Branch Code "${row.branchCode}" doesn't exist.`);
    } else {
      branchObj = branch;
    }
  }

  return { errors, branch: branchObj };
};
