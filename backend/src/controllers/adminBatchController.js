import mongoose from "mongoose";
import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import Branch from "../models/Branch.js";
import AttendanceSession from "../models/AttendanceSession.js";
import {
  isStudentInBatch,
  getStudentsForBatch,
  addStudentToBatch,
  removeStudentFromBatch as removeStudentFromBatchHelper,
} from "../utils/batchMembership.js";

// Helper: Consistent response format
const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    error,
  });
};

// Helper: Log with [BATCH] tag
const logBatch = (action, details = "") => {
  console.log(`[BATCH] ${action}${details ? " - " + details : ""}`);
};

// Helper: Normalize division
const normalizeDivision = (div) => (div ? String(div).trim().toUpperCase() : "");

// Helper: Get current academic year (fallback)
const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return month >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

// ============================================
// 1. getBatches - GET /api/admin/batches
// ============================================
export const getBatches = async (req, res) => {
  try {
    const { branchId, year, division, academicYear } = req.query;

    logBatch("getBatches", `branchId=${branchId || "all"} year=${year || "all"} div=${division || "all"}`);

    if (!branchId || !year) {
      return sendResponse(res, 400, false, "branchId and year are required", null, "MISSING_FILTERS");
    }

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return sendResponse(res, 400, false, "Invalid branchId", null, "INVALID_BRANCH_ID");
    }

    const query = {
      branch: branchId,
      year: parseInt(year),
      isDeleted: { $ne: true },
      isActive: true,
    };

    if (academicYear) {
      query.academicYear = academicYear;
    }

    const normalizedDivision = normalizeDivision(division);
    if (normalizedDivision) {
      query.$or = [
        { division: normalizedDivision },
        { divisions: normalizedDivision },
      ];
    }

    // Fetch batches
    const batches = await Batch.find(query)
      .populate("branch", "name code")
      .sort({ name: 1 })
      .lean();

    // Enrich with student count (use Batch.students + membership)
    const enrichedBatches = await Promise.all(
      batches.map(async (batch) => {
        let studentCount = 0;

        // Prefer direct students array
        if (Array.isArray(batch.students) && batch.students.length > 0) {
          studentCount = batch.students.length;
        } else {
          // Fallback using membership helper
          const students = await getStudentsForBatch(batch._id);
          studentCount = students.length;
        }

        return {
          ...batch,
          studentCount,
          divisions: batch.divisions && batch.divisions.length > 0 
            ? batch.divisions 
            : [batch.division],
        };
      })
    );

    // Count unassigned students for this class scope
    const unassignedFilter = {
      branch: branchId,
      year: parseInt(year),
      status: "active",
      isDeleted: { $ne: true },
    };

    if (normalizedDivision) {
      unassignedFilter.division = normalizedDivision;
    }
    if (academicYear) {
      unassignedFilter.academicYear = academicYear;
    }

    const allStudents = await Student.find(unassignedFilter).select("_id practicalBatches batch").lean();

    let unassignedCount = 0;
    for (const student of allStudents) {
      const hasBatch = 
        (student.batch && String(student.batch)) ||
        (Array.isArray(student.practicalBatches) && student.practicalBatches.length > 0);

      if (!hasBatch) {
        unassignedCount++;
      } else {
        // Double check using batch membership
        const batchIds = [...(student.practicalBatches || []), student.batch].filter(Boolean);
        let isAssigned = false;
        for (const bId of batchIds) {
          const inBatch = await isStudentInBatch(student._id, bId);
          if (inBatch) {
            isAssigned = true;
            break;
          }
        }
        if (!isAssigned) unassignedCount++;
      }
    }

    logBatch("getBatches", `Found ${enrichedBatches.length} batches, ${unassignedCount} unassigned`);

    return sendResponse(res, 200, true, "Batches fetched successfully", {
      batches: enrichedBatches,
      unassignedCount,
      totalBatches: enrichedBatches.length,
      filters: { branchId, year: parseInt(year), division: normalizedDivision, academicYear },
    });
  } catch (error) {
    console.error("[BATCH] getBatches ERROR:", error);
    return sendResponse(res, 500, false, "Failed to fetch batches", null, error.message);
  }
};

