import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminStudentRoutes from "./routes/adminStudentRoutes.js";
import adminTeacherRoutes from "./routes/adminTeacherRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import studentAttendanceRoutes from "./routes/studentAttendanceRoutes.js";
import defaulterRoutes from "./routes/defaulterRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminStudentRoutes);
app.use("/api/admin", adminTeacherRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/student", studentAttendanceRoutes);
app.use("/api/defaulters", defaulterRoutes);
app.use("/api/reports", defaulterRoutes);




export default app;
