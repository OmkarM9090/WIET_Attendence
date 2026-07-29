import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Alert from "../components/Alert";
import Table from "../components/Table";
import { getBranches } from "../services/adminService";
import { getDefaultersReport } from "../services/attendanceService";
import axiosInstance from "../utils/axios";
import { 
  LayoutDashboard, 
  Building2, 
  BookOpen, 
  GraduationCap, 
  Users, 
  FileText, 
  AlertTriangle,
  Download,
  Filter,
  FileSpreadsheet
} from "lucide-react";

export default function DefaulterManagement() {
  const [branches, setBranches] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [division, setDivision] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [threshold, setThreshold] = useState("75");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const sidebarItems = [
    { label: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} /> },
    { label: "Branches", path: "/admin/branches", icon: <Building2 size={18} /> },
    { label: "Subjects", path: "/admin/subjects", icon: <BookOpen size={18} /> },
    { label: "Students", path: "/admin/students", icon: <GraduationCap size={18} /> },
    { label: "Teachers", path: "/admin/teachers", icon: <Users size={18} /> },
    { label: "Reports", path: "/admin/defaulters", icon: <AlertTriangle size={18} /> },
  ];

  useEffect(() => {
    const init = async () => {
      try {
        const branchesRes = await getBranches();
        setBranches(branchesRes);
      } catch (err) {}
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
        academicYear,
        startDate,
        endDate,
        threshold: Number(threshold),
      };

      const res = await getDefaultersReport(filters);
      setDefaulters(res.defaulters || []);
      setSubjects(res.subjects || []);
      setSuccess(`Report generated: ${res.defaulters?.length || 0} defaulters identified`);
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
        academicYear: academicYear || "N/A",
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

  const buildColumns = () => {
    const cols = [
      { 
        header: "Roll No", 
        accessor: "rollNo",
        render: (val) => <span className="font-mono text-xs font-bold text-slate-800">{val}</span>
      },
      { 
        header: "Name", 
        accessor: "name",
        render: (val) => <span className="font-bold text-slate-900">{val}</span>
      },
      { header: "Batch", accessor: "batch" },
    ];

    if (subjects && subjects.length > 0) {
      subjects.forEach((sub) => {
        cols.push({
          header: sub.code,
          accessor: "subjects",
          render: (val) => {
            const subData = val?.[sub.code];
            const pct = subData ? subData.total : null;
            return pct !== null ? (
              <span className={`font-bold ${pct < 75 ? "text-rose-600" : "text-emerald-600"}`}>
                {pct}%
              </span>
            ) : "-";
          },
        });
      });
    }

    cols.push({ 
      header: "Remark", 
      accessor: "remark",
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded bg-rose-50 text-rose-700 border border-rose-100">
          {val || "Defaulter"}
        </span>
      )
    });
    return cols;
  };

  return (
    <DashboardLayout
      title="Defaulters Management"
      subtitle="Identify & Export Low Attendance Student Reports"
      sidebarItems={sidebarItems}
    >
      <div className="mb-4 space-y-2">
        {error && <Alert message={error} type="error" onClose={() => setError("")} />}
        {success && <Alert message={success} type="success" onClose={() => setSuccess("")} />}
      </div>

      <section className="mb-6 bg-white p-6 rounded-xl border border-slate-200/60 shadow-2xs">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Filter size={15} /> Defaulter Query Criteria
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
            <Button type="submit" disabled={loading} variant="primary">
              {loading ? "Generating..." : "Generate Report"}
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={exportingPdf || defaulters.length === 0} icon={<Download size={15} />}>
              {exportingPdf ? "Exporting..." : "Export PDF"}
            </Button>
            <Button variant="outline" onClick={handleExportExcel} disabled={exportingExcel || defaulters.length === 0} icon={<FileSpreadsheet size={15} />}>
              {exportingExcel ? "Exporting..." : "Export Excel"}
            </Button>
          </div>
        </form>
      </section>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="text-sm font-bold text-slate-900">
            Defaulter Roster List ({defaulters.length})
          </h4>
        </div>
        <Table
          columns={buildColumns()}
          data={defaulters}
          emptyMessage={loading ? "Generating report..." : "No defaulters match the criteria."}
          actions={() => null}
        />
      </div>
    </DashboardLayout>
  );
}
