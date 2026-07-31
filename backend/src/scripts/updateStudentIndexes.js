import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const indexesToDrop = [
  "rollNo_1_branch_1",
  "branch_1_year_1_rollNo_1",
  "branch_1_year_1_division_1_rollNo_1"
];

async function updateStudentIndexes() {
  try {
    console.log("[INDEX] ========================================");
    console.log("[INDEX] Student Index Update Script");
    console.log("[INDEX] ========================================");

    await mongoose.connect(mongoUri);
    console.log("[INDEX] Connected to MongoDB.");

    const collection = mongoose.connection.collection("students");

    const currentIndexes = await collection.indexes();
    console.log("[INDEX] Current indexes:");
    currentIndexes.forEach((index) => {
      console.log(`[INDEX] - ${index.name}: ${JSON.stringify(index.key)}${index.unique ? " | unique" : ""}`);
    });

    console.log("[INDEX] Dropping legacy indexes if they exist...");
    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`[INDEX] Dropped: ${indexName}`);
      } catch (error) {
        if (error?.codeName === "IndexNotFound" || /index not found/i.test(String(error.message || ""))) {
          console.log(`[INDEX] Not found, skipped: ${indexName}`);
        } else {
          throw error;
        }
      }
    }

    console.log("[INDEX] Creating updated indexes...");

    await collection.createIndex(
      { branch: 1, admissionYear: 1, division: 1, rollNo: 1 },
      { unique: true, name: "unique_student_per_class" }
    );
    console.log("[INDEX] Created: unique_student_per_class");

    await collection.createIndex(
      { branch: 1, year: 1, division: 1, status: 1 },
      { name: "branch_1_year_1_division_1_status_1" }
    );
    console.log("[INDEX] Ensured: branch_1_year_1_division_1_status_1");

    await collection.createIndex(
      { academicYear: 1, status: 1 },
      { name: "academicYear_1_status_1" }
    );
    console.log("[INDEX] Ensured: academicYear_1_status_1");

    const finalIndexes = await collection.indexes();
    console.log("[INDEX] Final indexes:");
    finalIndexes.forEach((index) => {
      console.log(`[INDEX] - ${index.name}: ${JSON.stringify(index.key)}${index.unique ? " | unique" : ""}`);
    });

    console.log("[INDEX] Student index update script completed.");
  } catch (error) {
    console.error("[INDEX ERROR]", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

updateStudentIndexes();
