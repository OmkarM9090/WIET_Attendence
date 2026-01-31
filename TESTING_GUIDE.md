# 🚀 Quick Start: Testing Enhanced Attendance System

## Step 1: Run Database Migration

```bash
cd backend
node migrations/001_enhance_attendance_system.js
```

**What it does:**
- Updates existing AttendanceSession documents with new fields
- Updates Student documents with status and admissionDate
- Updates Subject documents with scheme, credits, and semester dates
- Creates necessary indexes

**⚠️ IMPORTANT:** Review default values in migration script before running!

---

## Step 2: Update Environment Variables

No changes needed. Existing `.env` file works.

---

## Step 3: Test Basic Scenarios

### 3.1 Test Regular Lecture Attendance

```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-31",
    "subjectId": "YOUR_SUBJECT_ID",
    "branchId": "YOUR_BRANCH_ID",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "LECTURE",
    "absentStudentIds": []
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Attendance saved successfully",
  "data": {
    "_id": "...",
    "academicYear": "2024-2025",
    "semester": 5,
    "isSubstitute": false,
    "isExtraLecture": false,
    "isCancelled": false,
    "whatsappText": "..."
  }
}
```

---

### 3.2 Test Substitute Teacher

```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-31",
    "subjectId": "YOUR_SUBJECT_ID",
    "branchId": "YOUR_BRANCH_ID",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "LECTURE",
    "assignedTeacherId": "ORIGINAL_TEACHER_ID",
    "isSubstitute": true,
    "substituteReason": "Original teacher on medical leave",
    "absentStudentIds": []
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "isSubstitute": true,
    "substituteReason": "Original teacher on medical leave",
    "assignedTeacher": "ORIGINAL_TEACHER_ID",
    "teacher": "CURRENT_TEACHER_ID"
  }
}
```

---

### 3.3 Test Cancelled Lecture

```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-26",
    "subjectId": "YOUR_SUBJECT_ID",
    "branchId": "YOUR_BRANCH_ID",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "LECTURE",
    "isCancelled": true,
    "cancelReason": "Republic Day - National Holiday"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cancelled lecture recorded",
  "data": {
    "isCancelled": true,
    "cancelReason": "Republic Day - National Holiday",
    "totalStudents": 0
  }
}
```

---

### 3.4 Test Extra Lecture

```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-31",
    "subjectId": "YOUR_SUBJECT_ID",
    "branchId": "YOUR_BRANCH_ID",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "LECTURE",
    "isExtraLecture": true,
    "extraLectureReason": "Compensation for Republic Day",
    "absentStudentIds": []
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "isExtraLecture": true,
    "extraLectureReason": "Compensation for Republic Day"
  }
}
```

---

### 3.5 Test Practical Session

```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-31",
    "subjectId": "YOUR_SUBJECT_ID",
    "branchId": "YOUR_BRANCH_ID",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "PRACTICAL",
    "batch": "A1",
    "absentStudentIds": []
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sessionType": "PRACTICAL",
    "batch": "A1"
  }
}
```

---

### 3.6 Test Monthly Attendance Report

```bash
curl -X GET "http://localhost:5000/api/attendance/monthly?branchId=YOUR_BRANCH_ID&year=3&division=A&academicYear=2024-2025&semester=5&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
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
      "subject": {...},
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
        }
      ]
    }
  ]
}
```

---

### 3.7 Test Defaulter Generation

```bash
curl -X GET "http://localhost:5000/api/defaulters?branchId=YOUR_BRANCH_ID&year=3&division=A&academicYear=2024-2025&semester=5&startDate=2024-01-01&endDate=2024-01-31&threshold=75" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
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
        }
      },
      "overallPercentage": 68,
      "remark": "Defaulter"
    }
  ],
  "threshold": 75
}
```

---

## Step 4: Validation Tests

### Test 1: Future Date Validation
```bash
# Should return 400 error
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-12-31",
    "subjectId": "YOUR_SUBJECT_ID",
    "branchId": "YOUR_BRANCH_ID",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "LECTURE"
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "message": "Cannot mark attendance for future dates"
}
```

---

### Test 2: Missing Batch for Practical
```bash
# Should return 400 error
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-31",
    "subjectId": "YOUR_SUBJECT_ID",
    "branchId": "YOUR_BRANCH_ID",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "PRACTICAL"
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "message": "Batch is required for practical session"
}
```

