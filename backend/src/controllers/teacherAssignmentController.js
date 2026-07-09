// Admin controller for managing teaching assignments (timetable slots)
// Responsible for creating and listing assignments with validation.

import TeachingAssignment from "../models/TeachingAssignment.js";
import User from "../models/User.js";

const DAY_ORDER = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
];

const toMinutes = (timeStr) => {
	const [hours, minutes] = String(timeStr).split(":").map(Number);
	if (Number.isNaN(hours) || Number.isNaN(minutes)) {
		return null;
	}
	return hours * 60 + minutes;
};

const getCurrentAcademicStartYear = () => {
	const now = new Date();
	const month = now.getMonth();
	const year = now.getFullYear();
	return month >= 5 ? year : year - 1;
};

const parseAcademicYear = (academicYear) => {
	const match = /^\d{4}-\d{4}$/.exec(String(academicYear));
	if (!match) {
		return null;
	}
	const [startStr, endStr] = academicYear.split("-");
	const startYear = Number(startStr);
	const endYear = Number(endStr);
	if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
		return null;
	}
	if (endYear !== startYear + 1) {
		return null;
	}
	return { startYear, endYear };
};

/**
 * Create a new teaching assignment (timetable slot).
 */
export const createTeachingAssignment = async (req, res) => {
	try {
		const {
			teacherId,
			subjectId,
			branchId,
			year,
			division,
			batchId,
			dayOfWeek,
			startTime,
			endTime,
			sessionType,
			academicYear,
		} = req.body;

		// Required fields validation
		if (
			!teacherId ||
			!subjectId ||
			!branchId ||
			!year ||
			!division ||
			!dayOfWeek ||
			!startTime ||
			!endTime ||
			!sessionType ||
			!academicYear
		) {
			return res.status(400).json({
				message: "All required fields must be provided.",
			});
		}

		// Session type rules for batch
		if (sessionType === "PRACTICAL" && !batchId) {
			return res.status(400).json({
				message: "batchId is required for PRACTICAL sessions.",
			});
		}

		if (sessionType === "LECTURE" && batchId) {
			return res.status(400).json({
				message: "batchId must not be provided for LECTURE sessions.",
			});
		}

		// Validate teacher role
		const teacherUser = await User.findById(teacherId).select("role name email");
		if (!teacherUser || teacherUser.role !== "teacher") {
			return res.status(400).json({
				message: "teacherId must belong to a user with role 'teacher'.",
			});
		}

		// Academic year validation (current or future)
		const parsedYear = parseAcademicYear(academicYear);
		if (!parsedYear) {
			return res.status(400).json({
				message: "academicYear must be in format YYYY-YYYY and valid.",
			});
		}
		const currentStartYear = getCurrentAcademicStartYear();
		if (parsedYear.startYear < currentStartYear) {
			return res.status(400).json({
				message: "academicYear must be current or future.",
			});
		}

		// Time validation
		const startMinutes = toMinutes(startTime);
		const endMinutes = toMinutes(endTime);
		if (startMinutes == null || endMinutes == null) {
			return res.status(400).json({
				message: "startTime and endTime must be in HH:mm format.",
			});
		}
		if (endMinutes <= startMinutes) {
			return res.status(400).json({
				message: "endTime must be after startTime.",
			});
		}

		// Prevent overlapping time slots for same teacher on same day
		const existingSlots = await TeachingAssignment.find({
			teacherId,
			dayOfWeek,
			academicYear,
			isActive: true,
		}).select("startTime endTime");

		const hasOverlap = existingSlots.some((slot) => {
			const slotStart = toMinutes(slot.startTime);
			const slotEnd = toMinutes(slot.endTime);
			if (slotStart == null || slotEnd == null) {
				return false;
			}
			return startMinutes < slotEnd && endMinutes > slotStart;
		});

		if (hasOverlap) {
			return res.status(409).json({
				message: "Overlapping time slot detected for the teacher.",
			});
		}

		const assignment = await TeachingAssignment.create({
			teacherId,
			subjectId,
			branchId,
			year,
			division,
			batchId: batchId || undefined,
			dayOfWeek,
			startTime,
			endTime,
			sessionType,
			academicYear,
		});

		return res.status(201).json({
			message: "Teaching assignment created successfully.",
			data: assignment,
		});
	} catch (error) {
		if (error && error.code === 11000) {
			return res.status(409).json({
				message: "Duplicate assignment already exists.",
			});
		}
		return res.status(500).json({
			message: "Failed to create teaching assignment.",
			error: error.message,
		});
	}
};

