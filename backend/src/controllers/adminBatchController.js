// controllers/adminBatchController.js
// Admin Controller for Batch Management (CRUD, Auto Setup, Merging, Membership, Stats)

import mongoose from "mongoose";
import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import AttendanceSession from "../models/AttendanceSession.js";
import {
  getStudentsForBatch,
  assignStudentsToBatch,
  removeStudentFromBatch as removeStudentHelper,
  moveStudentsBetweenBatches as moveStudentsHelper,
  getUnassignedStudentsForClass,
} from "../utils/batchMembership.js";

/**
 * 1. GET ALL BATCHES FOR A CLASS
 * GET /api/admin/batches?branchId=X&year=Y&division=Z&academicYear=W
 */
export const getBatches = async (req, res) => {
  try {
    const { branchId, year, division, academicYear } = req.query;

    console.log(`[BATCH] Fetching batches with query:`, { branchId, year, division, academicYear });

    const query = { isDeleted: false };
    if (branchId) query.branch = branchId;
    if (year) query.year = Number(year);
    if (division) query.$or = [{ division }, { divisions: division }];

    let batches = [];
    if (academicYear) {
      batches = await Batch.find({ ...query, academicYear })
        .populate("branch", "name code")
        .populate({
          path: "students",
          select: "rollNo userId branch year division status batchName",
          populate: { path: "userId", select: "name email" },
        })
        .sort({ name: 1 })
        .lean();
    }

    if (batches.length === 0) {
      batches = await Batch.find(query)
        .populate("branch", "name code")
        .populate({
          path: "students",
          select: "rollNo userId branch year division status batchName",
          populate: { path: "userId", select: "name email" },
        })
        .sort({ name: 1 })
        .lean();
    }

    // Format response
    const formattedBatches = batches.map((b) => ({
      _id: b._id,
      id: b._id,
      name: b.name,
      displayName: b.displayName || `Batch ${b.name}`,
      branch: b.branch,
      year: b.year,
      division: b.division || (b.divisions ? b.divisions.join(",") : ""),
      divisions: b.divisions || [b.division],
      academicYear: b.academicYear,
      studentCount: b.students ? b.students.length : 0,
      students: b.students || [],
      batchType: b.batchType || "regular",
      isMerged: b.isMerged || false,
      sourceBatchIds: b.sourceBatchIds || [],
      rollRanges: b.rollRanges || [],
      labRoom: b.labRoom || "",
      description: b.description || "",
      maxCapacity: b.maxCapacity || null,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    // Calculate unassigned students
    const unassignedStudents = await getUnassignedStudentsForClass({
      branchId,
      year,
      division,
      academicYear,
    });

    return res.status(200).json({
      success: true,
      count: formattedBatches.length,
      batches: formattedBatches,
      unassignedStudents: unassignedStudents.length,
    });
  } catch (error) {
    console.error("[BATCH] Error in getBatches:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch batches",
      error: error.message,
    });
  }
};

/**
 * 2. GET SINGLE BATCH DETAILS
 * GET /api/admin/batches/:id
 */
export const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Batch ID" });
    }

    const batch = await Batch.findOne({ _id: id, isDeleted: false })
      .populate("branch", "name code")
      .populate({
        path: "students",
        select: "rollNo userId branch year division status batchName admissionDate",
        populate: { path: "userId", select: "name email" },
      })
      .populate("sourceBatchIds", "name division year branch");

    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    const batchObj = batch.toObject();
    batchObj.displayName = batchObj.displayName || `Batch ${batchObj.name}`;
    batchObj.studentCount = batchObj.students ? batchObj.students.length : 0;

    return res.status(200).json({
      success: true,
      batch: batchObj,
    });
  } catch (error) {
    console.error("[BATCH] Error in getBatchById:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch batch details",
      error: error.message,
    });
  }
};

/**
 * 3. QUICK AUTO-SETUP BATCHES
 * POST /api/admin/batches/quick-setup
 * Body: { branchId, year, division, academicYear, splitMethod, batchCount, studentsPerBatch, customRanges, namingPattern, labRoom }
 */
