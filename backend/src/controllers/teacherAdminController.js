import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Teacher from "../models/Teacher.js";
import TeachingAssignment from "../models/TeachingAssignment.js";

// GET ALL TEACHERS (Admin)
export const getTeachers = async (req, res) => {
  try {
    const { search } = req.query;

    const teachers = await Teacher.find()
      .populate("userId", "name email")
      .populate("department", "name code");

    // Text search across teacher name, email, or designation
    if (search) {
      const regex = new RegExp(search, "i");
      const filtered = teachers.filter((t) => {
        const name = t.userId?.name || "";
        const email = t.userId?.email || "";
        const designation = t.designation || "";
        return regex.test(name) || regex.test(email) || regex.test(designation);
      });
      return res.json(filtered);
    }

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

// GET ALL TEACHING ASSIGNMENTS (Admin)
export const getTeachingAssignments = async (_req, res) => {
  try {
    const assignments = await TeachingAssignment.find()
      .populate("teacherId", "name email")
      .populate("subjectId", "name code")
      .populate("branchId", "name code")
      .populate("batchId", "name code")
      .sort({ createdAt: -1 });

    res.json({ data: assignments });
  } catch (error) {
    console.error("GET TEACHING ASSIGNMENTS ERROR:", error);
    res.status(500).json({ message: "Error fetching teaching assignments" });
  }
};

// UPDATE TEACHING ASSIGNMENT (Admin)
export const updateTeachingAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher, subject, branch, year, division } = req.body;

    const assignment = await TeachingAssignment.findByIdAndUpdate(
      id,
      { teacher, subject, branch, year, division },
      { new: true, runValidators: true }
    )
      .populate({
        path: "teacher",
        populate: { path: "userId", select: "name email" },
      })
      .populate("subject", "name code")
      .populate("branch", "name code");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({
      message: "Assignment updated successfully",
      assignment,
    });
  } catch (error) {
    console.error("UPDATE TEACHING ASSIGNMENT ERROR:", error);
    res.status(400).json({ message: error.message });
  }
};

// DELETE TEACHING ASSIGNMENT (Admin)
export const deleteTeachingAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await TeachingAssignment.findByIdAndDelete(id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("DELETE TEACHING ASSIGNMENT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE TEACHER
 * Admin only
 */
export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, designation } = req.body;

    const teacher = await Teacher.findById(id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const user = await User.findById(teacher.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Ensure email is unique if changed
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }

    if (name) user.name = name;
    await user.save();

    // Update teacher fields
    if (department) teacher.department = department;
    if (designation) teacher.designation = designation;
    await teacher.save();

    const updated = await Teacher.findById(id)
      .populate("userId", "name email")
      .populate("department", "name code");

    res.json({ message: "Teacher updated", teacher: updated });
  } catch (error) {
    console.error("UPDATE TEACHER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE TEACHER
 * Admin only
 */
export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findById(id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Delete user and teacher record
    await User.findByIdAndDelete(teacher.userId);
    await Teacher.findByIdAndDelete(id);

    // Also delete any teaching assignments
    await TeachingAssignment.deleteMany({ teacher: id });

    res.json({ message: "Teacher deleted" });
  } catch (error) {
    console.error("DELETE TEACHER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
