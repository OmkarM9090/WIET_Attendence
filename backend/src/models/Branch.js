import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    // Soft Delete fields
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

/**
 * CASCADE DELETE HOOKS
 * Hard deletion: When a branch is permanently deleted, clean up references.
 */
branchSchema.pre("findOneAndDelete", async function (next) {
  const branchId = this.getQuery()["_id"];
  if (branchId) {
    try {
      // Import models here to avoid circular dependency issues at file load time
      const Subject = mongoose.model("Subject");
      const Batch = mongoose.model("Batch");
      const Student = mongoose.model("Student");
      const TeachingAssignment = mongoose.model("TeachingAssignment");
      const AttendanceSession = mongoose.model("AttendanceSession");

      console.log(`[CASCADE] Hard deleting records for Branch: ${branchId}`);
      
      await Subject.deleteMany({ branch: branchId });
      await Batch.deleteMany({ branch: branchId });
      await Student.deleteMany({ branch: branchId });
      await TeachingAssignment.deleteMany({ branch: branchId });
      await AttendanceSession.deleteMany({ branch: branchId });
    } catch (err) {
      console.error(`[CASCADE ERROR] Failed to cascade delete for Branch: ${branchId}`, err);
    }
  }
  next();
});

export default mongoose.model("Branch", branchSchema);
