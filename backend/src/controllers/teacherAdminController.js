import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Teacher from "../models/Teacher.js";
import TeachingAssignment from "../models/TeachingAssignment.js";

// GET ALL TEACHERS (Admin)
export const getTeachers = async (_req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("userId", "name email")
      .populate("department", "name code");

    res.json(teachers);
  } catch (error) {
    console.error("GET TEACHERS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * CREATE TEACHER
 * Admin only
 */
export const createTeacher = async (req, res) => {
  try {

    //validation
    const { name, email, password, department, designation } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "teacher",
    });

    const teacher = await Teacher.create({
      userId: user._id,
      department,
      designation,
    });

    res.status(201).json({
      message: "Teacher created successfully",
      teacher,
    });
  } catch (error) {
    console.error("CREATE TEACHER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Assign Teacher to Subject + Class
export const assignTeacher = async (req, res) => {
  try {
    const { teacher, subject, branch, year, division } = req.body;

    if (!teacher || !subject || !branch || !year || !division) {
      return res.status(400).json({ message: "All fields required" });
    }

    const assignment = await TeachingAssignment.create({
      teacher,
      subject,
      branch,
      year,
      division,
    });

    res.status(201).json({
      message: "Teacher assigned successfully",
      assignment,
    });
  } catch (error) {
    console.error("ASSIGN TEACHER ERROR:", error);
    res.status(400).json({ message: error.message });
  }
};
