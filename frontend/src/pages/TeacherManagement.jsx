import { useEffect, useState } from "react";
import { theme } from "../styles/theme";
import DashboardLayout from "../components/DashboardLayout";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Alert from "../components/Alert";
import Table from "../components/Table";
import { getBranches, getSubjects, createTeacher, assignTeacher, getTeachers } from "../services/adminService";

export default function TeacherManagement() {
  // Data
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Create Teacher state
  const [tName, setTName] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [tPassword, setTPassword] = useState("");
  const [tDepartment, setTDepartment] = useState("");
  const [tDesignation, setTDesignation] = useState("Assistant Professor");
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState("");
  const [createError, setCreateError] = useState("");
  const [lastCreatedTeacherId, setLastCreatedTeacherId] = useState("");

  // Assign Teacher state
  const [aTeacherId, setATeacherId] = useState("");
  const [aBranch, setABranch] = useState("");
  const [aSemester, setASemester] = useState("");
  const [aSubject, setASubject] = useState("");
  const [aYear, setAYear] = useState("");
  const [aDivision, setADivision] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignError, setAssignError] = useState("");

  const sidebarItems = [
    { label: "Dashboard", path: "/admin", icon: "🏠" },
    { label: "Branches", path: "/admin/branches", icon: "🌿" },
    { label: "Subjects", path: "/admin/subjects", icon: "📘" },
    { label: "Students", path: "/admin/students", icon: "🎓" },
    { label: "Teachers", path: "/admin/teachers", icon: "👩‍🏫" },
    { label: "Reports", path: "/admin/defaulters", icon: "📊" },
  ];

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const data = await getTeachers();
      setTeachers(data);
      if (data.length && !aTeacherId) {
        setATeacherId(data[0]._id);
      }
    } catch (err) {
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const branchesRes = await getBranches();
        setBranches(branchesRes);
        await fetchTeachers();
      } catch (err) {
        // non-blocking
      }
    };
    init();
  }, []);

  // Fetch subjects when branch or semester changes
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!aBranch || !aSemester) {
        setSubjects([]);
        setASubject("");
        return;
      }
      try {
        const data = await getSubjects(aBranch, aSemester);
        setSubjects(data);
      } catch (err) {
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, [aBranch, aSemester]);

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setCreateError("");
      setCreateSuccess("");

      const payload = {
        name: tName.trim(),
        email: tEmail.trim(),
        password: tPassword,
        department: tDepartment,
        designation: tDesignation || undefined,
      };

      const res = await createTeacher(payload);
      setCreateSuccess(res.message || "Teacher created successfully");
      setLastCreatedTeacherId(res.teacher?._id || "");

      await fetchTeachers();

      // reset form minimal
      setTName("");
      setTEmail("");
      setTPassword("");
      setTDepartment("");
    } catch (err) {
      setCreateError(err.message || "Failed to create teacher");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    try {
      setAssignLoading(true);
      setAssignError("");
      setAssignSuccess("");

      const payload = {
        teacher: aTeacherId,
        subject: aSubject,
        branch: aBranch,
        year: Number(aYear),
        division: aDivision,
      };

      const res = await assignTeacher(payload);
      setAssignSuccess(res.message || "Teacher assigned successfully");

      // reset minimal
      setASubject("");
      setAYear("");
      setADivision("");
    } catch (err) {
      setAssignError(err.message || "Failed to assign teacher");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Teachers Management"
      subtitle="Create teachers and assign them to classes"
      sidebarItems={sidebarItems}
    >
      {/* Alerts */}
      <div className="mb-4 space-y-2">
        {createError && (
          <Alert message={createError} type="error" onClose={() => setCreateError("")} />
        )}
        {createSuccess && (
          <Alert message={createSuccess} type="success" onClose={() => setCreateSuccess("")} />
        )}
        {assignError && (
          <Alert message={assignError} type="error" onClose={() => setAssignError("")} />
        )}
        {assignSuccess && (
          <Alert message={assignSuccess} type="success" onClose={() => setAssignSuccess("")} />
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Create Teacher Card */}
        <section
          className="rounded-lg border p-6"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}
        >
          <h3 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
            Create Teacher
          </h3>

          <form onSubmit={handleCreateTeacher}>
            <FormInput label="Name" name="tName" value={tName} onChange={(e) => setTName(e.target.value)} required />
            <FormInput label="Email" name="tEmail" type="email" value={tEmail} onChange={(e) => setTEmail(e.target.value)} required />
            <FormInput label="Password" name="tPassword" type="password" value={tPassword} onChange={(e) => setTPassword(e.target.value)} required />
            <FormSelect
              label="Department"
              name="tDepartment"
              value={tDepartment}
              onChange={(e) => setTDepartment(e.target.value)}
              options={[{ label: "Select Department", value: "" }, ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id }))]}
              required
            />
            <FormInput label="Designation" name="tDesignation" value={tDesignation} onChange={(e) => setTDesignation(e.target.value)} />

            <div className="mt-4 flex justify-end">
              <Button disabled={createLoading}>{createLoading ? "Creating..." : "Create"}</Button>
            </div>
          </form>

          {lastCreatedTeacherId && (
            <p className="mt-4 text-xs" style={{ color: theme.colors.text.secondary }}>
              Last created Teacher ID: <span style={{ color: theme.colors.text.primary }}>{lastCreatedTeacherId}</span>
            </p>
          )}
        </section>

        {/* Assign Teacher Card */}
        <section
          className="rounded-lg border p-6"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}
        >
          <h3 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
            Assign Teacher to Class
          </h3>

          <form onSubmit={handleAssignTeacher}>
            <FormSelect
              label="Teacher"
              name="aTeacherId"
              value={aTeacherId}
              onChange={(e) => setATeacherId(e.target.value)}
              options={[
                { label: loadingTeachers ? "Loading..." : "Select Teacher", value: "" },
                ...teachers.map((t) => ({
                  label: `${t.userId?.name || "Unnamed"} (${t.userId?.email || "no email"})`,
                  value: t._id,
                })),
              ]}
              required
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Branch"
                name="aBranch"
                value={aBranch}
                onChange={(e) => setABranch(e.target.value)}
                options={[{ label: "Select Branch", value: "" }, ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id }))]}
                required
              />
              <FormSelect
                label="Semester"
                name="aSemester"
                value={aSemester}
                onChange={(e) => setASemester(e.target.value)}
                options={[
                  { label: "Select Semester", value: "" },
                  { label: "1", value: 1 },
                  { label: "2", value: 2 },
                  { label: "3", value: 3 },
                  { label: "4", value: 4 },
                  { label: "5", value: 5 },
                  { label: "6", value: 6 },
                  { label: "7", value: 7 },
                  { label: "8", value: 8 },
                ]}
                required
              />
            </div>

            <FormSelect
              label="Subject"
              name="aSubject"
              value={aSubject}
              onChange={(e) => setASubject(e.target.value)}
              options={[{ label: "Select Subject", value: "" }, ...subjects.map((s) => ({ label: `${s.name} (${s.code})`, value: s._id }))]}
              required
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Year"
                name="aYear"
                value={aYear}
                onChange={(e) => setAYear(e.target.value)}
                options={[
                  { label: "Select Year", value: "" },
                  { label: "FE (1)", value: 1 },
                  { label: "SE (2)", value: 2 },
                  { label: "TE (3)", value: 3 },
                  { label: "BE (4)", value: 4 },
                ]}
                required
              />
              <FormSelect
                label="Division"
                name="aDivision"
                value={aDivision}
                onChange={(e) => setADivision(e.target.value)}
                options={[
                  { label: "Select Division", value: "" },
                  { label: "A", value: "A" },
                  { label: "B", value: "B" },
                  { label: "C", value: "C" },
                ]}
                required
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button disabled={assignLoading}>{assignLoading ? "Assigning..." : "Assign"}</Button>
            </div>

            <p className="mt-3 text-xs" style={{ color: theme.colors.text.secondary }}>
              Note: Subject options are filtered by Branch + Semester.
            </p>
          </form>
        </section>
      </div>

      {/* Teachers Table */}
      <div className="mt-8">
        <h4 className="mb-3 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
          Teachers
        </h4>
        <Table
          columns={[
            { header: "Name", accessor: "userId", render: (val) => val?.name || "-" },
            { header: "Email", accessor: "userId", render: (val) => val?.email || "-" },
            { header: "Department", accessor: "department", render: (val) => (val ? `${val.name} (${val.code})` : "-") },
            { header: "Designation", accessor: "designation" },
            { header: "Status", accessor: "status" },
          ]}
          data={teachers}
          emptyMessage={loadingTeachers ? "Loading teachers..." : "No teachers found"}
          actions={() => null}
        />
      </div>
    </DashboardLayout>
  );
}
