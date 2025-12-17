import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // WHO the user is
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
    },

    // Basic identity
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
    },

    // Password is stored ENCRYPTED
    passwordHash: {
      type: String,
      required: true,
    },

    // Student-specific fields (from plan)
    branch: String,
    year: Number,
    division: String,
    rollNo: Number,

     // Password reset
    resetOTP: String,
    resetOTPExpiry: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
