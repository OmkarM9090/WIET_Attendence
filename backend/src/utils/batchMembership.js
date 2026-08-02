// utils/batchMembership.js
// Central helper for batch operations and membership management
// Used across controllers, routes, attendance, and reporting.

import mongoose from "mongoose";
import Batch from "../models/Batch.js";
import Student from "../models/Student.js";

const toStringId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value).trim();
};

const normalizeBatchName = (value) => toStringId(value).trim();

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(toStringId(value));

const buildBatchLookupQuery = (batchRef) => {
  const lookup = {
    isDeleted: { $ne: true },
  };

  const ref = normalizeBatchName(batchRef);
  if (!ref) {
    return null;
  }

  if (isValidObjectId(ref)) {
    lookup.$or = [{ _id: ref }, { name: ref }];
  } else {
    lookup.name = ref;
  }

  return lookup;
};

const resolveBatchDoc = async (batchRef) => {
  if (!batchRef) return null;

  if (typeof batchRef === "object" && batchRef._id && batchRef.name) {
    return batchRef;
  }

  const query = buildBatchLookupQuery(batchRef);
  if (!query) return null;

  return Batch.findOne(query).lean();
};

const resolveStudentDoc = async (studentRef) => {
  if (!studentRef) return null;

  if (typeof studentRef === "object" && studentRef._id) {
    return studentRef;
  }

  if (!isValidObjectId(studentRef)) {
    return null;
  }

  return Student.findById(studentRef).lean();
};

const batchIdMatches = (candidate, batchDoc) => {
  if (!candidate || !batchDoc) return false;

  const candidateString = toStringId(candidate);
  const batchId = toStringId(batchDoc._id);
  const batchName = normalizeBatchName(batchDoc.name);

  return (
    candidateString === batchId ||
    (batchName && candidateString === batchName)
  );
};

const toBatchIdStrings = (values = []) =>
  values
    .map((value) => toStringId(value))
    .filter(Boolean);

/**
 * Returns true when a student belongs to a batch.
 * This checks the new source of truth first, then legacy fallback fields.
 */
export const isStudentInBatch = async (studentId, batchId) => {
  const [student, batch] = await Promise.all([
    resolveStudentDoc(studentId),
    resolveBatchDoc(batchId),
  ]);

  if (!student || !batch) {
    return false;
  }

  const batchIdString = toStringId(batch._id);
  const practicalBatchIds = toBatchIdStrings(student.practicalBatches);

  if (practicalBatchIds.includes(batchIdString)) {
    return true;
  }

  if (batchIdMatches(student.batch, batch)) {
    return true;
  }

  if (Array.isArray(batch.students)) {
    return batch.students.some((memberId) => toStringId(memberId) === toStringId(student._id));
  }

  return false;
};

/**
 * Returns the students assigned to a batch.
 * Uses Batch.students as the source of truth and falls back to legacy fields.
 */
export const getStudentsForBatch = async (batchId) => {
  const batch = await resolveBatchDoc(batchId);

  if (!batch) {
    return [];
  }

  const memberIds = toBatchIdStrings(batch.students);

  let students = [];

  if (memberIds.length > 0) {
    students = await Student.find({
      _id: { $in: memberIds },
      isDeleted: { $ne: true },
    })
      .populate("userId", "name email")
      .sort({ rollNo: 1 })
      .lean();
  } else {
    const fallbackQuery = {
      isDeleted: { $ne: true },
      $or: [
        { batch: batch._id },
        { practicalBatches: batch._id },
        { batchName: batch.name },
      ],
    };

    students = await Student.find(fallbackQuery)
      .populate("userId", "name email")
      .sort({ rollNo: 1 })
      .lean();
  }

  return students;
};

/**
 * Returns all batches a student belongs to.
 * Combines direct batch membership, practicalBatches, and reverse lookup from Batch.students.
 */
export const getStudentBatches = async (studentId) => {
  const student = await resolveStudentDoc(studentId);

  if (!student) {
    return [];
  }

  const batchIds = new Set();
  const addBatchRef = (value) => {
    const ref = normalizeBatchName(value);
    if (ref) {
      batchIds.add(ref);
    }
  };

  addBatchRef(student.batch);
  toBatchIdStrings(student.practicalBatches).forEach(addBatchRef);

  const reverseLookupBatches = await Batch.find({
    students: student._id,
    isDeleted: { $ne: true },
  })
    .sort({ name: 1 })
    .lean();

  reverseLookupBatches.forEach((batch) => {
    addBatchRef(batch._id);
  });

  if (batchIds.size === 0) {
    return reverseLookupBatches;
  }

  const orConditions = [...batchIds].reduce((acc, ref) => {
    if (isValidObjectId(ref)) {
      acc.push({ _id: ref });
    } else {
      acc.push({ name: ref });
    }
    return acc;
  }, []);

  return Batch.find({
    isDeleted: { $ne: true },
    $or: orConditions,
  })
    .sort({ name: 1 })
    .lean();
};

/**
 * Adds a student to a batch on both sides.
 * Keeps the legacy single batch field populated when it is currently empty.
 */
export const addStudentToBatch = async (studentId, batchId) => {
  const [student, batch] = await Promise.all([
    resolveStudentDoc(studentId),
    resolveBatchDoc(batchId),
  ]);

  if (!student) {
    return { success: false, message: "Student not found" };
  }

  if (!batch) {
    return { success: false, message: "Batch not found" };
  }

  const canAccept = await Batch.canAcceptStudent(batch._id, student._id);
  if (!canAccept) {
    return {
      success: false,
      message: "Student cannot be added to this batch because the class scope does not match or the batch is full.",
    };
  }

  await Promise.all([
    Batch.updateOne(
      { _id: batch._id },
      { $addToSet: { students: student._id } }
    ),
    Student.updateOne(
      { _id: student._id },
      {
        $addToSet: { practicalBatches: batch._id },
        ...(student.batch ? {} : { $set: { batch: batch._id } }),
      }
    ),
  ]);

  return {
    success: true,
    message: "Student added to batch successfully",
    batchId: batch._id,
    studentId: student._id,
  };
};

