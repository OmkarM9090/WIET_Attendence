import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Student from "../models/Student.js";

/**
 * CREATE STUDENT
 * Admin only
 */
export const createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      rollNo,
      branch,
      year,
      division,
      admissionYear,
    } = req.body;

    // 1️. Validation
    if (!name || !email || !password || !rollNo || !branch || !year || !division) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // 2️. Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 3️. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4️. Create USER (auth identity)
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "student",
    });

    // 5️⃣ Create STUDENT (academic identity)
    const student = await Student.create({
      userId: user._id,
      rollNo,
      branch,
      year,
      division,
      admissionYear,
    });

    res.status(201).json({
      message: "Student created successfully",
      student,
    });
  } catch (error) {
    console.error("CREATE STUDENT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET STUDENTS (FILTERABLE)
 * Admin only
 */
export const getStudents = async (req, res) => {
  try {
    const { branch, year, division } = req.query;

    const filter = {};
    if (branch) filter.branch = branch;
    if (year) filter.year = year;
    if (division) filter.division = division;

    const students = await Student.find(filter)
      .populate("userId", "name email")
      .populate("branch", "name code");

    res.json(students);
  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
