import Branch from "../models/Branch.js";
import Subject from "../models/Subject.js";

/* CREATE BRANCH */
export const createBranch = async (req, res) => {
  const branch = await Branch.create(req.body);
  res.status(201).json(branch);
};

/* GET ALL BRANCHES */
export const getBranches = async (req, res) => {
  const branches = await Branch.find();
  res.json(branches);
};

/* CREATE SUBJECT */
export const createSubject = async (req, res) => {
  const subject = await Subject.create(req.body);
  res.status(201).json(subject);
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