---

### Test 3: Substitute Without Reason
```bash
# Should return 403 error
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-31",
    "subjectId": "YOUR_SUBJECT_ID",
    "branchId": "YOUR_BRANCH_ID",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "LECTURE",
    "assignedTeacherId": "DIFFERENT_TEACHER_ID"
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "message": "You are not authorized to take this lecture. Substitute reason is required."
}
```

---

### Test 4: Duplicate Attendance
```bash
# Try creating same attendance twice - should return 409 error on second attempt
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-31",
    "subjectId": "YOUR_SUBJECT_ID",
    "branchId": "YOUR_BRANCH_ID",
    "year": 3,
    "division": "A",
    "academicYear": "2024-2025",
    "semester": 5,
    "sessionType": "LECTURE"
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "message": "Attendance already marked for this session. If this is an extra lecture, set isExtraLecture=true"
}
```

---

## Step 5: Database Verification

### Check AttendanceSession Collection

```javascript
// MongoDB Shell
use wiet_attendance

// Check new fields exist
db.attendancesessions.findOne()

// Should show:
{
  semester: 5,
  assignedTeacher: ObjectId("..."),
  teacher: ObjectId("..."),
  isSubstitute: false,
  substituteReason: null,
  isExtraLecture: false,
  extraLectureReason: null,
  isCancelled: false,
  cancelReason: null,
  createdBy: ObjectId("..."),
  isLocked: false
}
```

### Check Student Collection

```javascript
// Check new fields exist
db.students.findOne()

// Should show:
{
  status: "active",
  admissionDate: ISODate("2024-07-01T00:00:00.000Z")
}
```

### Check Subject Collection

```javascript
// Check new fields exist
db.subjects.findOne()

// Should show:
{
  scheme: "NEP2020",
  credits: 4,
  semesterStartDate: ISODate("2024-07-01T00:00:00.000Z"),
  semesterEndDate: ISODate("2024-11-30T00:00:00.000Z"),
  isActive: true
}
```

---

## Step 6: Postman Collection (Optional)

Import this collection to Postman for easy testing:

```json
{
  "info": {
    "name": "Enhanced Attendance System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Regular Lecture",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/attendance",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"date\": \"2024-01-31\",\n  \"subjectId\": \"{{subjectId}}\",\n  \"branchId\": \"{{branchId}}\",\n  \"year\": 3,\n  \"division\": \"A\",\n  \"academicYear\": \"2024-2025\",\n  \"semester\": 5,\n  \"sessionType\": \"LECTURE\",\n  \"absentStudentIds\": []\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        }
      }
    }
  ]
}
```

---

## Step 7: Common Issues & Solutions

### Issue 1: Migration Fails
**Solution:** Check MongoDB connection string in `.env`

### Issue 2: Attendance Creation Fails with "Subject not found"
**Solution:** Run migration script to update Subject collection

### Issue 3: "Semester boundary violation"
**Solution:** Update Subject's semesterStartDate and semesterEndDate

### Issue 4: "No eligible students found"
**Solution:** Check Student collection has records with:
- Correct branch, year, division
- status = "active"
- admissionDate <= session date

---

## ✅ Success Checklist

- [ ] Migration script ran successfully
- [ ] Can create regular lecture attendance
- [ ] Can create substitute teacher attendance
- [ ] Can create cancelled lecture
- [ ] Can create extra lecture
- [ ] Can create practical session
- [ ] Monthly report shows lecture/practical breakdown
- [ ] Defaulter list excludes cancelled lectures
- [ ] Excel export works with new columns
- [ ] Validation errors work correctly

---

## 🎉 You're Done!

Your enhanced attendance system is now ready for production use. All real-world college scenarios are supported:

✅ Substitute teachers  
✅ Extra lectures  
✅ Cancelled lectures  
✅ Late admission students  
✅ Dropout students  
✅ Division/batch changes  
✅ NEP 2020 / Rev-C schemes  
✅ Semester boundaries  
✅ Academic year separation  
✅ Audit logging  

---

*For detailed API documentation, see [API_DOCUMENTATION_ENHANCED.md](API_DOCUMENTATION_ENHANCED.md)*
