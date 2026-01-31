# 🔌 Enhanced Attendance API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## 🎯 Authentication

All endpoints require JWT authentication.

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📋 Attendance Endpoints

### 1. Create Attendance Session

**Endpoint:** `POST /attendance`

**Role:** Teacher

**Description:** Create a new attendance session (lecture or practical). Supports substitute teachers, extra lectures, and cancelled lectures.

**Request Body:**

```json
{
  "date": "2024-01-31",
  "subjectId": "507f1f77bcf86cd799439011",
  "branchId": "507f1f77bcf86cd799439012",
  "year": 3,
  "division": "A",
  "academicYear": "2024-2025",
  "semester": 5,
  "sessionType": "LECTURE",
  "batch": "A1",
  "assignedTeacherId": "507f1f77bcf86cd799439020",
  "isSubstitute": false,
  "substituteReason": "",
  "isExtraLecture": false,
  "extraLectureReason": "",
  "isCancelled": false,
  "cancelReason": "",
  "absentStudentIds": ["507f1f77bcf86cd799439013"]
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | String (ISO Date) | ✅ Yes | Attendance date (cannot be future) |
| `subjectId` | String (ObjectId) | ✅ Yes | Subject ID |
| `branchId` | String (ObjectId) | ✅ Yes | Branch ID |
| `year` | Number (1-4) | ✅ Yes | Year (FE/SE/TE/BE) |
| `division` | String | ✅ Yes | Division (A/B/C) |
| `academicYear` | String | ✅ Yes | Academic year (e.g., "2024-2025") |
| `semester` | Number (1-8) | ✅ Yes | Semester |
| `sessionType` | String | ✅ Yes | "LECTURE" or "PRACTICAL" |
| `batch` | String | Conditional | Required if sessionType = "PRACTICAL" |
| `assignedTeacherId` | String (ObjectId) | ❌ No | Timetable teacher (defaults to current user) |
| `isSubstitute` | Boolean | ❌ No | Is substitute teacher? |
| `substituteReason` | String | Conditional | Required if isSubstitute = true |
| `isExtraLecture` | Boolean | ❌ No | Is extra/compensation lecture? |
| `extraLectureReason` | String | Conditional | Required if isExtraLecture = true |
| `isCancelled` | Boolean | ❌ No | Is lecture cancelled? |
| `cancelReason` | String | Conditional | Required if isCancelled = true |
| `absentStudentIds` | Array of ObjectIds | ❌ No | List of absent student IDs |

**Response:**

```json
{
  "success": true,
  "message": "Attendance saved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "date": "2024-01-31T00:00:00.000Z",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "LECTURE",
    "batch": null,
    "assignedTeacher": "507f1f77bcf86cd799439020",
    "teacher": "507f1f77bcf86cd799439021",
    "isSubstitute": false,
    "isExtraLecture": false,
    "isCancelled": false,
    "subject": "507f1f77bcf86cd799439011",
    "branch": "507f1f77bcf86cd799439012",
    "year": 3,
    "division": "A",
    "absentStudents": ["507f1f77bcf86cd799439013"],
    "totalStudents": 60,
    "createdBy": "507f1f77bcf86cd799439021",
    "isLocked": false,
    "createdAt": "2024-01-31T10:30:00.000Z",
    "updatedAt": "2024-01-31T10:30:00.000Z",
    "whatsappText": "Watumull College Of Engineering And Technology\n..."
  }
}
```

**Error Responses:**

- `400` - Missing required fields
- `400` - Semester boundary violation
- `400` - Future date not allowed
- `400` - Batch required for practical
- `403` - Not authorized (substitute without reason)
- `404` - Subject/Branch/Teacher not found
- `409` - Duplicate attendance (already marked)

---

### 2. Get Teacher Attendance

**Endpoint:** `GET /attendance/teacher`

**Role:** Teacher

**Description:** Get all attendance sessions created by the logged-in teacher.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `academicYear` | String | ❌ No | Filter by academic year (e.g., "2024-2025") |
| `semester` | Number | ❌ No | Filter by semester (1-8) |

**Example Request:**
```
GET /attendance/teacher?academicYear=2024-2025&semester=5
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "date": "2024-01-31T00:00:00.000Z",
      "academicYear": "2024-2025",
      "semester": 5,
      "sessionType": "LECTURE",
      "subject": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Data Structures",
        "code": "CS301"
      },
      "branch": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Computer Science",
        "code": "CS"
      },
      "assignedTeacher": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Prof. John Doe"
      },
      "isSubstitute": false,
      "isExtraLecture": false,
      "isCancelled": false,
      "totalStudents": 60,
      "absentStudents": ["507f1f77bcf86cd799439013"],
      "createdAt": "2024-01-31T10:30:00.000Z"
    }
  ]
}
```

---

## 📊 Monthly Attendance Endpoints

### 3. Get Monthly Attendance

**Endpoint:** `GET /attendance/monthly`

**Role:** Admin / Teacher

**Description:** Get aggregated attendance report for a class with lecture and practical breakdowns.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `branchId` | String | ✅ Yes | Branch ID |
| `year` | Number | ✅ Yes | Year (1-4) |
| `division` | String | ✅ Yes | Division (A/B/C) |
| `academicYear` | String | ✅ Yes | Academic year (e.g., "2024-2025") |
| `semester` | Number | ❌ No | Semester (1-8) |
| `startDate` | String | ✅ Yes | Start date (ISO format) |
| `endDate` | String | ✅ Yes | End date (ISO format) |
| `subjectId` | String | ❌ No | Filter by specific subject |

**Example Request:**
```
GET /attendance/monthly?branchId=507f1f77bcf86cd799439012&year=3&division=A&academicYear=2024-2025&semester=5&startDate=2024-01-01&endDate=2024-01-31
```

**Response:**

```json
{
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "academicYear": "2024-2025",
  "semester": "5",
  "data": [
    {
      "subject": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Data Structures",
        "code": "CS301"
      },
      "totalLectures": 15,
      "totalPracticals": 8,
      "students": [
        {
          "rollNo": 101,
          "name": "John Doe",
          "batch": "A1",
          "lectureAttended": 14,
          "lectureAbsent": 1,
          "practicalAttended": 7,
          "practicalAbsent": 1,
          "lecturePercentage": 93,
          "practicalPercentage": 88,
          "overallPercentage": 91
        },
        {
          "rollNo": 102,
          "name": "Jane Smith",
          "batch": "A2",
          "lectureAttended": 10,
          "lectureAbsent": 5,
          "practicalAttended": 6,
          "practicalAbsent": 2,
          "lecturePercentage": 67,
          "practicalPercentage": 75,
          "overallPercentage": 70
        }
      ]
    }
  ]
}
```

**Notes:**
- Excludes cancelled lectures (`isCancelled: false`)
- Excludes dropout students (`status: "dropout"`)
- Handles late admission students (excludes sessions before admission date)
- Batch-wise filtering for practicals

---

## 🚨 Defaulter Endpoints

### 4. Generate Defaulter List

**Endpoint:** `GET /defaulters`

**Role:** Admin

**Description:** Generate list of students with attendance below threshold.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `branchId` | String | ✅ Yes | Branch ID |
| `year` | Number | ✅ Yes | Year (1-4) |
| `division` | String | ✅ Yes | Division (A/B/C) |
| `academicYear` | String | ✅ Yes | Academic year (e.g., "2024-2025") |
| `semester` | Number | ❌ No | Semester (1-8) |
| `startDate` | String | ✅ Yes | Start date (ISO format) |
| `endDate` | String | ✅ Yes | End date (ISO format) |
| `threshold` | Number | ❌ No | Attendance threshold % (default: 75) |

**Example Request:**
```
GET /defaulters?branchId=507f1f77bcf86cd799439012&year=3&division=A&academicYear=2024-2025&semester=5&startDate=2024-01-01&endDate=2024-01-31&threshold=75
```

**Response:**

```json
{
  "defaulters": [
    {
      "rollNo": 102,
      "name": "Jane Smith",
      "academicYear": "2024-2025",
      "semester": "5",
      "batch": "A2",
      "subjects": {
        "CS301": {
          "lec": "10/15",
          "lecPercent": 67,
          "prac": "6/8",
          "pracPercent": 75,
          "total": 70
        },
        "CS302": {
          "lec": "9/14",
          "lecPercent": 64,
          "prac": "5/7",
          "pracPercent": 71,
          "total": 67
        }
      },
      "overallPercentage": 68,
      "remark": "Defaulter"
    }
  ],
  "subjects": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Data Structures",
      "code": "CS301"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Operating Systems",
      "code": "CS302"
    }
  ],
  "threshold": 75,
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "academicYear": "2024-2025",
  "semester": "5"
}
```

**Notes:**
- Excludes cancelled lectures
- Excludes dropout students
- Handles late admission students
- Configurable threshold (default 75%)
- Separate lecture and practical percentages

---

### 5. Export Defaulter List (Excel)

**Endpoint:** `POST /defaulters/export/excel`

**Role:** Admin

**Description:** Export defaulter list as Excel file.

**Request Body:**

```json
{
  "defaulters": [...], // Array from /defaulters endpoint
  "academicYear": "2024-2025",
  "semester": "5",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "threshold": 75,
  "branchId": "507f1f77bcf86cd799439012"
}
```

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Filename: `Defaulter_List_2024-2025_Sem5.xlsx`

**Excel Format:**
- Header with metadata (academic year, semester, date range, threshold)
- Columns: Roll No, Name, Academic Year, Semester, Batch
- Per subject: Lecture, Lecture %, Practical, Practical %, Total %
- Overall %, Remark (color-coded)
- Red = Defaulter, Green = Clear

---

## 🧪 Example Use Cases

### Use Case 1: Regular Lecture

```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-31",
    "subjectId": "507f1f77bcf86cd799439011",
    "branchId": "507f1f77bcf86cd799439012",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "LECTURE",
    "absentStudentIds": ["507f1f77bcf86cd799439013"]
  }'
