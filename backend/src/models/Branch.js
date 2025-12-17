import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Computer, Mechanical
    },

    code: {
      type: String,
      required: true, // COMP, MECH
      unique: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Branch", branchSchema);