/**
 * Get all teaching assignments with populated references.
 */
export const getTeachingAssignments = async (req, res) => {
	try {
		const assignments = await TeachingAssignment.find()
			.populate("teacherId", "name email")
			.populate("subjectId", "name code")
			.populate("branchId", "name")
			.populate("batchId", "name");

		const sorted = assignments.sort((a, b) => {
			const dayA = DAY_ORDER.indexOf(a.dayOfWeek);
			const dayB = DAY_ORDER.indexOf(b.dayOfWeek);
			if (dayA !== dayB) {
				return dayA - dayB;
			}
			const startA = toMinutes(a.startTime) ?? 0;
			const startB = toMinutes(b.startTime) ?? 0;
			return startA - startB;
		});

		return res.status(200).json({
			message: "Teaching assignments fetched successfully.",
			data: sorted,
		});
	} catch (error) {
		return res.status(500).json({
			message: "Failed to fetch teaching assignments.",
			error: error.message,
		});
	}
};

/**
 * GET MY TEACHING ASSIGNMENTS (For Teacher Dashboard)
 * Fetches all active teaching assignments for logged-in teacher
 * Used in attendance marking dropdown
 * 
 * Route: GET /api/teacher/my-assignments
 * Access: Protected - Teacher only
 */
export const getMyTeachingAssignments = async (req, res) => {
	try {
		// Get teacher ID from JWT token
		const teacherId = req.user.id;

		// We will fetch all active assignments for this teacher
		// regardless of hardcoded academic year, to avoid missing data.
		const query = {
			teacherId: teacherId,
			isActive: true,
		};

		if (req.query.academicYear) {
			query.academicYear = req.query.academicYear;
		}

		// Fetch all active teaching assignments for this teacher
		const assignments = await TeachingAssignment.find(query)
			.populate("subjectId", "name code") // Get subject name and code
			.populate("branchId", "name code") // Get branch name and code
			.populate("batchId", "name") // Get batch name for practicals
			.lean();

		// Sort assignments by day order and time
		const sortedAssignments = assignments.sort((a, b) => {
			const dayA = DAY_ORDER.indexOf(a.dayOfWeek);
			const dayB = DAY_ORDER.indexOf(b.dayOfWeek);
			if (dayA !== dayB) {
				return dayA - dayB;
			}
			const startA = toMinutes(a.startTime) ?? 0;
			const startB = toMinutes(b.startTime) ?? 0;
			return startA - startB;
		});

		// Format response
		const formattedAssignments = sortedAssignments.map((assignment) => ({
			_id: assignment._id,
			subject: {
				_id: assignment.subjectId?._id,
				name: assignment.subjectId?.name || "Unknown Subject",
				code: assignment.subjectId?.code || "N/A",
			},
			branch: {
				_id: assignment.branchId?._id,
				name: assignment.branchId?.name || "Unknown Branch",
				code: assignment.branchId?.code || "N/A",
			},
			year: assignment.year,
			division: assignment.division,
			batch: assignment.batchId
				? {
						_id: assignment.batchId._id,
						name: assignment.batchId.name,
					}
				: null,
			sessionType: assignment.sessionType,
			dayOfWeek: assignment.dayOfWeek,
			startTime: assignment.startTime,
			endTime: assignment.endTime,
			academicYear: assignment.academicYear,
		}));

		res.status(200).json({
			success: true,
			count: formattedAssignments.length,
			data: formattedAssignments,
		});
	} catch (error) {
		console.error("GET MY TEACHING ASSIGNMENTS ERROR:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch teaching assignments",
			error: error.message,
		});
	}
};