// ============================================
// 2. getBatch - GET /api/admin/batches/:id
// ============================================
export const getBatch = async (req, res) => {
  try {
    const { id } = req.params;

    logBatch("getBatch", `id=${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, "Invalid batch ID", null, "INVALID_ID");
    }

    const batch = await Batch.findOne({
      _id: id,
      isDeleted: { $ne: true },
    })
      .populate("branch", "name code")
      .lean();

    if (!batch) {
      return sendResponse(res, 404, false, "Batch not found", null, "BATCH_NOT_FOUND");
    }

    // Get full students using helper
    const students = await getStudentsForBatch(batch._id);

    const enrichedBatch = {
      ...batch,
      students, // full populated students
      studentCount: students.length,
      divisions: batch.divisions && batch.divisions.length > 0 ? batch.divisions : [batch.division],
    };

    logBatch("getBatch", `Fetched batch ${batch.name} with ${students.length} students`);

    return sendResponse(res, 200, true, "Batch fetched successfully", enrichedBatch);
  } catch (error) {
    console.error("[BATCH] getBatch ERROR:", error);
    return sendResponse(res, 500, false, "Failed to fetch batch", null, error.message);
  }
};

// ============================================
// 3. quickSetupBatches - POST /api/admin/batches/quick-setup
// ============================================
export const quickSetupBatches = async (req, res) => {
  try {
    const {
      branchId,
      year,
      division,
      splitMethod = "count", // "count" | "studentsPerBatch"
      batchCount = 2,
      studentsPerBatch = 30,
      namingPattern = "BA", // e.g. "BA", "Batch-"
      academicYear,
    } = req.body;

    logBatch("quickSetupBatches", `branch=${branchId} year=${year} div=${division} method=${splitMethod}`);

    if (!branchId || !year || !division) {
      return sendResponse(res, 400, false, "branchId, year and division are required", null, "MISSING_PARAMS");
    }

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return sendResponse(res, 400, false, "Invalid branchId", null, "INVALID_BRANCH");
    }

    const parsedYear = parseInt(year);
    const normalizedDivision = normalizeDivision(division);
    const currentAcademicYear = academicYear || getCurrentAcademicYear();

    // Fetch active students for this class
    const students = await Student.find({
      branch: branchId,
      year: parsedYear,
      division: normalizedDivision,
      status: "active",
      isDeleted: { $ne: true },
    })
      .sort({ rollNo: 1 })
      .lean();

    if (students.length === 0) {
      return sendResponse(res, 400, false, "No active students found for this class", null, "NO_STUDENTS");
    }

    logBatch("quickSetupBatches", `Found ${students.length} students to split`);

    // Calculate batch count
    let finalBatchCount = batchCount;
    if (splitMethod === "studentsPerBatch") {
      finalBatchCount = Math.ceil(students.length / parseInt(studentsPerBatch));
    }
    finalBatchCount = Math.max(1, Math.min(finalBatchCount, 10)); // safety

    // Split students
    const batchSize = Math.ceil(students.length / finalBatchCount);
    const createdBatches = [];

    for (let i = 0; i < finalBatchCount; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, students.length);
      const batchStudents = students.slice(start, end);

      if (batchStudents.length === 0) continue;

      const batchName = `${namingPattern}${normalizedDivision}${i + 1}`;

      // Check if batch already exists
      let existingBatch = await Batch.findOne({
        name: batchName,
        branch: branchId,
        year: parsedYear,
        isDeleted: { $ne: true },
      });

      if (existingBatch) {
        // Update existing
        existingBatch.students = batchStudents.map((s) => s._id);
        existingBatch.divisions = [normalizedDivision];
        existingBatch.division = normalizedDivision;
        existingBatch.academicYear = currentAcademicYear;
        existingBatch.updatedBy = req.user?._id;
        await existingBatch.save();
      } else {
        existingBatch = await Batch.create({
          name: batchName,
          displayName: batchName,
          branch: branchId,
          year: parsedYear,
          division: normalizedDivision,
          divisions: [normalizedDivision],
          students: batchStudents.map((s) => s._id),
          academicYear: currentAcademicYear,
          batchType: "regular",
          isMerged: false,
          autoCreated: true,
          createdBy: req.user?._id,
        });
      }

      // Sync practicalBatches on students (use helper)
      for (const stu of batchStudents) {
        await addStudentToBatch(stu._id, existingBatch._id);
      }

      createdBatches.push({
        _id: existingBatch._id,
        name: existingBatch.name,
        studentCount: batchStudents.length,
      });
    }

    logBatch("quickSetupBatches", `Created/updated ${createdBatches.length} batches`);

    return sendResponse(res, 201, true, `${createdBatches.length} batches created/updated via quick setup`, {
      batches: createdBatches,
      totalStudents: students.length,
      splitMethod,
      batchCount: finalBatchCount,
    });
  } catch (error) {
    console.error("[BATCH] quickSetupBatches ERROR:", error);
    return sendResponse(res, 500, false, "Quick batch setup failed", null, error.message);
  }
};

// ============================================
// 4. createBatch - POST /api/admin/batches
// ============================================
export const createBatch = async (req, res) => {
  try {
    const { name, branchId, year, divisions, studentIds = [], labRoom, description, academicYear } = req.body;

    logBatch("createBatch", `name=${name} branch=${branchId}`);

    if (!name || !branchId || !year) {
      return sendResponse(res, 400, false, "name, branchId and year are required", null, "MISSING_FIELDS");
    }

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return sendResponse(res, 400, false, "Invalid branchId", null, "INVALID_BRANCH");
    }

    const normalizedDivisions = Array.isArray(divisions) && divisions.length > 0
      ? divisions.map(normalizeDivision).filter(Boolean)
      : [normalizeDivision(req.body.division || "A")];

    const parsedYear = parseInt(year);
    const currentAcademicYear = academicYear || getCurrentAcademicYear();

    // Check for duplicate name in class scope
    const existing = await Batch.findOne({
      name: name.trim(),
      branch: branchId,
      year: parsedYear,
      isDeleted: { $ne: true },
    });

    if (existing) {
      return sendResponse(res, 409, false, "Batch with this name already exists for the class", null, "DUPLICATE_BATCH");
    }

    // Create batch
    const newBatch = await Batch.create({
      name: name.trim(),
      displayName: name.trim(),
      branch: branchId,
      year: parsedYear,
      division: normalizedDivisions[0],
      divisions: normalizedDivisions,
      students: [],
      labRoom: labRoom || "",
      description: description || "",
      academicYear: currentAcademicYear,
      batchType: normalizedDivisions.length > 1 ? "merged" : "regular",
      isMerged: normalizedDivisions.length > 1,
      createdBy: req.user?._id,
    });

    // Add students if provided (use helper)
    const addedStudents = [];
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      for (const sid of studentIds) {
        if (mongoose.Types.ObjectId.isValid(sid)) {
          const result = await addStudentToBatch(sid, newBatch._id);
          if (result.success) addedStudents.push(sid);
        }
      }
    }

    const populatedBatch = await Batch.findById(newBatch._id)
      .populate("branch", "name code")
      .lean();

    const studentsList = await getStudentsForBatch(newBatch._id);

    logBatch("createBatch", `Created batch ${newBatch.name} with ${addedStudents.length} students`);

    return sendResponse(res, 201, true, "Batch created successfully", {
      batch: {
        ...populatedBatch,
        students: studentsList,
        studentCount: studentsList.length,
      },
      addedStudentCount: addedStudents.length,
    });
  } catch (error) {
    console.error("[BATCH] createBatch ERROR:", error);
    if (error.code === 11000) {
      return sendResponse(res, 409, false, "Duplicate batch name in this class", null, "DUPLICATE");
    }
    return sendResponse(res, 500, false, "Failed to create batch", null, error.message);
  }
};

// ============================================
// 5. updateBatch - PUT /api/admin/batches/:id
// ============================================
export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, labRoom, description, maxCapacity } = req.body;

    logBatch("updateBatch", `id=${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, "Invalid batch ID", null, "INVALID_ID");
    }

    const batch = await Batch.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!batch) {
      return sendResponse(res, 404, false, "Batch not found", null, "BATCH_NOT_FOUND");
    }

    // Only allow safe fields
    if (name && name.trim()) {
      // Check duplicate on name change
      const dup = await Batch.findOne({
        name: name.trim(),
        branch: batch.branch,
        year: batch.year,
        _id: { $ne: id },
        isDeleted: { $ne: true },
      });
      if (dup) {
        return sendResponse(res, 409, false, "Batch name already exists in this class", null, "DUPLICATE_NAME");
      }
      batch.name = name.trim();
      batch.displayName = name.trim();
    }

    if (labRoom !== undefined) batch.labRoom = labRoom;
    if (description !== undefined) batch.description = description;
    if (maxCapacity !== undefined) batch.maxCapacity = maxCapacity;

    batch.updatedBy = req.user?._id;
    await batch.save();

    const updatedBatch = await Batch.findById(id)
      .populate("branch", "name code")
      .lean();

    const students = await getStudentsForBatch(id);

    logBatch("updateBatch", `Updated batch ${batch.name}`);

    return sendResponse(res, 200, true, "Batch updated successfully", {
      batch: {
        ...updatedBatch,
        students,
        studentCount: students.length,
      },
    });
  } catch (error) {
    console.error("[BATCH] updateBatch ERROR:", error);
    return sendResponse(res, 500, false, "Failed to update batch", null, error.message);
  }
};

