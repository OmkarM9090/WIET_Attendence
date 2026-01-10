import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Branch from "../models/Branch.js";
import { parseStudentExcel } from "../utils/excelParser.js";

export const uploadStudentsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file required" });
    }

    const students = await parseStudentExcel(req.file.buffer);

    let created = 0;
    let skipped = 0;

    for (const s of students) {
      // 1️⃣ Check branch
      const branch = await Branch.findOne({ code: s.branchCode });
      if (!branch) {
        skipped++;
        continue;
      }

      // 2️⃣ Skip if user exists
      const existingUser = await User.findOne({ email: s.email });
      if (existingUser) {
        skipped++;
        continue;
      }

      // 3️⃣ Create user
      const passwordHash = await bcrypt.hash("student123", 10);

      const user = await User.create({
        name: s.name,
        email: s.email,
        passwordHash,
        role: "student"
      });

      // 4️⃣ Create student profile
      await Student.create({
        userId: user._id,
        rollNo: s.rollNo,
        branch: branch._id,
        year: s.year,
        division: s.division,
        batch: s.batch
      });

      created++;
    }

    res.json({
      message: "Excel processed successfully",
      created,
      skipped
    });

  } catch (error) {
    console.error("EXCEL UPLOAD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
