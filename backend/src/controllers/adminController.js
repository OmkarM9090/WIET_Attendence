import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import Subject from "../models/Subject.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import AttendanceSession from "../models/AttendanceSession.js";
import Defaulter from "../models/Defaulter.js";
import Batch from "../models/Batch.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import { generateStudentTemplate, generateTeacherTemplate } from "../utils/templateGenerator.js";

const YEAR_LABELS = {
  1: { code: "FE", name: "First Year" },
  2: { code: "SE", name: "Second Year" },
  3: { code: "TE", name: "Third Year" },
  4: { code: "BE", name: "Fourth Year" },
};

const buildBulkDeleteFilter = ({ deleteType, year, division, branchId }) => {
  const filter = { isDeleted: { $ne: true } };

  if (deleteType === "year") {
    const parsedYear = Number(year);
    if (![1, 2, 3, 4].includes(parsedYear)) {
      throw new Error("Invalid year. Must be 1, 2, 3, or 4.");
    }
    filter.year = parsedYear;
  } else if (deleteType === "year-division") {
    const parsedYear = Number(year);
    const normalizedDivision = String(division || "").trim().toUpperCase();

    if (![1, 2, 3, 4].includes(parsedYear)) {
      throw new Error("Invalid year. Must be 1, 2, 3, or 4.");
    }

    if (!["A", "B", "C"].includes(normalizedDivision)) {
      throw new Error("Invalid division. Must be A, B, or C.");
    }

    filter.year = parsedYear;
    filter.division = normalizedDivision;

    if (branchId && branchId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(branchId)) {
        throw new Error("Invalid branchId.");
      }
      filter.branch = new mongoose.Types.ObjectId(branchId);
    }
  } else if (deleteType !== "all") {
    throw new Error("Invalid delete type.");
  }

  return filter;
};

const buildScopeLabel = ({ deleteType, year, division, branchCode }) => {
  if (deleteType === "all") return "ALL students";

  const yearLabel = YEAR_LABELS[Number(year)];
  if (deleteType === "year") {
    return `${yearLabel.name} (${yearLabel.code}) - all divisions`;
  }

  const branchLabel = branchCode ? ` ${branchCode}` : " all branches";
  return `${yearLabel.code}-${String(division).toUpperCase()}${branchLabel}`;
};

