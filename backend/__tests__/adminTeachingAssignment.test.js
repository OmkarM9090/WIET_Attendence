import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Branch from "../src/models/Branch.js";
import Subject from "../src/models/Subject.js";
import Batch from "../src/models/Batch.js";
import TeachingAssignment from "../src/models/TeachingAssignment.js";

describe("Admin TeachingAssignment APIs", () => {
  let adminToken;
  let teacherUser;
  let branch;
  let subject;
  let batch;

  beforeEach(async () => {
    const password = "adminpass123";
    const passwordHash = await bcrypt.hash(password, 10);

    const adminUser = await User.create({
      role: "admin",
      name: "Admin User",
      email: "admin@example.com",
      passwordHash,
    });

    teacherUser = await User.create({
      role: "teacher",
      name: "Teacher User",
      email: "teacher@example.com",
      passwordHash,
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: adminUser.email, password });

    adminToken = loginRes.body?.data?.token;

    branch = await Branch.create({
      name: "Computer Engineering",
      code: "CE",
    });

    subject = await Subject.create({
      name: "Data Structures",
      code: "DS",
      semester: 4,
      branch: branch._id,
      semesterStartDate: new Date("2025-06-01"),
      semesterEndDate: new Date("2025-11-30"),
    });

    batch = await Batch.create({
      name: "TB1",
      branch: branch._id,
      year: 2,
      division: "A",
    });
  });

  test("POST /api/admin/assign-teacher creates a lecture assignment", async () => {
    const payload = {
      teacherId: teacherUser._id,
      subjectId: subject._id,
      branchId: branch._id,
      year: 2,
      division: "A",
      dayOfWeek: "MONDAY",
      startTime: "14:00",
      endTime: "15:00",
      sessionType: "LECTURE",
      academicYear: "2025-2026",
    };

    const res = await request(app)
      .post("/api/admin/assign-teacher")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.sessionType).toBe("LECTURE");
    expect(res.body.data.teacherId).toBe(String(teacherUser._id));
  });

  test("POST /api/admin/assign-teacher rejects practical without batchId", async () => {
    const payload = {
      teacherId: teacherUser._id,
      subjectId: subject._id,
      branchId: branch._id,
      year: 2,
      division: "A",
      dayOfWeek: "MONDAY",
      startTime: "10:00",
      endTime: "11:00",
      sessionType: "PRACTICAL",
      academicYear: "2025-2026",
    };

    const res = await request(app)
      .post("/api/admin/assign-teacher")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  test("POST /api/admin/assign-teacher prevents overlapping slots for same teacher", async () => {
    await TeachingAssignment.create({
      teacherId: teacherUser._id,
      subjectId: subject._id,
      branchId: branch._id,
      year: 2,
      division: "A",
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "10:00",
      sessionType: "LECTURE",
      academicYear: "2025-2026",
    });

    const payload = {
      teacherId: teacherUser._id,
      subjectId: subject._id,
      branchId: branch._id,
      year: 2,
      division: "A",
      dayOfWeek: "MONDAY",
      startTime: "09:30",
      endTime: "10:30",
      sessionType: "LECTURE",
      academicYear: "2025-2026",
    };

    const res = await request(app)
      .post("/api/admin/assign-teacher")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(409);
  });

  test("GET /api/admin/teacher-assignments returns populated assignments", async () => {
    await TeachingAssignment.create([
      {
        teacherId: teacherUser._id,
        subjectId: subject._id,
        branchId: branch._id,
        year: 2,
        division: "A",
        dayOfWeek: "TUESDAY",
        startTime: "10:00",
        endTime: "11:00",
        sessionType: "LECTURE",
        academicYear: "2025-2026",
      },
      {
        teacherId: teacherUser._id,
        subjectId: subject._id,
        branchId: branch._id,
        year: 2,
        division: "A",
        batchId: batch._id,
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "10:00",
        sessionType: "PRACTICAL",
        academicYear: "2025-2026",
      },
    ]);

    const res = await request(app)
      .get("/api/admin/teacher-assignments")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].dayOfWeek).toBe("MONDAY");
    expect(res.body.data[0].teacherId).toHaveProperty("email");
    expect(res.body.data[0].subjectId).toHaveProperty("code");
    expect(res.body.data[0].branchId).toHaveProperty("name");
  });
});