```

### Use Case 2: Substitute Teacher

```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-31",
    "subjectId": "507f1f77bcf86cd799439011",
    "branchId": "507f1f77bcf86cd799439012",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "LECTURE",
    "assignedTeacherId": "507f1f77bcf86cd799439020",
    "isSubstitute": true,
    "substituteReason": "Original teacher on medical leave",
    "absentStudentIds": []
  }'
```

### Use Case 3: Extra Lecture

```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-31",
    "subjectId": "507f1f77bcf86cd799439011",
    "branchId": "507f1f77bcf86cd799439012",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "LECTURE",
    "isExtraLecture": true,
    "extraLectureReason": "Compensation for Republic Day holiday",
    "absentStudentIds": []
  }'
```

### Use Case 4: Cancelled Lecture

```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-26",
    "subjectId": "507f1f77bcf86cd799439011",
    "branchId": "507f1f77bcf86cd799439012",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "LECTURE",
    "isCancelled": true,
    "cancelReason": "Republic Day - National Holiday"
  }'
```

### Use Case 5: Practical Session

```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-31",
    "subjectId": "507f1f77bcf86cd799439011",
    "branchId": "507f1f77bcf86cd799439012",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "PRACTICAL",
    "batch": "A1",
    "absentStudentIds": ["507f1f77bcf86cd799439013"]
  }'