// ============================================
// 6. addStudentsToBatch - POST /api/admin/batches/:id/students
// ============================================
export const addStudentsToBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    logBatch("addStudentsToBatch", `batch=${id} students=${studentIds?.length || 0}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, "Invalid batch ID", null, "INVALID_BATCH_ID");
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return sendResponse(res, 400, false, "studentIds array is required", null, "NO_STUDENTS");
    }

    const batch = await Batch.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!batch) {
      return sendResponse(res, 404, false, "Batch not found", null, "BATCH_NOT_FOUND");
    }

    const results = [];
    const added = [];
    const skipped = [];

    for (const studentId of studentIds) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        skipped.push({ studentId, reason: "Invalid ID" });
        continue;
      }

      const result = await addStudentToBatch(studentId, id);
      if (result.success) {
        added.push(studentId);
        results.push({ studentId, success: true });
      } else {
        skipped.push({ studentId, reason: result.message });
        results.push({ studentId, success: false, message: result.message });
      }
    }

    // Re-fetch updated batch
    const updatedBatch = await Batch.findById(id)
      .populate("branch", "name code")
      .lean();

    const students = await getStudentsForBatch(id);

    logBatch("addStudentsToBatch", `Added ${added.length}, skipped ${skipped.length}`);

    return sendResponse(res, 200, true, `${added.length} students added to batch`, {
      batch: { ...updatedBatch, students, studentCount: students.length },
      addedCount: added.length,
      skippedCount: skipped.length,
      results,
    });
  } catch (error) {
    console.error("[BATCH] addStudentsToBatch ERROR:", error);
    return sendResponse(res, 500, false, "Failed to add students", null, error.message);
  }
};

// ============================================
// 7. removeStudentFromBatch - DELETE /api/admin/batches/:id/students/:studentId
// ============================================
export const removeStudentFromBatch = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    logBatch("removeStudentFromBatch", `batch=${id} student=${studentId}`);

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return sendResponse(res, 400, false, "Invalid batch or student ID", null, "INVALID_IDS");
    }

    const batch = await Batch.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!batch) {
      return sendResponse(res, 404, false, "Batch not found", null, "BATCH_NOT_FOUND");
    }

    const result = await removeStudentFromBatchHelper(studentId, id);

    if (!result.success) {
      return sendResponse(res, 400, false, result.message, null, "REMOVE_FAILED");
    }

    const updatedBatch = await Batch.findById(id)
      .populate("branch", "name code")
      .lean();

    const students = await getStudentsForBatch(id);

    logBatch("removeStudentFromBatch", `Removed student from ${batch.name}`);

    return sendResponse(res, 200, true, "Student removed from batch successfully", {
      batch: { ...updatedBatch, students, studentCount: students.length },
    });
  } catch (error) {
    console.error("[BATCH] removeStudentFromBatch ERROR:", error);
    return sendResponse(res, 500, false, "Failed to remove student", null, error.message);
  }
};

// ============================================
// 8. bulkMoveStudents - POST /api/admin/batches/bulk-move
// ============================================
export const bulkMoveStudents = async (req, res) => {
  try {
    const { fromBatchId, toBatchId, studentIds } = req.body;

    logBatch("bulkMoveStudents", `from=${fromBatchId} to=${toBatchId} count=${studentIds?.length || 0}`);

    if (!fromBatchId || !toBatchId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return sendResponse(res, 400, false, "fromBatchId, toBatchId and studentIds are required", null, "MISSING_PARAMS");
    }

    if (!mongoose.Types.ObjectId.isValid(fromBatchId) || !mongoose.Types.ObjectId.isValid(toBatchId)) {
      return sendResponse(res, 400, false, "Invalid batch IDs", null, "INVALID_BATCH_IDS");
    }

    if (fromBatchId === toBatchId) {
      return sendResponse(res, 400, false, "Cannot move students to the same batch", null, "SAME_BATCH");
    }

    const [fromBatch, toBatch] = await Promise.all([
      Batch.findOne({ _id: fromBatchId, isDeleted: { $ne: true } }),
      Batch.findOne({ _id: toBatchId, isDeleted: { $ne: true } }),
    ]);

    if (!fromBatch || !toBatch) {
      return sendResponse(res, 404, false, "One or both batches not found", null, "BATCH_NOT_FOUND");
    }

    const moved = [];
    const failed = [];

    for (const studentId of studentIds) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        failed.push({ studentId, reason: "Invalid ID" });
        continue;
      }

      // Remove from source
      const removeRes = await removeStudentFromBatch(studentId, fromBatchId);
      if (!removeRes.success) {
        failed.push({ studentId, reason: removeRes.message });
        continue;
      }

      // Add to target
      const addRes = await addStudentToBatch(studentId, toBatchId);
      if (addRes.success) {
        moved.push(studentId);
      } else {
        // Rollback attempt
        await addStudentToBatch(studentId, fromBatchId);
        failed.push({ studentId, reason: addRes.message });
      }
    }

    // Refresh both batches
    const [updatedFrom, updatedTo] = await Promise.all([
      Batch.findById(fromBatchId).populate("branch", "name code").lean(),
      Batch.findById(toBatchId).populate("branch", "name code").lean(),
    ]);

    const fromStudents = await getStudentsForBatch(fromBatchId);
    const toStudents = await getStudentsForBatch(toBatchId);

    logBatch("bulkMoveStudents", `Moved ${moved.length}, failed ${failed.length}`);

    return sendResponse(res, 200, true, `${moved.length} students moved successfully`, {
      fromBatch: { ...updatedFrom, students: fromStudents, studentCount: fromStudents.length },
      toBatch: { ...updatedTo, students: toStudents, studentCount: toStudents.length },
      movedCount: moved.length,
      failedCount: failed.length,
      moved,
      failed,
    });
  } catch (error) {
    console.error("[BATCH] bulkMoveStudents ERROR:", error);
    return sendResponse(res, 500, false, "Bulk move failed", null, error.message);
  }
};

// ============================================
// 9. createMergedBatch - POST /api/admin/batches/merge
// ============================================
export const createMergedBatch = async (req, res) => {
  try {
    const { name, sourceBatchIds = [], studentIds = [], labRoom, description } = req.body;

    logBatch("createMergedBatch", `name=${name} sources=${sourceBatchIds.length}`);

    if (!name || !Array.isArray(sourceBatchIds) || sourceBatchIds.length < 2) {
      return sendResponse(res, 400, false, "name and at least 2 sourceBatchIds required for merge", null, "INVALID_MERGE");
    }

    const validSourceIds = sourceBatchIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validSourceIds.length < 2) {
      return sendResponse(res, 400, false, "Need at least two valid source batch IDs", null, "INVALID_SOURCE_IDS");
    }

    // Fetch source batches
    const sourceBatches = await Batch.find({
      _id: { $in: validSourceIds },
      isDeleted: { $ne: true },
    });

    if (sourceBatches.length < 2) {
      return sendResponse(res, 404, false, "One or more source batches not found", null, "SOURCE_BATCHES_MISSING");
    }

    // Validate same branch and year
    const firstBatch = sourceBatches[0];
    const sameBranchYear = sourceBatches.every(
      (b) =>
        String(b.branch) === String(firstBatch.branch) &&
        Number(b.year) === Number(firstBatch.year)
    );

    if (!sameBranchYear) {
      return sendResponse(res, 400, false, "All source batches must belong to same branch and year for merge", null, "MERGE_VALIDATION_FAILED");
    }

    // Collect all student IDs (from sources + provided)
    let allStudentIds = new Set(studentIds.filter((id) => mongoose.Types.ObjectId.isValid(id)));

    for (const batch of sourceBatches) {
      const batchStudents = await getStudentsForBatch(batch._id);
      batchStudents.forEach((s) => allStudentIds.add(String(s._id)));
    }

    const mergedStudentIds = Array.from(allStudentIds);

    // Create merged batch
    const mergedBatch = await Batch.create({
      name: name.trim(),
      displayName: name.trim(),
      branch: firstBatch.branch,
      year: firstBatch.year,
      division: firstBatch.division,
      divisions: [...new Set(sourceBatches.flatMap((b) => b.divisions || [b.division]))],
      students: mergedStudentIds,
      labRoom: labRoom || "",
      description: description || `Merged from: ${sourceBatches.map((b) => b.name).join(", ")}`,
      academicYear: firstBatch.academicYear || getCurrentAcademicYear(),
      batchType: "merged",
      isMerged: true,
      createdBy: req.user?._id,
    });

    // Sync students using helper
    for (const sid of mergedStudentIds) {
      await addStudentToBatch(sid, mergedBatch._id);
    }

    const populated = await Batch.findById(mergedBatch._id)
      .populate("branch", "name code")
      .lean();

    const students = await getStudentsForBatch(mergedBatch._id);

    logBatch("createMergedBatch", `Merged batch ${mergedBatch.name} created with ${students.length} students`);

    return sendResponse(res, 201, true, "Merged batch created successfully", {
      batch: { ...populated, students, studentCount: students.length },
      sourceBatches: sourceBatches.map((b) => ({ _id: b._id, name: b.name })),
    });
  } catch (error) {
    console.error("[BATCH] createMergedBatch ERROR:", error);
    return sendResponse(res, 500, false, "Failed to create merged batch", null, error.message);
  }
};

// ============================================
// 10. deleteBatch - DELETE /api/admin/batches/:id
// ============================================
export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    logBatch("deleteBatch", `id=${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, "Invalid batch ID", null, "INVALID_ID");
    }

    const batch = await Batch.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!batch) {
      return sendResponse(res, 404, false, "Batch not found or already deleted", null, "BATCH_NOT_FOUND");
    }

    // Check for active sessions
    const activeSessions = await AttendanceSession.countDocuments({
      batch: id,
      isCancelled: false,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // last 30 days
    });

    if (activeSessions > 0) {
      // Soft delete with warning
      batch.isDeleted = true;
      batch.deletedAt = new Date();
      batch.deletedBy = req.user?._id;
      batch.isActive = false;
      await batch.save();

      logBatch("deleteBatch", `Soft deleted ${batch.name} (has ${activeSessions} recent sessions)`);

      return sendResponse(res, 200, true, "Batch soft-deleted (warning: active/recent attendance sessions exist)", {
        batchId: batch._id,
        name: batch.name,
        warning: `${activeSessions} recent attendance sessions found`,
        softDeleted: true,
      });
    }

    // No active sessions -> full soft delete
    batch.isDeleted = true;
    batch.deletedAt = new Date();
    batch.deletedBy = req.user?._id;
    batch.isActive = false;
    await batch.save();

    // Optionally remove from students' practicalBatches
    await Student.updateMany(
      { practicalBatches: id },
      { $pull: { practicalBatches: id } }
    );

    logBatch("deleteBatch", `Soft deleted batch ${batch.name}`);

    return sendResponse(res, 200, true, "Batch deleted successfully", {
      batchId: batch._id,
      name: batch.name,
    });
  } catch (error) {
    console.error("[BATCH] deleteBatch ERROR:", error);
    return sendResponse(res, 500, false, "Failed to delete batch", null, error.message);
  }
};

