import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminStudentRoutes from "./routes/adminStudentRoutes.js";
import adminTeacherRoutes from "./routes/adminTeacherRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminStudentRoutes);
app.use("/api/admin", adminTeacherRoutes);


export default app;