export const quickSetupBatches = async (req, res) => {
  try {
    const {
      branchId,
      year,
      division,
      academicYear,
      splitMethod = "equal",
      batchCount = 3,
      studentsPerBatch = 25,
      customRanges = [],
      namingPattern = "auto",
      labRoom,
    } = req.body;

    if (!branchId || !year || !division) {
      return res.status(400).json({
        success: false,
        message: "branchId, year, and division are required for quick setup",
      });
    }

    console.log(`[BATCH] Quick setup initiated for ${branchId} Year ${year} Div ${division} using ${splitMethod}`);

    // Fetch active students for this class sorted by Roll No
    const studentQuery = {
      branch: branchId,
      year: Number(year),
      division,
      status: { $ne: "inactive" },
      isDeleted: { $ne: true },
    };

    let students = [];
    if (academicYear) {
      students = await Student.find({ ...studentQuery, academicYear }).sort({ rollNo: 1 });
    }
    if (students.length === 0) {
      students = await Student.find(studentQuery).sort({ rollNo: 1 });
    }

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active students found for this class to create batches. Please upload students for this class under Students management first.",
      });
    }

    const createdBatches = [];

    if (splitMethod === "equal") {
      const numBatches = Number(batchCount) || 3;
      const totalStudents = students.length;
      const chunkSize = Math.ceil(totalStudents / numBatches);

      for (let i = 0; i < numBatches; i++) {
        const chunk = students.slice(i * chunkSize, (i + 1) * chunkSize);
        if (chunk.length === 0) continue;

        const batchName = namingPattern === "auto" ? `B${division}${i + 1}` : `Batch_${i + 1}`;
        const minRoll = chunk[0].rollNo;
        const maxRoll = chunk[chunk.length - 1].rollNo;

        // Check if batch exists (or soft deleted) and replace or reuse
        let batch = await Batch.findOne({
          name: batchName,
          branch: branchId,
          year: Number(year),
          division,
          isDeleted: false,
        });

        if (!batch) {
          batch = await Batch.create({
            name: batchName,
            displayName: `Batch ${batchName}`,
            branch: branchId,
            year: Number(year),
            division,
            academicYear,
            labRoom: labRoom || "",
            batchType: "regular",
            isMerged: false,
            rollRanges: [{ from: String(minRoll), to: String(maxRoll), division }],
            autoCreated: true,
            students: chunk.map((s) => s._id),
          });
        } else {
          batch.students = chunk.map((s) => s._id);
          batch.rollRanges = [{ from: String(minRoll), to: String(maxRoll), division }];
          if (labRoom) batch.labRoom = labRoom;
          await batch.save();
        }

        // Update students using helper
        await assignStudentsToBatch(
          batch._id,
          chunk.map((s) => s._id.toString())
        );

        createdBatches.push(batch);
      }
    } else if (splitMethod === "fixed") {
      const perBatch = Number(studentsPerBatch) || 25;
      const totalStudents = students.length;
      const numBatches = Math.ceil(totalStudents / perBatch);

      for (let i = 0; i < numBatches; i++) {
        const chunk = students.slice(i * perBatch, (i + 1) * perBatch);
        if (chunk.length === 0) continue;

        const batchName = `B${division}${i + 1}`;
        const minRoll = chunk[0].rollNo;
        const maxRoll = chunk[chunk.length - 1].rollNo;

        let batch = await Batch.create({
          name: batchName,
          displayName: `Batch ${batchName}`,
          branch: branchId,
          year: Number(year),
          division,
          academicYear,
          labRoom: labRoom || "",
          batchType: "regular",
          isMerged: false,
          rollRanges: [{ from: String(minRoll), to: String(maxRoll), division }],
          autoCreated: true,
          students: chunk.map((s) => s._id),
        });

        await assignStudentsToBatch(
          batch._id,
          chunk.map((s) => s._id.toString())
        );

        createdBatches.push(batch);
      }
    } else if (splitMethod === "custom" && Array.isArray(customRanges)) {
      for (let index = 0; index < customRanges.length; index++) {
        const range = customRanges[index];
        const fromRoll = Number(range.from);
        const toRoll = Number(range.to);
        const bName = range.name || `B${division}${index + 1}`;

        const chunk = students.filter((s) => s.rollNo >= fromRoll && s.rollNo <= toRoll);

        let batch = await Batch.create({
          name: bName,
          displayName: `Batch ${bName}`,
          branch: branchId,
          year: Number(year),
          division,
          academicYear,
          labRoom: labRoom || range.labRoom || "",
          batchType: "regular",
          isMerged: false,
          rollRanges: [{ from: String(fromRoll), to: String(toRoll), division }],
          autoCreated: true,
          students: chunk.map((s) => s._id),
        });

        if (chunk.length > 0) {
          await assignStudentsToBatch(
            batch._id,
            chunk.map((s) => s._id.toString())
          );
        }

        createdBatches.push(batch);
      }
    }

    console.log(`[BATCH] Quick setup completed. Created/Updated ${createdBatches.length} batches`);

    return res.status(201).json({
      success: true,
      message: `Successfully created ${createdBatches.length} batches for Division ${division}`,
      batches: createdBatches,
    });
  } catch (error) {
    console.error("[BATCH] Error in quickSetupBatches:", error);
    return res.status(500).json({
      success: false,
      message: "Quick setup failed",
      error: error.message,
    });
  }
};