// ============================================
// 11. getUnassignedStudents - GET /api/admin/batches/unassigned
// ============================================
export const getUnassignedStudents = async (req, res) => {
  try {
    const { branchId, year, division, academicYear } = req.query;

    logBatch("getUnassignedStudents", `branch=${branchId} year=${year}`);

    if (!branchId || !year) {
      return sendResponse(res, 400, false, "branchId and year are required", null, "MISSING_FILTERS");
    }

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return sendResponse(res, 400, false, "Invalid branchId", null, "INVALID_ID");
    }

    const parsedYear = parseInt(year);
    const normalizedDivision = normalizeDivision(division);

    const filter = {
      branch: branchId,
      year: parsedYear,
      status: "active",
      isDeleted: { $ne: true },
    };

    if (normalizedDivision) filter.division = normalizedDivision;
    if (academicYear) filter.academicYear = academicYear;

    const students = await Student.find(filter)
      .populate("userId", "name email")
      .populate("branch", "name code")
      .sort({ rollNo: 1 })
      .lean();

    const unassigned = [];

    for (const student of students) {
      const practicalBatches = Array.isArray(student.practicalBatches) ? student.practicalBatches : [];
      let assigned = false;

      if (student.batch || practicalBatches.length > 0) {
        // Verify using helper
        const allRefs = [...practicalBatches, student.batch].filter(Boolean);
        for (const ref of allRefs) {
          const isIn = await isStudentInBatch(student._id, ref);
          if (isIn) {
            assigned = true;
            break;
          }
        }
      }

      if (!assigned) {
        unassigned.push({
          _id: student._id,
          rollNo: student.rollNo,
          name: student.userId?.name || "Unknown",
          email: student.userId?.email || "",
          division: student.division,
          branch: student.branch,
          academicYear: student.academicYear,
        });
      }
    }

    logBatch("getUnassignedStudents", `Found ${unassigned.length} unassigned`);

    return sendResponse(res, 200, true, "Unassigned students fetched", {
      students: unassigned,
      count: unassigned.length,
      filters: { branchId, year: parsedYear, division: normalizedDivision },
    });
  } catch (error) {
    console.error("[BATCH] getUnassignedStudents ERROR:", error);
    return sendResponse(res, 500, false, "Failed to fetch unassigned students", null, error.message);
  }
};

