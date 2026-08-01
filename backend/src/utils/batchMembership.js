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
 * Removes a student from a batch on both sides.
 * If the legacy batch field points to the removed batch, it is reassigned to another batch
 * when possible, otherwise cleared.
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

export default {
  isStudentInBatch,
  getStudentsForBatch,
  getStudentBatches,
  addStudentToBatch,
  removeStudentFromBatch,
};
