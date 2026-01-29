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
    branch: branch._id
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
      teacher: teacher._id,
      subject: subject._id,
      branch: branch._id,
      year: 3,
      division: "A"
    },
    {
      teacher: teacher._id,
      subject: subject._id,
      branch: branch._id,
      year: 3,
      division: "B"
    }
  ]);

  return { user, teacher, branch, subject, assignments, password };
};
