import Branch from "../models/Branch.js";
import Subject from "../models/Subject.js";
import { generateStudentTemplate, generateTeacherTemplate } from "../utils/templateGenerator.js";

/* CREATE BRANCH */
export const createBranch = async (req, res) => {

  console.log("USER:", req.user);
  console.log("BODY:", req.body);

  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Name and code are required" });
    }

    const existing = await Branch.findOne({
      $or: [{ name }, { code }]
    });

    if (existing) {
      return res.status(400).json({ message: "Branch already exists" });
    }

    const branch = await Branch.create({ name, code });

    res.status(201).json(branch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



/* GET ALL BRANCHES */
export const getBranches = async (req, res) => {
  const branches = await Branch.find();
  res.json(branches);
};

/* CREATE SUBJECT */
export const createSubject = async (req, res) => {
  try {
    const { name, code, branch, semester } = req.body;

    if (!name || !code || !branch || !semester) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const subject = await Subject.create({
      name,
      code,
      branch,
      semester,
    });

    res.status(201).json(subject);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* GET SUBJECTS (FILTERABLE) */
export const getSubjects = async (req, res) => {
  const { branch, semester } = req.query;

  const filter = { isDeleted: false };
  if (branch) filter.branch = branch;
  if (semester) filter.semester = semester;

  const subjects = await Subject.find(filter).populate("branch");
  res.json(subjects);
};

/* GET BRANCH DELETE COUNTS */
export const getBranchDeleteCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if branch exists
    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });

    // Import models
    const mongoose = require('mongoose');
    const Batch = mongoose.model("Batch");
    const Student = mongoose.model("Student");
    const TeachingAssignment = mongoose.model("TeachingAssignment");
    const AttendanceSession = mongoose.model("AttendanceSession");

    const counts = {
      subjects: await Subject.countDocuments({ branch: id, isDeleted: false }),
      batches: await Batch.countDocuments({ branch: id, isDeleted: false }),
      students: await Student.countDocuments({ branch: id, isDeleted: false }),
      assignments: await TeachingAssignment.countDocuments({ branch: id }),
      sessions: await AttendanceSession.countDocuments({ branch: id, isDeleted: false })
    };

    res.json({ success: true, data: counts });
  } catch (error) {
    res.status(500).json({ message: "Server error calculating counts" });
  }
};

/* SOFT DELETE BRANCH */
export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id || req.user.id; // From protect middleware

    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });

    // Mark branch as deleted
    branch.isDeleted = true;
    branch.deletedAt = new Date();
    branch.deletedBy = adminId;
    await branch.save();

    // Soft delete cascading
    const mongoose = require('mongoose');
    const Batch = mongoose.model("Batch");
    const Student = mongoose.model("Student");
    const AttendanceSession = mongoose.model("AttendanceSession");
    
    // We could updateMany but let's just mark the main branch as deleted. 
    // The query filters should handle `isDeleted` mostly, but let's be thorough:
    await Subject.updateMany({ branch: id }, { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: adminId } });
    await Batch.updateMany({ branch: id }, { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: adminId } });
    await Student.updateMany({ branch: id }, { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: adminId } });
    await AttendanceSession.updateMany({ branch: id }, { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: adminId } });

    console.log(`[CASCADE] Soft deleted branch ${branch.code} and its related records by Admin ${adminId}`);

    res.json({ success: true, message: "Branch and associated data soft deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error during deletion" });
  }
};

export const downloadStudentTemplate = async (req, res) => {
  try {
    const branches = await Branch.find({ isDeleted: false });
    const workbook = await generateStudentTemplate(branches);
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=student_upload_template_${timestamp}.xlsx`
    );
    
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (error) {
    console.error("Template generation error:", error);
    res.status(500).json({ success: false, message: 'Template download failed' });
  }
};

export const downloadTeacherTemplate = async (req, res) => {
  try {
    const branches = await Branch.find({ isDeleted: false });
    const workbook = await generateTeacherTemplate(branches);
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=teacher_upload_template_${timestamp}.xlsx`
    );
    
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (error) {
    console.error("Template generation error:", error);
    res.status(500).json({ success: false, message: 'Template download failed' });
  }
};
