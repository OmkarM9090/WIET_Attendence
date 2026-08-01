import mongoose from "mongoose";

const rollRangeSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      trim: true,
    },
    to: {
      type: String,
      trim: true,
    },
    division: {
      type: String,
      trim: true,
      uppercase: true,
    },
  },
  { _id: false }
);

const batchSchema = new mongoose.Schema(
  {
    // Canonical batch name, for example: BA1, BA3-BB1
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional friendly label for future UI use
    displayName: {
      type: String,
      trim: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    year: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },

    // Legacy single-division field kept for backward compatibility
    division: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    // New multi-division support for merged batches
    divisions: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],

    academicYear: {
      type: String,
      trim: true,
    },

    admissionYear: {
      type: Number,
      min: 2000,
      max: 2100,
    },

    // Source of truth for batch membership
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    batchType: {
      type: String,
      enum: ["regular", "merged", "custom"],
      default: "regular",
    },

    isMerged: {
      type: Boolean,
      default: false,
    },

    maxCapacity: {
      type: Number,
      min: 1,
    },

    labRoom: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    rollRanges: [rollRangeSchema],

    isActive: {
      type: Boolean,
      default: true,
    },

    // Auto creation tracking
    autoCreated: {
      type: Boolean,
      default: false,
    },

    // Soft Delete fields
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Audit fields for future admin tooling
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

batchSchema.pre("validate", function normalizeBatch(next) {
  if (typeof this.name === "string") {
    this.name = this.name.trim();
  }

  if (!this.displayName && this.name) {
    this.displayName = this.name;
  }

  if (typeof this.division === "string") {
    this.division = this.division.trim().toUpperCase();
  }

  if (!Array.isArray(this.divisions) || this.divisions.length === 0) {
    this.divisions = this.division ? [this.division] : [];
  } else {
    const normalizedDivisions = this.divisions
      .map((division) =>
        typeof division === "string" ? division.trim().toUpperCase() : division
      )
      .filter(Boolean);

    this.divisions = [...new Set(normalizedDivisions)];

    if (!this.division && this.divisions.length > 0) {
      this.division = this.divisions[0];
    }
  }

  if (this.divisions.length > 1) {
    this.isMerged = true;
    if (!this.batchType || this.batchType === "regular") {
      this.batchType = "merged";
    }
  }

  if (this.batchType === "merged") {
    this.isMerged = true;
  }

  if (Array.isArray(this.rollRanges)) {
    this.rollRanges = this.rollRanges
      .map((range) => ({
        from: range?.from ? String(range.from).trim() : undefined,
        to: range?.to ? String(range.to).trim() : undefined,
        division: range?.division
          ? String(range.division).trim().toUpperCase()
          : undefined,
      }))
      .filter((range) => range.from || range.to || range.division);
  }

  next();
});

/**
 * Helpful lookup for a class scope.
 * Returns active, non-deleted batches for the given class context.
 */
batchSchema.statics.findForClass = function findForClass(
  branchId,
  year,
  division,
  academicYear
) {
  const normalizedDivision = division ? String(division).trim().toUpperCase() : "";
  const query = {
    branch: branchId,
    year: Number(year),
    isDeleted: { $ne: true },
  };

  if (academicYear) {
    query.academicYear = academicYear;
  }

  if (normalizedDivision) {
    query.$or = [{ division: normalizedDivision }, { divisions: normalizedDivision }];
  }

  return this.find(query).sort({ name: 1 });
};

/**
 * Reverse lookup for all batches a student belongs to.
 * Works with the new many-to-many model and legacy student.batch data.
 */
batchSchema.statics.findByStudent = async function findByStudent(studentId) {
  const Student = mongoose.model("Student");
  const student = await Student.findById(studentId)
    .select("batch practicalBatches")
    .lean();

  const batchIds = new Set();

  const addBatchId = (value) => {
    if (!value) return;
    batchIds.add(String(value));
  };

  if (student) {
    addBatchId(student.batch);

    if (Array.isArray(student.practicalBatches)) {
      student.practicalBatches.forEach(addBatchId);
    }
  }

  const directBatches = await this.find({
    students: studentId,
    isDeleted: { $ne: true },
  }).sort({ name: 1 });

  directBatches.forEach((batch) => addBatchId(batch._id));

  if (batchIds.size === 0) {
    return directBatches;
  }

  return this.find({
    _id: { $in: [...batchIds] },
    isDeleted: { $ne: true },
  }).sort({ name: 1 });
};

/**
 * Checks whether a student can be added to a batch.
 * Keeps backward compatibility with legacy single-batch data.
 */
batchSchema.statics.canAcceptStudent = async function canAcceptStudent(
  batchId,
  studentId
) {
  const Student = mongoose.model("Student");
  const batch = await this.findById(batchId).lean();
  const student = await Student.findById(studentId)
    .select("branch year division academicYear batch practicalBatches")
    .lean();

  if (!batch || batch.isDeleted || batch.isActive === false) {
    return false;
  }

  if (!student) {
    return false;
  }

  const studentDivision = String(student.division || "").trim().toUpperCase();
  const batchDivisions = Array.isArray(batch.divisions) && batch.divisions.length > 0
    ? batch.divisions.map((value) => String(value || "").trim().toUpperCase()).filter(Boolean)
    : [String(batch.division || "").trim().toUpperCase()].filter(Boolean);

  if (String(batch.branch) !== String(student.branch)) {
    return false;
  }

  if (Number(batch.year) !== Number(student.year)) {
    return false;
  }

  if (batchDivisions.length > 0 && !batchDivisions.includes(studentDivision)) {
    return false;
  }

  if (batch.academicYear && student.academicYear && batch.academicYear !== student.academicYear) {
    return false;
  }

  const alreadyLinked =
    String(student.batch || "") === String(batch._id) ||
    (Array.isArray(student.practicalBatches) &&
      student.practicalBatches.some((value) => String(value) === String(batch._id))) ||
    Array.isArray(batch.students) && batch.students.some((value) => String(value) === String(studentId));

  if (alreadyLinked) {
    return true;
  }

  if (batch.maxCapacity && Array.isArray(batch.students) && batch.students.length >= batch.maxCapacity) {
    return false;
  }

  return true;
};

/**
 * Indexes:
 * - Unique batch name per class scope and academic year
 * - Reverse lookup for students in a batch
 * - Fast class-level lookup
 */
batchSchema.index(
  { branch: 1, year: 1, name: 1, academicYear: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: { $ne: true },
      academicYear: { $type: "string" },
    },
  }
);
batchSchema.index({ branch: 1, year: 1, division: 1, academicYear: 1, isDeleted: 1 });
batchSchema.index({ branch: 1, year: 1, divisions: 1, academicYear: 1, isDeleted: 1 });
batchSchema.index({ students: 1 });

export default mongoose.model("Batch", batchSchema);
