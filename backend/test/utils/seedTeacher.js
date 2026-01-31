import bcrypt from "bcryptjs";
import User from "../../src/models/User.js";
import Teacher from "../../src/models/Teacher.js";
import Branch from "../../src/models/Branch.js";
import Subject from "../../src/models/Subject.js";
import TeachingAssignment from "../../src/models/TeachingAssignment.js";

export const seedTeacher = async () => {
  const password = "password123";
  const passwordHash = await bcrypt.hash(password, 10);

  const branch = await Branch.create({
    name: "Computer Engineering",
    code: "CE"
  });

  const subject = await Subject.create({
    name: "Database Systems",
    code: "DBS",
    semester: 5,
    branch: branch._id,
    semesterStartDate: new Date("2025-06-01"),
    semesterEndDate: new Date("2025-11-30")
  });

  const user = await User.create({
    role: "teacher",
    name: "Test Teacher",
    email: "teacher.test@example.com",
    passwordHash
  });

  const teacher = await Teacher.create({
    userId: user._id,
    department: branch._id,
    designation: "Assistant Professor",
    status: "active"
  });

  const assignments = await TeachingAssignment.create([
    {
      teacherId: user._id,
      subjectId: subject._id,
      branchId: branch._id,
      year: 3,
      division: "A",
      dayOfWeek: "MONDAY",
      startTime: "10:00",
      endTime: "11:00",
      sessionType: "LECTURE",
      academicYear: "2025-2026"
    },
    {
      teacherId: user._id,
      subjectId: subject._id,
      branchId: branch._id,
      year: 3,
      division: "B",
      dayOfWeek: "TUESDAY",
      startTime: "11:00",
      endTime: "12:00",
      sessionType: "LECTURE",
      academicYear: "2025-2026"
    }
  ]);

  return { user, teacher, branch, subject, assignments, password };
};
