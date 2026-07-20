import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../models/Student.js";
import AttendanceSession from "../models/AttendanceSession.js";
import Batch from "../models/Batch.js";

// Load environment variables
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../../.env") });

async function cleanup() {
  try {
    console.log("[CLEANUP] Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[CLEANUP] Connected successfully.");

    // 1. Find Students with invalid Batch ObjectId
    console.log("[CLEANUP] Checking for invalid batch references in Students...");
    const students = await Student.find({ batch: { $type: "string" } });
    
    if (students.length > 0) {
      console.log(`[CLEANUP] Found ${students.length} students with string batch. Auto-converting to null to prevent schema errors...`);
      for (const s of students) {
        await Student.updateOne({ _id: s._id }, { $unset: { batch: "" } });
      }
      console.log("[CLEANUP] Students cleaned up.");
    } else {
      console.log("[CLEANUP] No inconsistent students found.");
    }

    // 2. Find AttendanceSessions with invalid Batch ObjectId
    console.log("[CLEANUP] Checking for invalid batch references in AttendanceSessions...");
    const sessions = await AttendanceSession.find({ batch: { $type: "string" } });
    
    if (sessions.length > 0) {
      console.log(`[CLEANUP] Found ${sessions.length} sessions with string batch. These are PRACTICAL sessions and require a batch. Soft-deleting them...`);
      for (const s of sessions) {
        await AttendanceSession.updateOne({ _id: s._id }, { $set: { isDeleted: true, cancelReason: "Cleaned up due to invalid batch schema" } });
      }
      console.log("[CLEANUP] Sessions cleaned up.");
    } else {
      console.log("[CLEANUP] No inconsistent sessions found.");
    }

    // 3. Remove duplicate batches or batches without a branch
    console.log("[CLEANUP] Checking for orphaned batches...");
    const orphanedBatches = await Batch.find({ branch: { $exists: false } });
    if (orphanedBatches.length > 0) {
      console.log(`[CLEANUP] Deleting ${orphanedBatches.length} orphaned batches...`);
      for (const b of orphanedBatches) {
        await Batch.deleteOne({ _id: b._id });
      }
    }

    console.log("[CLEANUP] Process complete!");
  } catch (error) {
    console.error("[CLEANUP ERROR]", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanup();