/**
 * Assign array of students to a batch
 */
export const assignStudentsToBatch = async (batchId, studentIds = []) => {
  const batch = await resolveBatchDoc(batchId);
  if (!batch) {
    throw new Error("Batch not found");
  }

  const validStudentIds = studentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validStudentIds.length === 0) {
    throw new Error("No valid student IDs provided");
  }

  await Promise.all([
    Batch.updateOne(
      { _id: batch._id },
      { $addToSet: { students: { $each: validStudentIds } } }
    ),
    Student.updateMany(
      { _id: { $in: validStudentIds } },
      {
        $addToSet: { practicalBatches: batch._id },
        $set: { batch: batch._id },
      }
    ),
  ]);

  return Batch.findById(batch._id).populate("students");
};

/**
 * Removes a student from a batch on both sides.
 */
export const removeStudentFromBatch = async (studentId, batchId) => {
  const [student, batch] = await Promise.all([
    resolveStudentDoc(studentId),
    resolveBatchDoc(batchId),
  ]);

  if (!student) {
    return { success: false, message: "Student not found" };
  }

  if (!batch) {
    return { success: false, message: "Batch not found" };
  }

  const remainingPracticalBatchIds = toBatchIdStrings(student.practicalBatches).filter(
    (ref) => ref !== toStringId(batch._id)
  );

  const legacyBatchMatches = batchIdMatches(student.batch, batch);
  const nextLegacyBatch = remainingPracticalBatchIds[0] || null;

  const studentUpdate = {
    $pull: { practicalBatches: batch._id },
  };

  if (legacyBatchMatches) {
    if (nextLegacyBatch) {
      studentUpdate.$set = { batch: nextLegacyBatch };
    } else {
      studentUpdate.$unset = { batch: "" };
    }
  }

  await Promise.all([
    Batch.updateOne(
      { _id: batch._id },
      { $pull: { students: student._id } }
    ),
    Student.updateOne({ _id: student._id }, studentUpdate),
  ]);

  return {
    success: true,
    message: "Student removed from batch successfully",
    batchId: batch._id,
    studentId: student._id,
  };
};

/**
 * Bulk move students from one batch to another
 */
export const moveStudentsBetweenBatches = async (fromBatchId, toBatchId, studentIds) => {
  const validStudentIds = studentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validStudentIds.length === 0) {
    throw new Error("No valid student IDs provided");
  }

  const fromBatch = await Batch.findByIdAndUpdate(
    fromBatchId,
    { $pull: { students: { $in: validStudentIds } } },
    { new: true }
  );

  const toBatch = await Batch.findByIdAndUpdate(
    toBatchId,
    { $addToSet: { students: { $each: validStudentIds } } },
    { new: true }
  );

  await Student.updateMany(
    { _id: { $in: validStudentIds } },
    {
      $pull: { practicalBatches: fromBatchId },
    }
  );

  await Student.updateMany(
    { _id: { $in: validStudentIds } },
    {
      $addToSet: { practicalBatches: toBatchId },
      $set: { batch: toBatch._id },
    }
  );

  return { fromBatch, toBatch };
};

/**
 * Get students of a class not assigned to any practical batch
 */
export const getUnassignedStudentsForClass = async ({
  branchId,
  year,
  division,
  academicYear,
}) => {
  const batchQuery = { isDeleted: { $ne: true } };
  if (branchId) batchQuery.branch = branchId;
  if (year) batchQuery.year = Number(year);
  if (division) batchQuery.division = division;

  const batches = await Batch.find(batchQuery).select("_id students name").lean();

  const assignedStudentIdsInBatches = new Set();
  const batchNames = new Set();

  batches.forEach((b) => {
    batchNames.add(b.name);
    (b.students || []).forEach((sId) => assignedStudentIdsInBatches.add(sId.toString()));
  });

  const studentQuery = {
    status: "active",
    isDeleted: { $ne: true },
  };
  if (branchId) studentQuery.branch = branchId;
  if (year) studentQuery.year = Number(year);
  if (division) studentQuery.division = division;

  let allStudents = [];
  if (academicYear) {
    allStudents = await Student.find({ ...studentQuery, academicYear })
      .populate("userId", "name email")
      .sort({ rollNo: 1 })
      .lean();
  }

  if (allStudents.length === 0) {
    allStudents = await Student.find(studentQuery)
      .populate("userId", "name email")
      .sort({ rollNo: 1 })
      .lean();
  }

  const unassigned = allStudents.filter((student) => {
    const sId = student._id.toString();

    if (assignedStudentIdsInBatches.has(sId)) return false;

    if (student.batch && batches.some((b) => b._id.toString() === student.batch.toString())) {
      return false;
    }
    if (
      student.practicalBatches &&
      student.practicalBatches.some((bId) => batches.some((b) => b._id.toString() === bId.toString()))
    ) {
      return false;
    }
    if (student.batchName && batchNames.has(student.batchName)) {
      return false;
    }

    return true;
  });

  return unassigned;
};

export default {
  isStudentInBatch,
  getStudentsForBatch,
  getStudentBatches,
  addStudentToBatch,
  assignStudentsToBatch,
  removeStudentFromBatch,
  moveStudentsBetweenBatches,
  getUnassignedStudentsForClass,
};
