import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    rollNo: {
      type: Number,
      required: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    year: {
      type: Number,
      enum: [1, 2, 3, 4], // FE, SE, TE, BE
      required: true,
    },

    division: {
      type: String,
      enum: ["A", "B", "C"],
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "dropped"],
      default: "active",
    },

    admissionYear: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
