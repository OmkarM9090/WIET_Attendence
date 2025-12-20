import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    // Auth-only fields
    resetOTP: String,
    resetOTPExpiry: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
