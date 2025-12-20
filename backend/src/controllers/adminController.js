import Branch from "../models/Branch.js";
import Subject from "../models/Subject.js";

/* CREATE BRANCH */
export const createBranch = async (req, res) => {

  console.log("USER:", req.user);
  console.log("BODY:", req.body);

  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Name and code are required" });
    }

    const existing = await Branch.findOne({
      $or: [{ name }, { code }]
    });

    if (existing) {
      return res.status(400).json({ message: "Branch already exists" });
    }

    const branch = await Branch.create({ name, code });

    res.status(201).json(branch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



/* GET ALL BRANCHES */
export const getBranches = async (req, res) => {
  const branches = await Branch.find();
  res.json(branches);
};

/* CREATE SUBJECT */
export const createSubject = async (req, res) => {
  try {
    const { name, code, branch, semester } = req.body;

    if (!name || !code || !branch || !semester) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const subject = await Subject.create({
      name,
      code,
      branch,
      semester,
    });

    res.status(201).json(subject);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* GET SUBJECTS (FILTERABLE) */
export const getSubjects = async (req, res) => {
  const { branch, semester } = req.query;

  const filter = {};
  if (branch) filter.branch = branch;
  if (semester) filter.semester = semester;

  const subjects = await Subject.find(filter).populate("branch");
  res.json(subjects);
};