// ============================================
// 12. getBatchStats - GET /api/admin/batches/stats
// ============================================
export const getBatchStats = async (req, res) => {
  try {
    const { branchId, year, division, academicYear } = req.query;

    logBatch("getBatchStats", `branch=${branchId} year=${year}`);

    if (!branchId || !year) {
      return sendResponse(res, 400, false, "branchId and year are required", null, "MISSING_FILTERS");
    }

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return sendResponse(res, 400, false, "Invalid branchId", null, "INVALID_ID");
    }

    const parsedYear = parseInt(year);
    const normalizedDivision = normalizeDivision(division);

    const batchQuery = {
      branch: branchId,
      year: parsedYear,
      isDeleted: { $ne: true },
      isActive: true,
    };
    if (academicYear) batchQuery.academicYear = academicYear;
    if (normalizedDivision) {
      batchQuery.$or = [{ division: normalizedDivision }, { divisions: normalizedDivision }];
    }

    const batches = await Batch.find(batchQuery).lean();

    let totalStudentsInBatches = 0;
    const batchStats = [];

    for (const batch of batches) {
      const students = await getStudentsForBatch(batch._id);
      const count = students.length;
      totalStudentsInBatches += count;

      batchStats.push({
        _id: batch._id,
        name: batch.name,
        studentCount: count,
        labRoom: batch.labRoom || null,
        isMerged: batch.isMerged || false,
        batchType: batch.batchType,
        divisions: batch.divisions || [batch.division],
      });
    }

    // Unassigned
    const unassignedRes = await getUnassignedStudentsInternal(branchId, parsedYear, normalizedDivision, academicYear);
    const unassignedCount = unassignedRes.count || 0;

    const totalClassStudents = totalStudentsInBatches + unassignedCount;

    const stats = {
      totalBatches: batches.length,
      totalStudentsInBatches,
      unassignedCount,
      totalClassStudents,
      averageStudentsPerBatch: batches.length > 0 ? Math.round(totalStudentsInBatches / batches.length) : 0,
      batches: batchStats,
    };

    logBatch("getBatchStats", `Stats: ${batches.length} batches, ${totalStudentsInBatches} assigned`);

    return sendResponse(res, 200, true, "Batch statistics fetched successfully", stats);
  } catch (error) {
    console.error("[BATCH] getBatchStats ERROR:", error);
    return sendResponse(res, 500, false, "Failed to fetch batch stats", null, error.message);
  }
};

// Internal helper for unassigned count (used by stats)
const getUnassignedStudentsInternal = async (branchId, year, division, academicYear) => {
  const filter = {
    branch: branchId,
    year,
    status: "active",
    isDeleted: { $ne: true },
  };
  if (division) filter.division = division;
  if (academicYear) filter.academicYear = academicYear;

  const students = await Student.find(filter).select("_id batch practicalBatches").lean();

  let unassigned = 0;

  for (const s of students) {
    const hasAny = (s.batch || (Array.isArray(s.practicalBatches) && s.practicalBatches.length > 0));
    if (!hasAny) {
      unassigned++;
      continue;
    }
    // Verify
    const refs = [...(s.practicalBatches || []), s.batch].filter(Boolean);
    let assigned = false;
    for (const ref of refs) {
      if (await isStudentInBatch(s._id, ref)) {
        assigned = true;
        break;
      }
    }
    if (!assigned) unassigned++;
  }

  return { count: unassigned };
};

export default {
  getBatches,
  getBatch,
  quickSetupBatches,
  createBatch,
  updateBatch,
  addStudentsToBatch,
  removeStudentFromBatch,
  bulkMoveStudents,
  createMergedBatch,
  deleteBatch,
  getUnassignedStudents,
  getBatchStats,
};
