import Teacher from "../models/Teacher.js";
import TeachingAssignment from "../models/TeachingAssignment.js";

/**
 * GET TEACHER PROFILE
 * For logged-in teacher
 */
export const getTeacherProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware (JWT contains 'id')

    const teacher = await Teacher.findOne({ userId })
      .populate("userId", "name email")
      .populate("department", "name code");

    if (!teacher) {
      return res.status(404).json({ 
        success: false,
        message: "Teacher profile not found" 
      });
    }

    res.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error("GET TEACHER PROFILE ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

/**
 * GET TEACHER ASSIGNMENTS
 * Fetch all teaching assignments for a teacher
 */
export const getTeacherAssignments = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const assignments = await TeachingAssignment.find({ teacher: teacherId })
      .populate("subject", "name code")
      .populate("branch", "name code")
      .sort({ year: 1, division: 1 });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error("GET TEACHER ASSIGNMENTS ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};
