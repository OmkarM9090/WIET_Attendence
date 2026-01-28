import { useEffect, useState } from "react";
import { theme } from "../styles/theme";
import DashboardLayout from "../components/DashboardLayout";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Alert from "../components/Alert";
import Table from "../components/Table";
import { getBranches } from "../services/adminService";
import { getDefaultersReport } from "../services/attendanceService";
import axiosInstance from "../utils/axios";

export default function DefaulterManagement() {
  // Data
  const [branches, setBranches] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filters
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [division, setDivision] = useState("");
  const [academicYear, setAcademicYear] = useState("");  // Academic Year
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [threshold, setThreshold] = useState("75");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const sidebarItems = [
    { label: "Dashboard", path: "/admin", icon: "🏠" },
    { label: "Branches", path: "/admin/branches", icon: "🌿" },
    { label: "Subjects", path: "/admin/subjects", icon: "📘" },
    { label: "Students", path: "/admin/students", icon: "🎓" },
    { label: "Teachers", path: "/admin/teachers", icon: "👩‍🏫" },
    { label: "Reports", path: "/admin/defaulters", icon: "📊" },
  ];

  useEffect(() => {
    const init = async () => {
      try {
        const branchesRes = await getBranches();
        setBranches(branchesRes);
      } catch (err) {
        // non-blocking
      }
    };
    init();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const filters = {
        branchId: branch,
        year: Number(year),
        division,
        academicYear,  // Include academic year
        startDate,
        endDate,
        threshold: Number(threshold),
      };

      const res = await getDefaultersReport(filters);
      setDefaulters(res.defaulters || []);
      setSubjects(res.subjects || []);
      setSuccess(`Generated report: ${res.defaulters?.length || 0} defaulters found`);
    } catch (err) {
      setError(err.message || "Failed to generate defaulters report");
      setDefaulters([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (defaulters.length === 0) {
      setError("Generate a report first before exporting");
      return;
    }

    try {
      setExportingPdf(true);
      setError("");

      const selectedBranch = branches.find((b) => b._id === branch);
      const meta = {
        branch: selectedBranch?.name || "N/A",
        year,
        division,
        academicYear: academicYear || "N/A",  // Include in PDF
        startDate,
        endDate,
        threshold,
      };

      const response = await axiosInstance.post(
        "/defaulters/pdf",
        { defaulters, subjects, meta },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Defaulters_${division}_${year}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess("PDF exported successfully");
    } catch (err) {
      setError(err.message || "Failed to export PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    if (defaulters.length === 0) {
      setError("Generate a report first before exporting");
      return;
    }

    try {
      setExportingExcel(true);
      setError("");

      const response = await axiosInstance.post(
        "/defaulters/export",
        { defaulters },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Defaulters_${division}_${year}_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess("Excel exported successfully");
    } catch (err) {
      setError(err.message || "Failed to export Excel");
    } finally {
      setExportingExcel(false);
    }
  };

  // Build dynamic columns from subjects
  const buildColumns = () => {
    const cols = [
      { header: "Roll No", accessor: "rollNo" },
      { header: "Name", accessor: "name" },
      { header: "Batch", accessor: "batch" },
    ];

    if (subjects && subjects.length > 0) {
      subjects.forEach((sub) => {
        cols.push({
          header: sub.code,
          accessor: "subjects",
          render: (val) => {
            const subData = val?.[sub.code];
            return subData ? `${subData.total}%` : "-";
          },
        });
      });
    }

    cols.push({ header: "Remark", accessor: "remark" });
    return cols;
  };

  return (
    <DashboardLayout
      title="Defaulters Report"
      subtitle="Generate attendance defaulters report with filters"
      sidebarItems={sidebarItems}
    >
      {/* Alerts */}
      <div className="mb-4 space-y-2">
        {error && <Alert message={error} type="error" onClose={() => setError("")} />}
        {success && <Alert message={success} type="success" onClose={() => setSuccess("")} />}
      </div>

      {/* Filters Form */}
      <section
        className="mb-6 rounded-lg border p-6"
        style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}
      >
        <h3 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
          Filters
        </h3>

        <form onSubmit={handleGenerateReport}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormSelect
              label="Branch"
              name="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              options={[
                { label: "Select Branch", value: "" },
                ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id })),
              ]}
              required
            />
            <FormSelect
              label="Year"
              name="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={[
                { label: "Select Year", value: "" },
                { label: "FE (1)", value: "1" },
                { label: "SE (2)", value: "2" },
                { label: "TE (3)", value: "3" },
                { label: "BE (4)", value: "4" },
              ]}
              required
            />
            <FormSelect
              label="Division"
              name="division"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              options={[
                { label: "Select Division", value: "" },
                { label: "A", value: "A" },
                { label: "B", value: "B" },
                { label: "C", value: "C" },
              ]}
              required
            />
            <FormInput
              label="Academic Year"
              name="academicYear"
              placeholder="e.g., 2024-2025"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              required
            />
            <FormInput
              label="Start Date"
              name="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <FormInput
              label="End Date"
              name="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            <FormInput
              label="Threshold (%)"
              name="threshold"
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="75"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate Report"}
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={exportingPdf || defaulters.length === 0}>
              {exportingPdf ? "Exporting..." : "Export PDF"}
            </Button>
            <Button variant="outline" onClick={handleExportExcel} disabled={exportingExcel || defaulters.length === 0}>
              {exportingExcel ? "Exporting..." : "Export Excel"}
            </Button>
          </div>
        </form>
      </section>

      {/* Defaulters Table */}
      <div>
        <h4 className="mb-3 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
          Defaulters List ({defaulters.length})
        </h4>
        <Table
          columns={buildColumns()}
          data={defaulters}
          emptyMessage={loading ? "Loading defaulters..." : "No defaulters found. Generate a report to see data."}
          actions={() => null}
        />
      </div>
    </DashboardLayout>
  );
}