```

---

## ⚠️ Common Error Codes

| Code | Message | Reason |
|------|---------|--------|
| 400 | "Missing required fields" | Required field missing |
| 400 | "Academic Year is required" | academicYear not provided |
| 400 | "Semester is required (1-8)" | semester missing or invalid |
| 400 | "Batch is required for practical session" | batch missing for practical |
| 400 | "Cannot mark attendance for future dates" | date > today |
| 400 | "Attendance date must be between..." | Outside semester boundaries |
| 400 | "Subject is no longer active" | Subject.isActive = false |
| 400 | "No eligible students found..." | No students match filters |
| 403 | "You are not authorized to take this lecture" | Substitute without reason |
| 404 | "Subject not found" | Invalid subjectId |
| 404 | "Branch not found" | Invalid branchId |
| 404 | "Teacher not found" | Invalid teacherId |
| 409 | "Attendance already marked..." | Duplicate session (unless extra) |
| 500 | "Server error" | Internal error |

---

## 🔐 Authorization Rules

### Attendance Creation:
- **Assigned Teacher**: Always authorized
- **Substitute Teacher**: Must provide `substituteReason`
- **Other Teachers**: Denied (403)

### Attendance Viewing:
- **Teacher**: Can view own sessions
- **Admin**: Can view all sessions

### Reports & Defaulters:
- **Admin Only**

---

## 📝 Notes

1. **Cancelled Lectures**: Created but NOT counted in attendance calculations
2. **Extra Lectures**: Included in calculations, allows multiple sessions per day
3. **Late Admission**: Students excluded from sessions before admission date
4. **Dropout Students**: Excluded from all reports and calculations
5. **Semester Boundaries**: Attendance only allowed within subject's semester dates
6. **Batch Logic**: For practicals, only students with matching batch are counted

---

*Last Updated: January 31, 2026*
