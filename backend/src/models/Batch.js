// models/Batch.js
import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true }, // TB1, TB2
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  year: { type: Number, required: true },
  division: { type: String, required: true },
  academicYear: { type: String }, // To track which year this batch belongs to
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  
  // Auto creation tracking
  autoCreated: {
    type: Boolean,
    default: false // true if created via Excel upload auto-creation
  },
  
  // Soft Delete fields
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Batch", batchSchema);
