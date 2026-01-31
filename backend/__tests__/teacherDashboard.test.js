import request from "supertest";
import app from "../src/app.js";
import { seedTeacher } from "../test/utils/seedTeacher.js";

describe("Teacher dashboard API", () => {
  let teacher;
  let token;
  let password;
  let user;

  beforeEach(async () => {
    const seed = await seedTeacher();
    teacher = seed.teacher;
    user = seed.user;
    password = seed.password;

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password });

    token = loginRes.body?.data?.token;
  });

  test("GET /api/teacher/me returns teacher profile", async () => {
    const res = await request(app)
      .get("/api/teacher/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.userId.email).toBe(user.email);
    expect(res.body.data.department.code).toBe("CE");
  });

  test("GET /api/teacher/assignments/:teacherId returns assignments", async () => {
    const res = await request(app)
      .get(`/api/teacher/assignments/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].subjectId).toHaveProperty("code");
    expect(res.body.data[0].branchId).toHaveProperty("code");
  });
});
