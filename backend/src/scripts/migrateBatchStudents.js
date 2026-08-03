import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import Student from "../models/Student.js";
import Batch from "../models/Batch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
const isApplyMode = process.argv.includes("--apply");
const isDryRun = !isApplyMode || process.argv.includes("--dry-run");

const toStringId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value).trim();
};

const batchNameMatches = (studentBatch, batchDoc) => {
  const studentBatchString = toStringId(studentBatch);
  const batchId = toStringId(batchDoc?._id);
  const batchName = toStringId(batchDoc?.name);

  return (
    studentBatchString &&
    (studentBatchString === batchId || studentBatchString === batchName)
  );
};

const buildBatchLookup = async (student) => {
  const batchRef = student.batch;
  const batchRefString = toStringId(batchRef);

  if (!batchRefString) {
    return null;
  }

  const queries = [];

  if (mongoose.Types.ObjectId.isValid(batchRefString)) {
    queries.push({ _id: batchRefString });
  }

  queries.push({ name: batchRefString });

  if (student.branch && student.year != null && student.division) {
    queries.push({
      name: batchRefString,
      branch: student.branch,
      year: Number(student.year),
      division: String(student.division).toUpperCase(),
    });
  }

  for (const query of queries) {
    const batch = await Batch.findOne({
      ...query,
      isDeleted: { $ne: true },
    }).lean();

    if (batch) {
      return batch;
    }
  }

  return null;
};

const logStudentLabel = (student) => {
  const userName = student.userId?.name || "Unknown";
  return `${userName} | Roll ${student.rollNo} | ${student.branch || "Unknown Branch"} | Year ${student.year} | Div ${student.division}`;
};