const getDeletePreview = async (filter, scopeFilter = filter) => {
  const students = await Student.find(filter)
    .select("_id userId rollNo branch year division")
    .populate("userId", "name email")
    .populate("branch", "name code")
    .sort({ year: 1, division: 1, rollNo: 1 })
    .lean();

  const studentIds = students.map((student) => student._id);
  const userIds = students.map((student) => student.userId?._id).filter(Boolean);

  const [attendanceSessionsCount, defaulterRecordsCount, defaulterEntryCounts] =
    await Promise.all([
      AttendanceSession.countDocuments(scopeFilter),
      Defaulter.countDocuments({ "list.studentId": { $in: studentIds } }),
      Defaulter.aggregate([
        { $unwind: "$list" },
        { $match: { "list.studentId": { $in: studentIds } } },
        { $count: "total" },
      ]),
    ]);

  return {
    count: students.length,
    usersCount: userIds.length,
    attendanceSessionsCount,
    defaulterRecordsCount,
    defaulterEntriesCount: defaulterEntryCounts[0]?.total || 0,
    sampleStudents: students.slice(0, 5).map((student) => ({
      id: student._id,
      name: student.userId?.name || "Unknown student",
      email: student.userId?.email || "",
      rollNo: student.rollNo,
      year: student.year,
      division: student.division,
      branch: student.branch
        ? {
            id: student.branch._id,
            name: student.branch.name,
            code: student.branch.code,
          }
        : null,
    })),
    remainingAfterSample: Math.max(students.length - 5, 0),
  };
};
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
    const { name, code, branch, semester, semesterStartDate, semesterEndDate } = req.body;

    if (!name || !code || !branch || !semester || !semesterStartDate || !semesterEndDate) {
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
      semesterStartDate,
      semesterEndDate
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

/* GET STUDENT COUNTS FOR BULK DELETE */
export const getStudentCounts = async (req, res) => {
  try {
    const baseMatch = { isDeleted: { $ne: true } };

    const [total, byYearRows, byYearDivisionRows] = await Promise.all([
      Student.countDocuments(baseMatch),
      Student.aggregate([
        { $match: baseMatch },
        { $group: { _id: "$year", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Student.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { year: "$year", division: "$division" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.division": 1 } },
      ]),
    ]);

    const byYear = { 1: 0, 2: 0, 3: 0, 4: 0 };
    byYearRows.forEach((row) => {
      byYear[row._id] = row.count;
    });

    const byYearDivision = {};
    byYearDivisionRows.forEach((row) => {
      byYearDivision[`${row._id.year}-${row._id.division}`] = row.count;
    });

    res.json({
      success: true,
      counts: {
        total,
        byYear,
        byYearDivision,
      },
    });
  } catch (error) {
    console.error("GET STUDENT COUNTS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to load student counts" });
  }
};

/* PREVIEW BULK DELETE */
export const previewBulkDelete = async (req, res) => {
  try {
    const { deleteType, year, division, branchId } = req.query;
    const filter = buildBulkDeleteFilter({ deleteType, year, division, branchId });
    const branch = branchId && branchId !== "all" ? await Branch.findById(branchId).lean() : null;

    if (branchId && branchId !== "all" && !branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    const preview = await getDeletePreview(filter);

    res.json({
      success: true,
      preview: {
        ...preview,
        deleteType,
        label: buildScopeLabel({ deleteType, year, division, branchCode: branch?.code }),
        cascadeWarning:
          "This will permanently delete matching students, their user login accounts, attendance sessions for the selected cohort, and matching defaulter entries. This cannot be undone.",
      },
    });
  } catch (error) {
    console.error("PREVIEW BULK DELETE ERROR:", error);
    res.status(400).json({ success: false, message: error.message || "Preview failed" });
  }
};

/* BULK DELETE STUDENTS */
export const bulkDeleteStudents = async (req, res) => {
  const startTime = Date.now();
  const session = await mongoose.startSession();

  try {
    const { deleteType, year, division, branchId, confirmation } = req.body;

    if (confirmation !== "DELETE") {
      return res.status(400).json({
        success: false,
        message: 'Invalid confirmation. Please type "DELETE" exactly.',
      });
    }

    const filter = buildBulkDeleteFilter({ deleteType, year, division, branchId });
    const branch = branchId && branchId !== "all" ? await Branch.findById(branchId).lean() : null;

    if (branchId && branchId !== "all" && !branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    const preview = await getDeletePreview(filter);
    if (preview.count === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found matching the criteria",
      });
    }

    let summary;

    await session.withTransaction(async () => {
      const studentsToDelete = await Student.find(filter)
        .select("_id userId")
        .session(session)
        .lean();

      const studentIds = studentsToDelete.map((student) => student._id);
      const userIds = studentsToDelete.map((student) => student.userId).filter(Boolean);

      const affectedDefaulterIds = await Defaulter.find({ "list.studentId": { $in: studentIds } })
        .select("_id")
        .session(session)
        .lean();

      const attendanceResult = await AttendanceSession.deleteMany(filter).session(session);

      const batchResult = await Batch.updateMany(
        { students: { $in: studentIds } },
        { $pull: { students: { $in: studentIds } } },
        { session }
      );

      const defaulterPullResult = await Defaulter.updateMany(
        { _id: { $in: affectedDefaulterIds.map((record) => record._id) } },
        { $pull: { list: { studentId: { $in: studentIds } } } },
        { session }
      );

      const emptyDefaulterResult = await Defaulter.deleteMany({
        _id: { $in: affectedDefaulterIds.map((record) => record._id) },
        list: { $size: 0 },
      }).session(session);

      const userResult = await User.deleteMany({ _id: { $in: userIds }, role: "student" }).session(session);
      const studentResult = await Student.deleteMany({ _id: { $in: studentIds } }).session(session);

      summary = {
        studentsDeleted: studentResult.deletedCount,
        usersDeleted: userResult.deletedCount,
        attendanceSessionsDeleted: attendanceResult.deletedCount,
        batchesAffected: batchResult.modifiedCount,
        defaulterRecordsAffected: defaulterPullResult.modifiedCount,
        defaulterRecordsDeleted: emptyDefaulterResult.deletedCount,
        defaulterEntriesDeleted: preview.defaulterEntriesCount,
        timeTakenMs: Date.now() - startTime,
      };
    });

    const auditUser = req.user?.email || req.user?.id || req.user?._id || "unknown-admin";
    console.log(
      `[BULK DELETE] Admin ${auditUser} deleted ${summary.studentsDeleted} students at ${new Date().toISOString()}`
    );
    console.log(
      `[BULK DELETE] Scope: ${buildScopeLabel({ deleteType, year, division, branchCode: branch?.code })}`
    );
    console.log(`[BULK DELETE] Summary: ${JSON.stringify(summary)}`);

    res.json({
      success: true,
      message: "Bulk deletion completed successfully",
      summary,
    });
  } catch (error) {
    console.error("[BULK DELETE ERROR]", error);
    res.status(500).json({
      success: false,
      message: "Bulk deletion failed",
      error: error.message,
    });
  } finally {
    await session.endSession();
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