/**
 * 4. CREATE CUSTOM BATCH
 * POST /api/admin/batches
 * Body: { name, branchId, year, division / divisions, academicYear, studentIds, labRoom, description, maxCapacity }
 */
export const createBatch = async (req, res) => {
  try {
    const {
      name,
      displayName,
      branchId,
      year,
      division,
      divisions,
      academicYear,
      studentIds = [],
      labRoom,
      description,
      maxCapacity,
      rollRanges,
    } = req.body;

    if (!name || !branchId || !year) {
      return res.status(400).json({
        success: false,
        message: "Batch name, branchId, and year are required",
      });
    }

    const div = division || (divisions && divisions[0]) || "A";

    // Check duplicate
    const existing = await Batch.findOne({
      name,
      branch: branchId,
      year: Number(year),
      division: div,
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Batch '${name}' already exists for this class`,
      });
    }

    const batch = await Batch.create({
      name,
      displayName: displayName || `Batch ${name}`,
      branch: branchId,
      year: Number(year),
      division: div,
      divisions: divisions || [div],
      academicYear,
      labRoom: labRoom || "",
      description: description || "",
      maxCapacity: maxCapacity ? Number(maxCapacity) : undefined,
      rollRanges: rollRanges || [],
      batchType: "regular",
      isMerged: false,
      students: [],
    });

    if (studentIds.length > 0) {
      await assignStudentsToBatch(batch._id, studentIds);
    }

    const updatedBatch = await Batch.findById(batch._id).populate("students");

    console.log(`[BATCH] Custom batch created: ${name}`);

    return res.status(201).json({
      success: true,
      message: `Batch '${name}' created successfully`,
      batch: updatedBatch,
    });
  } catch (error) {
    console.error("[BATCH] Error in createBatch:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create batch",
      error: error.message,
    });
  }
};

/**
 * 5. UPDATE BATCH DETAILS
 * PUT /api/admin/batches/:id
 * Body: { name, displayName, labRoom, description, maxCapacity, rollRanges }
 */
export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, displayName, labRoom, description, maxCapacity, rollRanges } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Batch ID" });
    }

    const objectId = new mongoose.Types.ObjectId(id);

    const batch = await Batch.findOne({ _id: objectId, isDeleted: false });
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    if (name !== undefined) batch.name = name;
    if (displayName !== undefined) batch.displayName = displayName;
    if (labRoom !== undefined) batch.labRoom = labRoom;
    if (description !== undefined) batch.description = description;
    
    if (maxCapacity !== undefined) {
      // If empty string or 0, unset it. Otherwise parse as number.
      if (!maxCapacity || maxCapacity === "") {
        batch.maxCapacity = undefined;
      } else {
        batch.maxCapacity = Number(maxCapacity);
      }
    }
    
    if (rollRanges !== undefined) batch.rollRanges = rollRanges;

    await batch.save();

    console.log(`[BATCH] Updated batch ${batch.name} (${batch._id})`);

    return res.status(200).json({
      success: true,
      message: `Batch '${batch.name}' updated successfully`,
      batch,
    });
  } catch (error) {
    console.error("[BATCH] Error in updateBatch:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update batch",
      error: error.message,
    });
  }
};

/**
 * 6. ADD STUDENTS TO BATCH
 * POST /api/admin/batches/:id/students
 * Body: { studentIds: [] }
 */
export const addStudentsToBatchController = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Batch ID" });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "studentIds array is required" });
    }

    const updatedBatch = await assignStudentsToBatch(id, studentIds);

    return res.status(200).json({
      success: true,
      message: `Added ${studentIds.length} students to batch`,
      batch: updatedBatch,
    });
  } catch (error) {
    console.error("[BATCH] Error in addStudentsToBatchController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add students to batch",
      error: error.message,
    });
  }
};

/**
 * 7. REMOVE STUDENT FROM BATCH
 * DELETE /api/admin/batches/:id/students/:studentId
 */
export const removeStudentFromBatchController = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: "Invalid Batch ID or Student ID" });
    }

    const updatedBatch = await removeStudentHelper(id, studentId);

    return res.status(200).json({
      success: true,
      message: "Student removed from batch",
      batch: updatedBatch,
    });
  } catch (error) {
    console.error("[BATCH] Error in removeStudentFromBatchController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove student from batch",
      error: error.message,
    });
  }
};

/**
 * 8. BULK MOVE STUDENTS BETWEEN BATCHES
 * POST /api/admin/batches/bulk-move
 * Body: { fromBatchId, toBatchId, studentIds: [] }
 */
export const bulkMoveStudents = async (req, res) => {
  try {
    const { fromBatchId, toBatchId, studentIds = [] } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(fromBatchId) ||
      !mongoose.Types.ObjectId.isValid(toBatchId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid source or target batch ID" });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "studentIds array is required" });
    }

    const result = await moveStudentsHelper(fromBatchId, toBatchId, studentIds);

    return res.status(200).json({
      success: true,
      message: `Successfully moved ${studentIds.length} students`,
      fromBatch: result.fromBatch,
      toBatch: result.toBatch,
    });
  } catch (error) {
    console.error("[BATCH] Error in bulkMoveStudents:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to move students between batches",
      error: error.message,
    });
  }
};

/**
 * 9. CREATE MERGED BATCH
 * POST /api/admin/batches/merge
 * Body: { name, sourceBatchIds: [], studentIds: [], labRoom }
 */
export const createMergedBatch = async (req, res) => {
  try {
    const { name, sourceBatchIds = [], studentIds = [], labRoom, description } = req.body;

    if (!name || !Array.isArray(sourceBatchIds) || sourceBatchIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Merged batch name and at least 2 sourceBatchIds are required",
      });
    }

    // Validate source batches
    const sourceBatches = await Batch.find({
      _id: { $in: sourceBatchIds },
      isDeleted: false,
    }).populate("students");

    if (sourceBatches.length !== sourceBatchIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more source batches were not found",
      });
    }

    // Check same year & branch
    const firstBranch = sourceBatches[0].branch.toString();
    const firstYear = sourceBatches[0].year;

    const invalid = sourceBatches.some(
      (b) => b.branch.toString() !== firstBranch || b.year !== firstYear
    );

    if (invalid) {
      return res.status(400).json({
        success: false,
        message: "Cannot merge batches from different branches or academic years",
      });
    }

    // Extract all divisions involved
    const divisions = [...new Set(sourceBatches.map((b) => b.division))];

    // Combine student IDs
    let combinedStudentIds = [];
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      combinedStudentIds = studentIds;
    } else {
      sourceBatches.forEach((b) => {
        (b.students || []).forEach((s) => {
          const idStr = s._id ? s._id.toString() : s.toString();
          if (!combinedStudentIds.includes(idStr)) combinedStudentIds.push(idStr);
        });
      });
    }

    const mergedBatch = await Batch.create({
      name,
      displayName: `Merged Batch ${name}`,
      branch: firstBranch,
      year: firstYear,
      division: divisions[0],
      divisions,
      academicYear: sourceBatches[0].academicYear,
      batchType: "merged",
      isMerged: true,
      sourceBatchIds,
      labRoom: labRoom || "",
      description: description || `Merged from ${sourceBatches.map((b) => b.name).join(", ")}`,
      students: [],
    });

    if (combinedStudentIds.length > 0) {
      await assignStudentsToBatch(mergedBatch._id, combinedStudentIds);
    }

    const populatedMerged = await Batch.findById(mergedBatch._id).populate("students");

    console.log(`[BATCH] Merged batch created: ${name} with ${combinedStudentIds.length} students`);

    return res.status(201).json({
      success: true,
      message: `Merged batch '${name}' created successfully`,
      batch: populatedMerged,
    });
  } catch (error) {
    console.error("[BATCH] Error in createMergedBatch:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create merged batch",
      error: error.message,
    });
  }
};

/**
 * 10. DELETE BATCH (Soft Delete)
 * DELETE /api/admin/batches/:id
 */
export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Batch ID" });
    }

    const objectId = new mongoose.Types.ObjectId(id);

    const batch = await Batch.findOne({ _id: objectId, isDeleted: false });
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    // Check for existing attendance sessions referencing this batch
    const sessionCount = await AttendanceSession.countDocuments({
      batch: objectId,
      isDeleted: false,
    });

    if (sessionCount > 0) {
      console.log(`[BATCH] Warning: Batch ${batch.name} has ${sessionCount} active attendance sessions.`);
      // If client hasn't specified force query param, warn
      if (req.query.force !== "true") {
        return res.status(409).json({
          success: false,
          hasSessions: true,
          sessionCount,
          message: `Batch '${batch.name}' has ${sessionCount} attendance sessions associated with it. Soft-deleting will preserve past attendance data. Pass ?force=true to proceed.`,
        });
      }
    }

    // Soft delete
    batch.isDeleted = true;
    batch.deletedAt = new Date();
    if (req.user && req.user._id) batch.deletedBy = req.user._id;
    await batch.save();

    // Pull batch from students (both legacy single field and new array field)
    await Student.updateMany(
      { $or: [{ batch: objectId }, { practicalBatches: objectId }] },
      {
        $unset: { batch: 1 },
        $pull: { practicalBatches: objectId },
      }
    );

    console.log(`[BATCH] Soft deleted batch: ${batch.name} (${batch._id})`);

    return res.status(200).json({
      success: true,
      message: `Batch '${batch.name}' deleted successfully`,
    });
  } catch (error) {
    console.error("[BATCH] Error in deleteBatch:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete batch",
      error: error.message,
    });
  }
};

/**
 * 11. GET UNASSIGNED STUDENTS
 * GET /api/admin/batches/unassigned?branchId=X&year=Y&division=Z&academicYear=W
 */
export const getUnassignedStudents = async (req, res) => {
  try {
    const { branchId, year, division, academicYear } = req.query;

    const unassigned = await getUnassignedStudentsForClass({
      branchId,
      year,
      division,
      academicYear,
    });

    return res.status(200).json({
      success: true,
      count: unassigned.length,
      students: unassigned,
    });
  } catch (error) {
    console.error("[BATCH] Error in getUnassignedStudents:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unassigned students",
      error: error.message,
    });
  }
};

/**
 * 12. BATCH STATISTICS
 * GET /api/admin/batches/stats?branchId=X&year=Y&division=Z&academicYear=W
 */
export const getBatchStats = async (req, res) => {
  try {
    const { branchId, year, division, academicYear } = req.query;

    const studentQuery = { status: "active", isDeleted: { $ne: true } };
    if (branchId) studentQuery.branch = branchId;
    if (year) studentQuery.year = Number(year);
    if (division) studentQuery.division = division;
    if (academicYear) studentQuery.academicYear = academicYear;

    const totalStudents = await Student.countDocuments(studentQuery);

    const batchQuery = { isDeleted: false };
    if (branchId) batchQuery.branch = branchId;
    if (year) batchQuery.year = Number(year);
    if (division) batchQuery.$or = [{ division }, { divisions: division }];
    if (academicYear) batchQuery.academicYear = academicYear;

    const batches = await Batch.find(batchQuery).select("_id name batchType isMerged students");

    const totalBatches = batches.length;
    const mergedBatches = batches.filter((b) => b.isMerged || b.batchType === "merged").length;

    let batchedStudentsCount = 0;
    let batchesWithNoStudents = 0;
    const batchedStudentIds = new Set();

    batches.forEach((b) => {
      const sCount = b.students ? b.students.length : 0;
      if (sCount === 0) batchesWithNoStudents++;
      (b.students || []).forEach((sId) => batchedStudentIds.add(sId.toString()));
    });

    batchedStudentsCount = batchedStudentIds.size;
    const unassignedStudents = Math.max(0, totalStudents - batchedStudentsCount);
    const averageBatchSize =
      totalBatches > 0 ? Math.round(batchedStudentsCount / totalBatches) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        batchedStudents: batchedStudentsCount,
        unassignedStudents,
        totalBatches,
        mergedBatches,
        averageBatchSize,
        batchesWithNoStudents,
      },
    });
  } catch (error) {
    console.error("[BATCH] Error in getBatchStats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate batch statistics",
      error: error.message,
    });
  }
};
