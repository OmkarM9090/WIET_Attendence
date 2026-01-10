// models/Batch.js
import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true }, // TB1, TB2
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  year: Number,
  division: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }]
});

export default mongoose.model("Batch", batchSchema);
