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
      academicYear,  // Academic Year (e.g., "2024-2025")
      admissionYear,
    } = req.body;

    // 1️. Validation
    if (!name || !email || !password || !rollNo || !branch || !year || !division) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Validate academicYear
    if (!academicYear) {
      return res.status(400).json({ message: "Academic Year is required" });
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

    // 5️. Create STUDENT (academic identity)
    const student = await Student.create({
      userId: user._id,
      rollNo,
      branch,
      year,
      division,
      academicYear,  // Academic Year
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
    const { branch, year, division, search } = req.query;

    const filter = {};
    if (branch) filter.branch = branch;
    if (year) filter.year = year;
    if (division) filter.division = division;

    // Text / roll search across user.name, user.email, or rollNo
    if (search) {
      const regex = new RegExp(search, "i");
      const matchedUserIds = await User.find({
        $or: [{ name: regex }, { email: regex }],
      }).distinct("_id");

      const rollNum = Number(search);
      const searchOr = [];
      if (matchedUserIds.length) searchOr.push({ userId: { $in: matchedUserIds } });
      if (!Number.isNaN(rollNum)) searchOr.push({ rollNo: rollNum });

      // If nothing matches, short-circuit to empty result
      if (searchOr.length === 0) {
        return res.json([]);
      }

      filter.$or = searchOr;
    }

    const students = await Student.find(filter)
      .populate("userId", "name email")
      .populate("branch", "name code");

    res.json(students);
  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE STUDENT
 * Admin only
 */
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      rollNo,
      branch,
      year,
      division,
      academicYear,
      admissionYear,
      status,
    } = req.body;

    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const user = await User.findById(student.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Ensure email is unique if changed
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }

    if (name) user.name = name;
    await user.save();

    // Update student fields
    if (rollNo !== undefined) student.rollNo = rollNo;
    if (branch) student.branch = branch;
    if (year) student.year = year;
    if (division) student.division = division;
    if (academicYear) student.academicYear = academicYear;
    if (admissionYear !== undefined) student.admissionYear = admissionYear;
    if (status) student.status = status;

    await student.save();

    const populated = await Student.findById(id)
      .populate("userId", "name email")
      .populate("branch", "name code");

    res.json({ message: "Student updated", student: populated });
  } catch (error) {
    console.error("UPDATE STUDENT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE STUDENT
 * Admin only
 */
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Delete user and student record
    await User.findByIdAndDelete(student.userId);
    await Student.findByIdAndDelete(id);

    res.json({ message: "Student deleted" });
  } catch (error) {
    console.error("DELETE STUDENT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
