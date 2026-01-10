# 🎯 PRODUCTION FRONTEND DEVELOPMENT PLAN

## Architecture Overview

### 1️⃣ COMPLETED FOUNDATIONS
- ✅ **Theme System** (`src/styles/theme.js`) - Centralized colors, typography, spacing, shadows
- ✅ **Axios Instance** (`src/utils/axios.js`) - Base URL, interceptors, token management
- ✅ **API Services Layer**:
  - ✅ `authService.js` - Login, forgot password, reset password
  - ✅ `adminService.js` - Branches, subjects, students, teachers
  - ✅ `attendanceService.js` - Attendance marking, retrieval, defaulters
- ✅ **Auth Context** (`src/context/AuthContext.jsx`) - State management, token persistence
- ✅ **Protected Routes** (`src/components/ProtectedRoute.jsx`) - Role-based access control
- ✅ **Login Page** (PAGE 1) - Production-ready with theme system

---

## 📄 PAGE-BY-PAGE DEVELOPMENT ROADMAP

### ✅ PAGE 1: LOGIN
**Status:** COMPLETE ✅

**API Endpoints Used:**
```
POST /api/auth/login
Request:  { email, password }
Response: { token, role, name }
```

**Key Features:**
- Email validation
- Password visibility toggle
- Role-based redirect (admin/teacher/student)
- Error/Success alerts
- Demo credentials displayed
- Responsive design
- Professional blue theme

**Files:**
- `src/pages/Login.jsx` - Main page

---

### PAGE 2: FORGOT PASSWORD & RESET PASSWORD
**Status:** NOT STARTED

**API Endpoints:**
```
POST /api/auth/forgot-password
Request:  { email }
Response: { message: "OTP sent to email" }

POST /api/auth/reset-password
Request:  { email, otp, newPassword }
Response: { message: "Password reset successful" }
```

**Design Plan:**
- Step 1: Enter email → Request OTP
- Step 2: Enter OTP → Validate
- Step 3: Enter new password → Confirm → Success
- Progress indicator showing current step
- Timer for OTP expiry (10 minutes)
- Back to login link

**Files to Create:**
- `src/pages/ForgotPassword.jsx`
- `src/pages/ResetPassword.jsx`

---

### PAGE 3: ADMIN DASHBOARD
**Status:** NOT STARTED

**API Endpoints:**
```
GET /api/admin/branches
GET /api/admin/students?branch=...&year=...&division=...
GET /api/admin/subjects?branch=...&semester=...
```

**Sections:**
1. **Navigation Header** - Logout, user name, role
2. **Sidebar Menu:**
   - Dashboard (Overview)
   - Branch Management
   - Subject Management
   - Student Management
   - Teacher Management
   - Reports & Defaulters
3. **Dashboard Stats:**
   - Total Students
   - Total Teachers
   - Total Branches
   - Total Subjects
   - Monthly Defaulters
4. **Quick Actions:**
   - Create Branch
   - Create Subject
   - Create Student
   - Create Teacher
   - Assign Teacher

**Files to Create:**
- `src/pages/AdminDashboard.jsx`
- `src/components/Sidebar.jsx`
- `src/components/Header.jsx`
- `src/components/StatsCard.jsx`
- `src/components/QuickActionCard.jsx`

---

### PAGE 4: BRANCH MANAGEMENT (Admin)
**Status:** NOT STARTED

**API Endpoints:**
```
GET /api/admin/branches
POST /api/admin/branches
Request:  { name, code }
Response: { _id, name, code }
```

**Features:**
- Table of all branches
- Create new branch modal
- Edit branch
- Delete branch (with confirmation)
- Search/filter

**Files:**
- `src/pages/AdminBranches.jsx`
- `src/components/BranchForm.jsx`
- `src/components/BranchTable.jsx`

---

### PAGE 5: SUBJECT MANAGEMENT (Admin)
**Status:** NOT STARTED

**API Endpoints:**
```
GET /api/admin/subjects?branch=...&semester=...
POST /api/admin/subjects
Request:  { name, code, branch, semester }
Response: { _id, name, code, branch, semester }
```

**Features:**
- Filter by branch
- Filter by semester
- Create subject
- Edit subject
- Delete subject
- Table view

**Files:**
- `src/pages/AdminSubjects.jsx`
- `src/components/SubjectForm.jsx`
- `src/components/SubjectTable.jsx`

---

### PAGE 6: STUDENT MANAGEMENT (Admin)
**Status:** NOT STARTED

**API Endpoints:**
```
GET /api/admin/students?branch=...&year=...&division=...
POST /api/admin/students
POST /api/admin/students/upload (Excel)
```

**Features:**
- List all students with filters
- Create student form
- Bulk upload via Excel
- Edit student
- Delete student
- View student details

**Files:**
- `src/pages/AdminStudents.jsx`
- `src/components/StudentForm.jsx`
- `src/components/StudentTable.jsx`
- `src/components/ExcelUpload.jsx`

