import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import AttendanceSession from "../models/AttendanceSession.js";

// Load environment variables
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../../.env") });

async function migrate() {
  try {
    console.log("[MIGRATION] Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[MIGRATION] Connected successfully.");

    // 1. Migrate Students
    console.log("[MIGRATION] Starting Student batch migration...");
    const students = await Student.find({ batch: { $type: "string" } });
    console.log(`[MIGRATION] Found ${students.length} students with String batch.`);

    let studentSuccess = 0;
    let studentFail = 0;

    for (const student of students) {
      if (!student.batch || typeof student.batch !== 'string') continue;

      const batchStr = student.batch.trim();
      const batchDoc = await Batch.findOne({
        name: batchStr,
        branch: student.branch,
        year: student.year,
        division: student.division
      });

      if (batchDoc) {
        // Update batch to ObjectId using updateOne to bypass schema strictness during migration
        await Student.updateOne({ _id: student._id }, { $set: { batch: batchDoc._id } });
        studentSuccess++;
      } else {
        console.warn(`[MIGRATION WARNING] No matching Batch found for student ${student.rollNo} (Batch String: ${batchStr})`);
        studentFail++;
      }
    }
    console.log(`[MIGRATION] Students migrated: ${studentSuccess} Success, ${studentFail} Failed.`);

    // 2. Migrate AttendanceSessions
    console.log("[MIGRATION] Starting AttendanceSession batch migration...");
    const sessions = await AttendanceSession.find({ batch: { $type: "string" } });
    console.log(`[MIGRATION] Found ${sessions.length} sessions with String batch.`);

    let sessionSuccess = 0;
    let sessionFail = 0;

    for (const session of sessions) {
      if (!session.batch || typeof session.batch !== 'string') continue;

      const batchStr = session.batch.trim();
      const batchDoc = await Batch.findOne({
        name: batchStr,
        branch: session.branch,
        year: session.year,
        division: session.division
      });

      if (batchDoc) {
        await AttendanceSession.updateOne({ _id: session._id }, { $set: { batch: batchDoc._id } });
        sessionSuccess++;
      } else {
        console.warn(`[MIGRATION WARNING] No matching Batch found for session ${session._id} (Batch String: ${batchStr})`);
        sessionFail++;
      }
    }
    console.log(`[MIGRATION] Sessions migrated: ${sessionSuccess} Success, ${sessionFail} Failed.`);

    console.log("[MIGRATION] Complete!");
  } catch (error) {
    console.error("[MIGRATION ERROR]", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
