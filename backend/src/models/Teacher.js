import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    designation: {
      type: String,
      default: "Assistant Professor",
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Teacher", teacherSchema);


// Why separate Teacher schema?
// Teacher may change department
// Teacher may go inactive
// Teaching assignments change every semester
// Login data stays stable