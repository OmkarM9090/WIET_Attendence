import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { transporter } from "../utils/mailer.js";

/* JWT TOKEN */
const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

/* LOGIN */
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch)
    return res.status(400).json({ message: "Invalid password" });

  res.json({
    token: generateToken(user),
    role: user.role,
    name: user.name,
  });
};

/* REGISTER (ADMIN ONLY) */
// export const register = async (req, res) => {
//   const { name, email, password, role, branch, year, division, rollNo } =
//     req.body;

//   const passwordHash = await bcrypt.hash(password, 10);

//   await User.create({
//     name,
//     email,
//     passwordHash,
//     role,
//     branch,
//     year,
//     division,
//     rollNo,
//   });

//   res.status(201).json({ message: "User created successfully" });
// };

/* REGISTER (ADMIN ONLY) */
export const register = async (req, res) => {
  const { name, email, password, role = "admin" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, password required" });
  }

  // Only allow creating admins here; student/teacher are created via their admin controllers
  if (role !== "admin") {
    return res.status(400).json({ message: "Use dedicated endpoints to create students or teachers" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    passwordHash,
    role: "admin",
  });

  res.status(201).json({ message: "Admin user created successfully" });
};

/* FORGOT PASSWORD */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  user.resetOTP = hashedOTP;
  user.resetOTPExpiry = Date.now() + 10 * 60 * 1000;
  await user.save();

  try {
    await transporter.sendMail({
      to: email,
      subject: "Password Reset OTP",
      html: `<h3>Your OTP: ${otp}</h3><p>Valid for 10 minutes</p>`,
    });
  } catch (error) {
    console.warn("Email sending failed, but OTP saved:", error.message);
    // For development, log OTP to console
    console.log("📧 Development Mode - OTP for", email, ":", otp);
  }

  res.json({ message: "OTP sent to email" });
};

/* RESET PASSWORD */
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  const user = await User.findOne({
    email,
    resetOTP: hashedOTP,
    resetOTPExpiry: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired OTP" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetOTP = undefined;
  user.resetOTPExpiry = undefined;

  await user.save();

  res.json({ message: "Password reset successful" });
};
