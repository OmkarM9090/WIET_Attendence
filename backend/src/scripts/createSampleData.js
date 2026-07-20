import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";
import Branch from "../models/Branch.js";
import Subject from "../models/Subject.js";
import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import TeachingAssignment from "../models/TeachingAssignment.js";

// Load environment variables
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const yearPrefix = { 1: "F", 2: "S", 3: "T", 4: "B" };
const divisions = ["A", "B", "C"];

async function createSampleData() {
  try {
    console.log("[SAMPLE DATA] Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[SAMPLE DATA] Connected successfully.");

    // Clear existing for clean slate
    console.log("[SAMPLE DATA] Clearing existing related data...");
    await Branch.deleteMany({ code: "COMP" });
    await Subject.deleteMany({ code: { $in: ["CS101", "CS201", "CS301", "CS401"] } });
    
    // Create Branch
    const branch = await Branch.create({
      name: "Computer Engineering",
      code: "COMP"
    });
    console.log(`[SAMPLE DATA] Created branch: ${branch.name}`);

    // Create Subjects
    const subjects = [];
    for (let y = 1; y <= 4; y++) {
      const sub = await Subject.create({
        name: `Computer Science Year ${y}`,
        code: `CS${y}01`,
        semester: y * 2 - 1, // 1, 3, 5, 7
        branch: branch._id,
        credits: 4,
        semesterStartDate: new Date("2024-06-01"),
        semesterEndDate: new Date("2024-12-01"),
      });
      subjects.push(sub);
    }
    console.log(`[SAMPLE DATA] Created ${subjects.length} subjects.`);

    // Create Teachers
    const pHash = await bcrypt.hash("password123", 10);
    const teachers = [];
    for (let i = 1; i <= 3; i++) {
      const tUser = await User.create({
        name: `Teacher ${i}`,
        email: `teacher${i}@college.edu`,
        passwordHash: pHash,
        role: "teacher"
      });
      teachers.push(tUser);
    }
    console.log(`[SAMPLE DATA] Created ${teachers.length} teachers.`);

    // Create Batches & Students
    let studentCount = 0;
    let batchCount = 0;
    
    // 4 Years
    for (let y = 1; y <= 4; y++) {
      // 3 Divisions
      for (const div of divisions) {
        // 3 Batches per division (e.g. FA1, FA2, FA3)
        const batches = [];
        for (let b = 1; b <= 3; b++) {
          const batchName = `${yearPrefix[y]}${div}${b}`; // FA1
          const batch = await Batch.create({
            name: batchName,
            branch: branch._id,
            year: y,
            division: div,
            academicYear: "2024-2025"
          });
          batches.push(batch);
          batchCount++;
          
          // 2 Students per batch (6 per division)
          for (let s = 1; s <= 2; s++) {
            const rollNo = parseInt(`${y}${div.charCodeAt(0)}${b}${s}`);
            const sUser = await User.create({
              name: `Student ${batchName} ${s}`,
              email: `student.${batchName}.${s}@college.edu`,
              passwordHash: pHash,
              role: "student"
            });
            
            await Student.create({
              userId: sUser._id,
              rollNo: rollNo,
              branch: branch._id,
              year: y,
              division: div,
              batch: batch._id,
              academicYear: "2024-2025",
              admissionDate: new Date("2024-06-01")
            });
            studentCount++;
          }
        }

        // Assign teachers to this division (Theory)
        await TeachingAssignment.create({
          teacher: teachers[0]._id, // Teacher 1 takes theory
          subject: subjects[y-1]._id,
          branch: branch._id,
          year: y,
          division: div,
          sessionType: "LECTURE"
        });

        // Assign teachers to batches (Practical)
        for (const batch of batches) {
          await TeachingAssignment.create({
            teacher: teachers[1]._id, // Teacher 2 takes practicals
            subject: subjects[y-1]._id,
            branch: branch._id,
            year: y,
            division: div,
            batchId: batch._id,
            sessionType: "PRACTICAL"
          });
        }
      }
    }
    console.log(`[SAMPLE DATA] Created ${batchCount} batches and ${studentCount} students.`);
    console.log(`[SAMPLE DATA] Created teaching assignments.`);
    
    console.log("[SAMPLE DATA] Process complete! Run 'npm run dev' to test.");
  } catch (error) {
    console.error("[SAMPLE DATA ERROR]", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createSampleData();