---

### PAGE 7: TEACHER MANAGEMENT (Admin)
**Status:** NOT STARTED

**API Endpoints:**
```
POST /api/admin/teachers
POST /api/admin/assign-teacher
```

**Features:**
- Create teacher
- Assign teacher to subject
- Assign to specific year/division
- View assignments
- Edit assignment

**Files:**
- `src/pages/AdminTeachers.jsx`
- `src/components/TeacherForm.jsx`
- `src/components/TeacherAssignment.jsx`

---

### PAGE 8: TEACHER DASHBOARD
**Status:** NOT STARTED

**API Endpoints:**
```
GET /api/attendance (for teacher's sessions)
```

**Features:**
- List of assigned classes
- Quick access to mark attendance
- View past attendance records
- Generate reports

**Files:**
- `src/pages/TeacherDashboard.jsx`
- `src/components/ClassCard.jsx`
- `src/components/AttendanceList.jsx`

---

### PAGE 9: MARK ATTENDANCE (Teacher)
**Status:** NOT STARTED

**API Endpoints:**
```
POST /api/attendance
Request: {
  date,
  subjectId,
  branchId,
  year,
  division,
  sessionType: "LECTURE" | "PRACTICAL",
  batch: (required for PRACTICAL),
  absentStudentIds: []
}
Response: { message, attendance }
```

**Features:**
- Select Branch → Year → Division
- Select Subject (from assigned subjects)
- Select Session Type (Lecture/Practical)
- If Practical: Select Batch
- Select Date
- Student checklist (Present/Absent)
- Toggle all button
- Save attendance (one-time only per session)
- Confirmation before save

**Files:**
- `src/pages/MarkAttendance.jsx`
- `src/components/StudentChecklist.jsx`
- `src/components/SessionSelector.jsx`

---

### PAGE 10: STUDENT DASHBOARD
**Status:** NOT STARTED

**Features:**
- View own attendance
- View attendance percentage per subject
- Check if defaulter
- Download attendance certificate

**Files:**
- `src/pages/StudentDashboard.jsx`
- `src/components/AttendanceSummary.jsx`

---

### PAGE 11: DEFAULTERS REPORT
**Status:** NOT STARTED

**API Endpoints:**
```
GET /api/attendance/defaulters?branchId=...&year=...&division=...&startDate=...&endDate=...&threshold=75
GET /api/reports/defaulters/pdf
GET /api/reports/defaulters/excel
```

**Features:**
- Select class (branch/year/division)
- Select date range
- Generate report
- View defaulters table
- Export to PDF
- Export to Excel

**Files:**
- `src/pages/Defaulters.jsx`
- `src/components/DefaultersTable.jsx`
- `src/components/ReportFilters.jsx`

---

## 🎨 REUSABLE COMPONENTS (TO ENHANCE)

### Already Exist:
- ✅ `Button.jsx` - Primary CTA button
- ✅ `FormInput.jsx` - Text/email/password input
- ✅ `FormSelect.jsx` - Dropdown select
- ✅ `Alert.jsx` - Error/success/info messages
- ✅ `Card.jsx` - Container component
- ✅ `LoadingSpinner.jsx` - Loading indicator
- ✅ `Header.jsx` - Top navigation
- ✅ `ProtectedRoute.jsx` - Auth guard

### Need to Create:
- `Table.jsx` - Reusable data table with sorting/pagination
- `Modal.jsx` - Dialog for forms/confirmations
- `Badge.jsx` - Status badges
- `Tabs.jsx` - Tab navigation
- `Dropdown.jsx` - Context menu
- `Toast.jsx` - Notifications

---

## 🔌 ENVIRONMENT SETUP

Create `.env.local`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Backend Server:
```bash
cd backend
npm install
npm run dev
```

Frontend Dev:
```bash
cd frontend
npm run dev
```

---

## ✨ COLOR PALETTE IN USE

- **Primary Blue:** `#6b7dff` (Professional, trustworthy)
- **Dark Neutral:** `#1f2937` (Text)
- **Light Neutral:** `#f9fafb` (Backgrounds)
- **Success Green:** `#10b981` (Confirmations)
- **Error Red:** `#ef4444` (Validation)
- **Warning Amber:** `#f59e0b` (Alerts)

---

## 📋 CODE QUALITY STANDARDS

✅ **Applied:**
- Clean commenting
- Descriptive variable names
- Reusable components
- Service layer separation
- Error handling
- Theme system usage
- No inline styles
- Responsive design
- Accessibility basics

---

## 🚀 NEXT STEPS

**Ready to start PAGE 2: Forgot/Reset Password?**

Waiting for your approval to proceed with:
1. `src/pages/ForgotPassword.jsx`
2. `src/pages/ResetPassword.jsx`
3. Updated routing in `App.jsx`

Please confirm, and I'll build these with the same production quality! 🎯
