import { generateDefaulterExcel } from "../utils/defaulterExcel.js";
import Subject from "../models/Subject.js";

/**
 * EXPORT DEFAULTER LIST TO EXCEL
 * 
 * ENHANCED WITH:
 * - Metadata (academic year, semester, date range, threshold)
 * - Rich formatting
 */
export const exportDefaulterExcel = async (req, res) => {
  try {
    const { 
      defaulters, 
      academicYear, 
      semester, 
      startDate, 
      endDate, 
      threshold,
      branchId 
    } = req.body;

    // Validate input
    if (!defaulters || !Array.isArray(defaulters)) {
      return res.status(400).json({
        success: false,
        message: "Defaulters array is required"
      });
    }

    // Fetch subjects
    const subjectQuery = branchId ? { branch: branchId } : {};
    const subjects = await Subject.find(subjectQuery);

    // Prepare metadata
    const metadata = {
      academicYear: academicYear || "N/A",
      semester: semester || "All",
      dateRange: {
        startDate: startDate || "N/A",
        endDate: endDate || "N/A"
      },
      threshold: threshold || 75
    };

    // Generate workbook
    const workbook = await generateDefaulterExcel(defaulters, subjects, metadata);

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Defaulter_List_${academicYear || "All"}_Sem${semester || "All"}.xlsx`
    );

    // Write and send
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("EXCEL EXPORT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Excel file",
      error: error.message
    });
  }
};
