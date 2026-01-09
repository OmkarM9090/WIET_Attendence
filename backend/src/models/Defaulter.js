import mongoose from "mongoose";

const defaulterSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: false
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true
    },

    year: {
      type: Number,
      required: true
    },

    division: {
      type: String,
      required: true
    },

    periodStart: {
      type: Date,
      required: true
    },

    periodEnd: {
      type: Date,
      required: true
    },

    thresholdPercent: {
      type: Number,
      default: 75
    },

    list: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student"
        },
        rollNo: Number,
        name: String,
        percentPresent: Number
      }
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Defaulter", defaulterSchema);
