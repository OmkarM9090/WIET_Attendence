import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });


export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS?.replace(/\s/g, ''), // Remove spaces from password
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates (for development)
  }
});

// Verify connection on startup (but don't crash if it fails)
transporter.verify((error, success) => {
  if (error) {
    console.warn(
      "⚠️  Email service not available (forgot password will not work):",
      error.message
    );
  } else {
    console.log("✓ Email service verified and ready");
  }
});