async function migrateBatchStudents() {
  try {
    console.log("[BATCH-MIGRATION] ========================================");
    console.log("[BATCH-MIGRATION] Student-Batch Migration Script");
    console.log(`[BATCH-MIGRATION] Mode: ${isApplyMode ? "APPLY" : "DRY RUN"}`);
    console.log("[BATCH-MIGRATION] ========================================");

    await mongoose.connect(mongoUri);
    console.log("[BATCH-MIGRATION] Connected to MongoDB.");

    const students = await Student.find({
      batch: { $exists: true, $ne: null },
      isDeleted: { $ne: true },
    })
      .populate("userId", "name email")
      .select("userId rollNo branch year division batch practicalBatches academicYear admissionYear")
      .lean();

    console.log(`[BATCH-MIGRATION] Students with legacy batch field: ${students.length}`);

    const batchCache = new Map();
    const resolveBatch = async (student) => {
      const cacheKey = `${toStringId(student.batch)}|${toStringId(student.branch)}|${student.year}|${toStringId(student.division).toUpperCase()}`;
      if (batchCache.has(cacheKey)) {
        return batchCache.get(cacheKey);
      }

      const batchDoc = await buildBatchLookup(student);
      batchCache.set(cacheKey, batchDoc);
      return batchDoc;
    };

    const proposals = [];
    const unresolved = [];
    const alreadyLinked = [];
    const duplicateWarnings = [];

    for (const student of students) {
      const batchDoc = await resolveBatch(student);

      if (!batchDoc) {
        unresolved.push({
          studentId: student._id,
          label: logStudentLabel(student),
          legacyBatch: toStringId(student.batch),
        });
        continue;
      }

      const batchId = toStringId(batchDoc._id);
      const practicalBatchIds = Array.isArray(student.practicalBatches)
        ? student.practicalBatches.map((value) => toStringId(value)).filter(Boolean)
        : [];

      const batchAlreadyLinked =
        practicalBatchIds.includes(batchId) ||
        batchNameMatches(student.batch, batchDoc);

      if (batchAlreadyLinked) {
        alreadyLinked.push({
          studentId: student._id,
          label: logStudentLabel(student),
          batch: batchDoc.name,
        });
      }

      proposals.push({
        studentId: student._id,
        label: logStudentLabel(student),
        batchId,
        batchName: batchDoc.name,
        addToStudents: !Array.isArray(batchDoc.students) || !batchDoc.students.some((memberId) => toStringId(memberId) === toStringId(student._id)),
        addToPracticalBatches: !practicalBatchIds.includes(batchId),
        setLegacyBatch: !student.batch || !batchNameMatches(student.batch, batchDoc),
      });
    }

    // Detect duplicate membership links before applying.
    const batchStudentMap = new Map();
    proposals.forEach((item) => {
      const key = item.batchId;
      if (!batchStudentMap.has(key)) {
        batchStudentMap.set(key, []);
      }
      batchStudentMap.get(key).push(item.studentId);
    });

    batchStudentMap.forEach((studentIds, batchId) => {
      const uniqueIds = new Set(studentIds.map((id) => toStringId(id)));
      if (uniqueIds.size !== studentIds.length) {
        duplicateWarnings.push({
          batchId,
          count: studentIds.length,
          uniqueCount: uniqueIds.size,
        });
      }
    });

    console.log(`[BATCH-MIGRATION] Proposed links: ${proposals.length}`);
    console.log(`[BATCH-MIGRATION] Already linked: ${alreadyLinked.length}`);
    console.log(`[BATCH-MIGRATION] Unresolved legacy batch refs: ${unresolved.length}`);

    if (unresolved.length > 0) {
      console.log("[BATCH-MIGRATION] Unresolved students:");
      unresolved.forEach((item) => {
        console.log(`[BATCH-MIGRATION] - ${item.label} | legacy batch: ${item.legacyBatch}`);
      });
    }

    if (duplicateWarnings.length > 0) {
      console.log("[BATCH-MIGRATION] Duplicate-link warnings detected:");
      duplicateWarnings.forEach((item) => {
        console.log(
          `[BATCH-MIGRATION] - batch ${item.batchId} has ${item.count} links but only ${item.uniqueCount} unique student ids`
        );
      });
    }

    if (isDryRun) {
      console.log("[BATCH-MIGRATION] Dry run complete. No data was modified.");
      console.log("[BATCH-MIGRATION] Sample planned updates:");
      proposals.slice(0, 10).forEach((item) => {
        console.log(
          `[BATCH-MIGRATION] ${item.label} -> batch ${item.batchName} | addToStudents=${item.addToStudents} | addToPracticalBatches=${item.addToPracticalBatches} | setLegacyBatch=${item.setLegacyBatch}`
        );
      });
      if (proposals.length > 10) {
        console.log(`[BATCH-MIGRATION] ...and ${proposals.length - 10} more.`);
      }
      console.log("[BATCH-MIGRATION] Re-run with --apply to save the changes.");
      return;
    }

    if (unresolved.length > 0) {
      console.log("[BATCH-MIGRATION] Applying migration only to resolvable records.");
    }

    let studentLinksCreated = 0;
    let practicalBatchLinksCreated = 0;
    let legacyBatchSet = 0;
    let batchStudentPulls = 0;
    let skippedAlreadyLinked = 0;

    for (const item of proposals) {
      const student = await Student.findById(item.studentId).select("batch practicalBatches").lean();
      const batch = await Batch.findById(item.batchId).select("students").lean();

      if (!student || !batch) {
        continue;
      }

      const studentPracticalBatchIds = Array.isArray(student.practicalBatches)
        ? student.practicalBatches.map((value) => toStringId(value)).filter(Boolean)
        : [];
      const batchStudentIds = Array.isArray(batch.students)
        ? batch.students.map((value) => toStringId(value)).filter(Boolean)
        : [];

      const needsStudentLink = !batchStudentIds.includes(toStringId(student._id));
      const needsPracticalBatchLink = !studentPracticalBatchIds.includes(toStringId(batch._id));
      const needsLegacyBatchUpdate = !student.batch || !batchNameMatches(student.batch, batch);

      if (!needsStudentLink && !needsPracticalBatchLink && !needsLegacyBatchUpdate) {
        skippedAlreadyLinked++;
        continue;
      }

      const studentUpdate = {};
      const batchUpdate = {};

      if (needsStudentLink) {
        batchUpdate.$addToSet = { students: student._id };
        studentLinksCreated++;
      }

      if (needsPracticalBatchLink) {
        studentUpdate.$addToSet = { practicalBatches: batch._id };
        practicalBatchLinksCreated++;
      }

      if (needsLegacyBatchUpdate) {
        if (!student.batch) {
          studentUpdate.$set = { ...(studentUpdate.$set || {}), batch: batch._id };
          legacyBatchSet++;
        }
      }

      if (Object.keys(batchUpdate).length > 0) {
        await Batch.updateOne({ _id: batch._id }, batchUpdate);
      }

      if (Object.keys(studentUpdate).length > 0) {
        await Student.updateOne({ _id: student._id }, studentUpdate);
      }
    }

    console.log("[BATCH-MIGRATION] Migration applied successfully.");
    console.log(`[BATCH-MIGRATION] batch.students links created: ${studentLinksCreated}`);
    console.log(`[BATCH-MIGRATION] student.practicalBatches links created: ${practicalBatchLinksCreated}`);
    console.log(`[BATCH-MIGRATION] legacy student.batch values set: ${legacyBatchSet}`);
    console.log(`[BATCH-MIGRATION] skipped already linked records: ${skippedAlreadyLinked}`);
    console.log("[BATCH-MIGRATION] Rollback note: restore from backup snapshot, or remove the added batch links using the same student/batch pairs if needed.");
  } catch (error) {
    console.error("[BATCH-MIGRATION ERROR]", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (isMainModule) {
  migrateBatchStudents();
}

export default migrateBatchStudents;
