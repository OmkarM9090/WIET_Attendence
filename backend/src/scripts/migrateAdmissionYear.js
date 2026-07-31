import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Student from "../models/Student.js";
import "../models/User.js";
import { calculateAdmissionYear, getCurrentAcademicYear } from "../utils/emailGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const isApplyMode = process.argv.includes("--apply");
const isDryRun = !isApplyMode || process.argv.includes("--dry-run");

const getStudentLabel = (student) => {
  const name = student.userId?.name || "Unknown Student";
  return `${name} | Roll ${student.rollNo} | Year ${student.year} | Division ${student.division}`;
};

const getAcademicYearForStudent = (student) => {
  if (student.academicYear && /^\d{4}-\d{4}$/.test(String(student.academicYear))) {
    return String(student.academicYear);
  }
  return getCurrentAcademicYear();
};

const buildClassKey = (student, admissionYear) =>
  [
    String(student.branch),
    String(admissionYear),
    String(student.division || "").toUpperCase(),
    String(student.rollNo)
  ].join("|");

async function migrateAdmissionYear() {
  try {
    console.log("[MIGRATION] ========================================");
    console.log("[MIGRATION] Admission Year Migration Script");
    console.log(`[MIGRATION] Mode: ${isApplyMode ? "APPLY" : "DRY RUN"}`);
    console.log("[MIGRATION] ========================================");

    await mongoose.connect(mongoUri);
    console.log("[MIGRATION] Connected to MongoDB.");

    const studentsNeedingMigration = await Student.find({
      $or: [
        { admissionYear: { $exists: false } },
        { admissionYear: null }
      ]
    })
      .populate("userId", "name email")
      .select("userId rollNo branch year division academicYear admissionYear")
      .lean();

    console.log(`[MIGRATION] Students without admissionYear: ${studentsNeedingMigration.length}`);

    if (studentsNeedingMigration.length === 0) {
      console.log("[MIGRATION] Nothing to migrate. All students already have admissionYear.");
      return;
    }

    const proposedUpdates = [];
    const calculationErrors = [];

    for (const student of studentsNeedingMigration) {
      try {
        const academicYear = getAcademicYearForStudent(student);
        const admissionYear = calculateAdmissionYear(student.year, academicYear);

        proposedUpdates.push({
          _id: student._id,
          academicYear,
          admissionYear,
          rollNo: student.rollNo,
          branch: student.branch,
          division: student.division,
          student
        });
      } catch (error) {
        calculationErrors.push({
          studentId: student._id,
          label: getStudentLabel(student),
          reason: error.message
        });
      }
    }

    if (calculationErrors.length > 0) {
      console.log("[MIGRATION] Calculation errors found:");
      calculationErrors.forEach((item) => {
        console.log(`[MIGRATION] ERROR | ${item.label} | ${item.reason}`);
      });
      console.log("[MIGRATION] Aborting. Fix the invalid records before migration.");
      return;
    }

    const existingStudentsWithAdmissionYear = await Student.find({
      admissionYear: { $exists: true, $ne: null }
    })
      .select("rollNo branch division admissionYear userId year")
      .populate("userId", "name email")
      .lean();

    const existingKeyMap = new Map();
    existingStudentsWithAdmissionYear.forEach((student) => {
      const key = buildClassKey(student, student.admissionYear);
      if (!existingKeyMap.has(key)) {
        existingKeyMap.set(key, []);
      }
      existingKeyMap.get(key).push({
        _id: student._id,
        label: getStudentLabel(student)
      });
    });

    const proposedKeyMap = new Map();
    proposedUpdates.forEach((item) => {
      const key = buildClassKey(item.student, item.admissionYear);
      if (!proposedKeyMap.has(key)) {
        proposedKeyMap.set(key, []);
      }
      proposedKeyMap.get(key).push(item);
    });

    const conflicts = [];

    proposedKeyMap.forEach((items, key) => {
      if (items.length > 1) {
        conflicts.push({
          type: "duplicate-within-migration",
          key,
          existing: [],
          proposed: items.map((item) => ({
            _id: item._id,
            label: getStudentLabel(item.student),
            admissionYear: item.admissionYear
          }))
        });
      }

      if (existingKeyMap.has(key)) {
        conflicts.push({
          type: "duplicate-with-existing",
          key,
          existing: existingKeyMap.get(key),
          proposed: items.map((item) => ({
            _id: item._id,
            label: getStudentLabel(item.student),
            admissionYear: item.admissionYear
          }))
        });
      }
    });

    console.log(`[MIGRATION] Proposed updates: ${proposedUpdates.length}`);
    console.log(`[MIGRATION] Conflicts detected: ${conflicts.length}`);

    if (conflicts.length > 0) {
      console.log("[MIGRATION] ----------------------------------------");
      console.log("[MIGRATION] CONFLICTS FOUND. Migration cannot be applied.");
      conflicts.forEach((conflict, index) => {
        console.log(`[MIGRATION] Conflict ${index + 1} | ${conflict.type}`);
        console.log(`[MIGRATION] Key: ${conflict.key}`);

        if (conflict.existing.length > 0) {
          conflict.existing.forEach((item) => {
            console.log(`[MIGRATION] Existing: ${item.label}`);
          });
        }

        conflict.proposed.forEach((item) => {
          console.log(`[MIGRATION] Proposed: ${item.label} | Admission Year ${item.admissionYear}`);
        });
      });
      console.log("[MIGRATION] ----------------------------------------");
      console.log("[MIGRATION] Resolve these class-level duplicate roll numbers before applying migration.");
      return;
    }

    if (isDryRun) {
      console.log("[MIGRATION] Dry run complete. No conflicts found.");
      console.log("[MIGRATION] Sample updates:");
      proposedUpdates.slice(0, 10).forEach((item) => {
        console.log(
          `[MIGRATION] ${getStudentLabel(item.student)} -> admissionYear ${item.admissionYear} (academicYear ${item.academicYear})`
        );
      });
      if (proposedUpdates.length > 10) {
        console.log(`[MIGRATION] ...and ${proposedUpdates.length - 10} more.`);
      }
      console.log("[MIGRATION] Re-run with --apply to save these changes.");
      return;
    }

    const operations = proposedUpdates.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { admissionYear: item.admissionYear } }
      }
    }));

    const result = await Student.bulkWrite(operations, { ordered: true });
    console.log("[MIGRATION] Admission year migration applied successfully.");
    console.log(`[MIGRATION] Matched: ${result.matchedCount}`);
    console.log(`[MIGRATION] Modified: ${result.modifiedCount}`);
    console.log("[MIGRATION] Existing emails were not changed.");
  } catch (error) {
    console.error("[MIGRATION ERROR]", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

migrateAdmissionYear();
