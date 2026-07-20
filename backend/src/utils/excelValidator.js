import Branch from "../models/Branch.js";
import User from "../models/User.js";
import Batch from "../models/Batch.js";

// Helper function to auto-detect academic year
function getCurrentAcademicYear() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  
  if (month >= 7) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

async function findOrCreateBatch(batchName, branchId, year, division) {
  if (!batchName || batchName.trim() === '') {
    // Batch is optional, return null
    return null;
  }
  
  const bName = batchName.trim();
  const div = division.toUpperCase();
  const yr = parseInt(year);

  // Try to find existing batch
  let batch = await Batch.findOne({
    name: bName,
    branch: branchId,
    year: yr,
    division: div
  });
  
  // Auto-create if not found
  if (!batch) {
    console.log(`[BATCH] Auto-creating batch: ${bName} for branch:${branchId}-Y${yr}-${div}`);
    
    batch = await Batch.create({
      name: bName,
      branch: branchId,
      year: yr,
      division: div,
      academicYear: getCurrentAcademicYear(),
      autoCreated: true // mark that this was auto-created
    });
  }
  
  return batch;
}

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
  let batchObj = null;

  if (row.branchCode) {
    const branch = await Branch.findOne({ code: row.branchCode.toUpperCase() });
    if (!branch) {
      errors.push(`Branch Code "${row.branchCode}" doesn't exist.`);
    } else {
      branchObj = branch;
      
      // If branch exists and year/div are valid, find/create batch
      if (row.year && row.division && row.batch) {
        try {
          batchObj = await findOrCreateBatch(row.batch, branch._id, row.year, row.division);
        } catch (err) {
          errors.push(`Batch creation failed: ${err.message}`);
        }
      }
    }
  }

  return { errors, branch: branchObj, batch: batchObj };
};
