import mongoose from "mongoose";
import dotenv from "dotenv";
import { updateMonthlyAttendanceExcel } from "./src/utils/updateMonthlyAttendanceExcel.js";
import AttendanceSession from "./src/models/AttendanceSession.js";

dotenv.config();

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/attendance_system");
    console.log("Connected to DB");

    // Fetch the most recent attendance session
    const session = await AttendanceSession.findOne().sort({ createdAt: -1 }).lean();
    
    if (!session) {
      console.log("No attendance sessions found");
      process.exit(0);
    }

    console.log(`Testing with AttendanceSession ID: ${session._id}`);

    const studentsRaw = await mongoose.model("Student").find({
      branch: session.branch,
      year: session.year,
      division: session.division,
      status: "active",
      academicYear: session.academicYear,
    }).lean();

    console.log("Students found without date filter:", studentsRaw.length);

    if (studentsRaw.length > 0) {
      console.log("First student admissionDate:", studentsRaw[0].admissionDate);
      console.log("Session date:", session.date);
    }

    // This replicates what excelController does
    const result = await updateMonthlyAttendanceExcel(session);
    
    console.log("Result:", result);

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTest();
