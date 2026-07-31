import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import AttendanceSession from "../models/AttendanceSession.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const toStringId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value).trim();
};

const formatStudentLabel = (student) => {
  const name = student.userId?.name || "Unknown";
  return `${name} | Roll ${student.rollNo} | ${student.branch?.code || student.branch || "N/A"} | Year ${student.year} | Div ${student.division}`;
};

const formatBatchLabel = (batch) => {
  return `${batch.name} | ${batch.branch?.code || batch.branch || "N/A"} | Year ${batch.year} | Div ${Array.isArray(batch.divisions) && batch.divisions.length > 0 ? batch.divisions.join(",") : batch.division}`;
};

async function verifyBatchIntegrity() {
  try {
    console.log("[BATCH-INTEGRITY] ========================================");
    console.log("[BATCH-INTEGRITY] Batch Integrity Verification");
    console.log("[BATCH-INTEGRITY] Read-only mode");
    console.log("[BATCH-INTEGRITY] ========================================");

    await mongoose.connect(mongoUri);
    console.log("[BATCH-INTEGRITY] Connected to MongoDB.");

    const [batches, students, sessions] = await Promise.all([
      Batch.find({ isDeleted: { $ne: true } })
        .populate("branch", "name code")
        .populate("students", "rollNo userId branch year division practicalBatches batch")
        .lean(),
      Student.find({ isDeleted: { $ne: true } })
        .populate("userId", "name email")
        .populate("branch", "name code")
        .lean(),
      AttendanceSession.find({})
        .populate("subject", "name code")
        .populate("branch", "name code")
        .populate("assignedTeacher", "name email")
        .lean(),
    ]);

    const batchById = new Map(batches.map((batch) => [toStringId(batch._id), batch]));
    const batchNameMap = new Map();
    batches.forEach((batch) => {
      batchNameMap.set(String(batch.name || "").trim(), batch);
    });

    const report = {
      totals: {
        batches: batches.length,
        students: students.length,
        attendanceSessions: sessions.length,
      },
      emptyBatches: [],
      oversizedBatches: [],
      studentsWithOrphanLegacyBatch: [],
      studentsWithOrphanPracticalBatch: [],
      batchesWithMissingStudentRefs: [],
      attendanceSessionsWithMissingBatch: [],
      attendanceSessionsWithStringBatch: [],
      attendanceSessionsWithInvalidBatchType: [],
      attendanceSessionsWithOrphanBatchRef: [],
      attendanceSessionsWithLegacyBatchName: [],
      studentBatchMismatches: [],
      practicalBatchMismatches: [],
    };

    const studentById = new Map(students.map((student) => [toStringId(student._id), student]));

    batches.forEach((batch) => {
      const memberIds = Array.isArray(batch.students) ? batch.students.map((id) => toStringId(id)).filter(Boolean) : [];
      if (memberIds.length === 0) {
        report.emptyBatches.push({
          batchId: batch._id,
          label: formatBatchLabel(batch),
        });
      }

      if (batch.maxCapacity && memberIds.length > batch.maxCapacity) {
        report.oversizedBatches.push({
          batchId: batch._id,
          label: formatBatchLabel(batch),
          count: memberIds.length,
          maxCapacity: batch.maxCapacity,
        });
      }

      memberIds.forEach((studentId) => {
        const student = studentById.get(studentId);
        if (!student) {
          report.batchesWithMissingStudentRefs.push({
            batchId: batch._id,
            label: formatBatchLabel(batch),
            missingStudentId: studentId,
          });
        }
      });
    });

    students.forEach((student) => {
      const legacyBatchId = toStringId(student.batch);
      const practicalBatchIds = Array.isArray(student.practicalBatches)
        ? student.practicalBatches.map((id) => toStringId(id)).filter(Boolean)
        : [];

      if (legacyBatchId) {
        const legacyBatch = batchById.get(legacyBatchId) || batchNameMap.get(legacyBatchId);
        if (!legacyBatch) {
          report.studentsWithOrphanLegacyBatch.push({
            studentId: student._id,
            label: formatStudentLabel(student),
            legacyBatch: legacyBatchId,
          });
        } else {
          const memberIds = Array.isArray(legacyBatch.students)
            ? legacyBatch.students.map((id) => toStringId(id))
            : [];
          if (memberIds.length > 0 && !memberIds.includes(toStringId(student._id))) {
            report.studentBatchMismatches.push({
              studentId: student._id,
              label: formatStudentLabel(student),
              batch: legacyBatch.name,
              reason: "Legacy student.batch points to a batch that does not include the student in batch.students",
            });
          }
        }
      }

      practicalBatchIds.forEach((batchId) => {
        const batch = batchById.get(batchId) || batchNameMap.get(batchId);
        if (!batch) {
          report.studentsWithOrphanPracticalBatch.push({
            studentId: student._id,
            label: formatStudentLabel(student),
            practicalBatch: batchId,
          });
          return;
        }

        const memberIds = Array.isArray(batch.students)
          ? batch.students.map((id) => toStringId(id))
          : [];
        if (memberIds.length > 0 && !memberIds.includes(toStringId(student._id))) {
          report.practicalBatchMismatches.push({
            studentId: student._id,
            label: formatStudentLabel(student),
            batch: batch.name,
            reason: "Student.practicalBatches contains the batch, but batch.students does not contain the student",
          });
        }
      });
    });

    // Raw attendance session inspection so legacy string batches are visible.
    const rawSessions = await mongoose.connection
      .collection("attendancesessions")
      .find({}, { projection: { date: 1, sessionType: 1, batch: 1, subject: 1, branch: 1, year: 1, division: 1, academicYear: 1 } })
      .toArray();

    rawSessions.forEach((session) => {
      const batchValue = session.batch;
      const batchType = typeof batchValue;
      const batchId = toStringId(batchValue);

      if (["PRACTICAL", "LAB"].includes(session.sessionType) && !batchValue) {
        report.attendanceSessionsWithMissingBatch.push({
          sessionId: session._id,
          date: session.date,
          sessionType: session.sessionType,
          subjectId: session.subject,
          classKey: `${session.branch || ""}-${session.year || ""}-${session.division || ""}`,
        });
      }

      if (session.sessionType === "LECTURE" && batchValue) {
        report.attendanceSessionsWithInvalidBatchType.push({
          sessionId: session._id,
          date: session.date,
          sessionType: session.sessionType,
          batch: batchValue,
        });
      }

      if (batchType === "string") {
        report.attendanceSessionsWithStringBatch.push({
          sessionId: session._id,
          date: session.date,
          sessionType: session.sessionType,
          batch: batchValue,
        });

        if (batchNameMap.has(String(batchValue).trim())) {
          report.attendanceSessionsWithLegacyBatchName.push({
            sessionId: session._id,
            date: session.date,
            batch: batchValue,
            resolvedTo: batchNameMap.get(String(batchValue).trim()).name,
          });
        } else if (batchId && !batchById.has(batchId)) {
          report.attendanceSessionsWithOrphanBatchRef.push({
            sessionId: session._id,
            date: session.date,
            batch: batchValue,
          });
        }
      }
    });

    console.log("[BATCH-INTEGRITY] Summary:");
    console.log(`[BATCH-INTEGRITY] Batches: ${report.totals.batches}`);
    console.log(`[BATCH-INTEGRITY] Students: ${report.totals.students}`);
    console.log(`[BATCH-INTEGRITY] Attendance Sessions: ${report.totals.attendanceSessions}`);

    const printSection = (title, items, formatter) => {
      console.log(`[BATCH-INTEGRITY] ${title}: ${items.length}`);
      items.slice(0, 20).forEach((item, index) => {
        console.log(`[BATCH-INTEGRITY] ${index + 1}. ${formatter(item)}`);
      });
      if (items.length > 20) {
        console.log(`[BATCH-INTEGRITY] ...and ${items.length - 20} more`);
      }
    };

    printSection("Empty batches", report.emptyBatches, (item) => item.label);
    printSection("Oversized batches", report.oversizedBatches, (item) => `${item.label} | ${item.count}/${item.maxCapacity}`);
    printSection("Batches with missing student refs", report.batchesWithMissingStudentRefs, (item) => `${item.label} | missing ${item.missingStudentId}`);
    printSection("Students with orphan legacy batch", report.studentsWithOrphanLegacyBatch, (item) => `${item.label} | legacy batch ${item.legacyBatch}`);
    printSection("Students with orphan practical batch", report.studentsWithOrphanPracticalBatch, (item) => `${item.label} | practical batch ${item.practicalBatch}`);
    printSection("Student batch mismatches", report.studentBatchMismatches, (item) => `${item.label} | ${item.batch} | ${item.reason}`);
    printSection("Practical batch mismatches", report.practicalBatchMismatches, (item) => `${item.label} | ${item.batch} | ${item.reason}`);
    printSection("Attendance sessions with missing batch", report.attendanceSessionsWithMissingBatch, (item) => `${item.sessionId} | ${item.sessionType} | ${item.date}`);
    printSection("Attendance sessions with invalid batch type", report.attendanceSessionsWithInvalidBatchType, (item) => `${item.sessionId} | batch present on lecture | ${item.date}`);
    printSection("Attendance sessions with string batch", report.attendanceSessionsWithStringBatch, (item) => `${item.sessionId} | batch=${item.batch}`);
    printSection("Attendance sessions with orphan batch ref", report.attendanceSessionsWithOrphanBatchRef, (item) => `${item.sessionId} | batch=${item.batch}`);
    printSection("Attendance sessions resolved from legacy batch name", report.attendanceSessionsWithLegacyBatchName, (item) => `${item.sessionId} | batch=${item.batch} -> ${item.resolvedTo}`);

    const totalIssues =
      report.emptyBatches.length +
      report.oversizedBatches.length +
      report.batchesWithMissingStudentRefs.length +
      report.studentsWithOrphanLegacyBatch.length +
      report.studentsWithOrphanPracticalBatch.length +
      report.studentBatchMismatches.length +
      report.practicalBatchMismatches.length +
      report.attendanceSessionsWithMissingBatch.length +
      report.attendanceSessionsWithInvalidBatchType.length +
      report.attendanceSessionsWithStringBatch.length +
      report.attendanceSessionsWithOrphanBatchRef.length;

    console.log("[BATCH-INTEGRITY] ========================================");
    console.log(`[BATCH-INTEGRITY] Total issues found: ${totalIssues}`);
    console.log("[BATCH-INTEGRITY] This script does not modify data.");
    console.log("[BATCH-INTEGRITY] Use the migration script first, then re-run this check.");
    console.log("[BATCH-INTEGRITY] ========================================");
  } catch (error) {
    console.error("[BATCH-INTEGRITY ERROR]", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (isMainModule) {
  verifyBatchIntegrity();
}

export default verifyBatchIntegrity;
