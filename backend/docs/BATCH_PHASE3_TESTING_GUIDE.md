# 🚀 Batch Management Backend APIs - Phase 3
## Complete Testing Guide + Sample Requests/Responses + Edge Cases

**Date:** 2026-08-01  
**Status:** Backend Only (Admin Protected)  
**Base URL:** `http://localhost:5000`

---

## 📋 PRE-REQUISITES

1. Backend server running: `cd backend && npm run dev`
2. Admin JWT token (login as admin)
3. At least 1 Branch + Students (Year 2, Division A/B)
4. MongoDB running with Phase 2 models (Batch + Student updated)

---

## 🔐 AUTHENTICATION

All routes require:
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

---

## 1. GET BATCHES (List + Unassigned Count)

**Endpoint:** `GET /api/admin/batches`

**Query Params:**
- `branchId` (required)
- `year` (required)
- `division` (optional)
- `academicYear` (optional)

### Sample Request
```http
GET /api/admin/batches?branchId=64f1a2b3c4d5e6f7a8b9c0d1&year=2&division=A
```

### Sample Response (Success)
```json
{
  "success": true,
  "message": "Batches fetched successfully",
  "data": {
    "batches": [
      {
        "_id": "64f2b3c4d5e6f7a8b9c0d1e2",
        "name": "BA2-A1",
        "displayName": "BA2-A1",
        "branch": { "_id": "...", "name": "Computer Engineering", "code": "CMPN" },
        "year": 2,
        "division": "A",
        "divisions": ["A"],
        "students": [],
        "studentCount": 28,
        "labRoom": "Lab-102",
        "batchType": "regular",
        "isMerged": false,
        "isActive": true
      }
    ],
    "unassignedCount": 12,
    "totalBatches": 2,
    "filters": {
      "branchId": "64f1a2b3c4d5e6f7a8b9c0d1",
      "year": 2,
      "division": "A",
      "academicYear": null
    }
  },
  "error": null
}
```

---

## 2. GET SINGLE BATCH (with students)

**Endpoint:** `GET /api/admin/batches/:id`

### Sample Request
```http
GET /api/admin/batches/64f2b3c4d5e6f7a8b9c0d1e2
```

### Sample Response
```json
{
  "success": true,
  "message": "Batch fetched successfully",
  "data": {
    "_id": "64f2b3c4d5e6f7a8b9c0d1e2",
    "name": "BA2-A1",
    "students": [
      {
        "_id": "64f3c4d5e6f7a8b9c0d1e2f3",
        "rollNo": 1,
        "userId": { "name": "Rahul Sharma", "email": "rahul@college.edu" }
      }
    ],
    "studentCount": 28,
    ...
  }
}
```

---

## 3. QUICK SETUP BATCHES

**Endpoint:** `POST /api/admin/batches/quick-setup`

### Sample Request Body
```json
{
  "branchId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "year": 2,
  "division": "A",
  "splitMethod": "count",
  "batchCount": 3,
  "namingPattern": "BA",
  "academicYear": "2025-2026"
}
```

### Sample Response
```json
{
  "success": true,
  "message": "3 batches created/updated via quick setup",
  "data": {
    "batches": [
      { "_id": "...", "name": "BAA1", "studentCount": 12 },
      { "_id": "...", "name": "BAA2", "studentCount": 12 },
      { "_id": "...", "name": "BAA3", "studentCount": 11 }
    ],
    "totalStudents": 35,
    "splitMethod": "count",
    "batchCount": 3
  }
}
```

---

## 4. CREATE BATCH

**Endpoint:** `POST /api/admin/batches`

### Sample Request Body
```json
{
  "name": "BA2-Custom",
  "branchId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "year": 2,
  "divisions": ["A"],
  "studentIds": ["64f3c4d5e6f7a8b9c0d1e2f3", "64f3c4d5e6f7a8b9c0d1e2f4"],
  "labRoom": "Lab-205",
  "description": "Special practical batch"
}
```

### Sample Response
```json
{
  "success": true,
  "message": "Batch created successfully",
  "data": {
    "batch": { "_id": "...", "name": "BA2-Custom", "studentCount": 2 },
    "addedStudentCount": 2
  }
}
```

---

## 5. UPDATE BATCH

**Endpoint:** `PUT /api/admin/batches/:id`

### Sample Request Body
```json
{
  "name": "BA2-A1-Renamed",
  "labRoom": "Lab-301",
  "description": "Updated for semester 3"
}
```

---

## 6. ADD STUDENTS TO BATCH

**Endpoint:** `POST /api/admin/batches/:id/students`

### Sample Request Body
```json
{
  "studentIds": ["64f3c4d5e6f7a8b9c0d1e2f3", "64f3c4d5e6f7a8b9c0d1e2f4"]
}
```

---

## 7. REMOVE STUDENT FROM BATCH

**Endpoint:** `DELETE /api/admin/batches/:id/students/:studentId`

---

## 8. BULK MOVE STUDENTS

**Endpoint:** `POST /api/admin/batches/bulk-move`

### Sample Request Body
```json
{
  "fromBatchId": "64f2b3c4d5e6f7a8b9c0d1e2",
  "toBatchId": "64f2b3c4d5e6f7a8b9c0d1e3",
  "studentIds": ["64f3c4d5e6f7a8b9c0d1e2f3", "64f3c4d5e6f7a8b9c0d1e2f4"]
}
```

---

## 9. CREATE MERGED BATCH

**Endpoint:** `POST /api/admin/batches/merge`

### Sample Request Body
```json
{
  "name": "Merged-BA2-BB1",
  "sourceBatchIds": ["64f2b3c4d5e6f7a8b9c0d1e2", "64f2b3c4d5e6f7a8b9c0d1e3"],
  "studentIds": [],
  "labRoom": "Lab-Merged"
}
```

**Validation:** All source batches must be same `branch` + `year`

---

## 10. DELETE BATCH

**Endpoint:** `DELETE /api/admin/batches/:id`

**Response (with active sessions):**
```json
{
  "success": true,
  "message": "Batch soft-deleted (warning: active/recent attendance sessions exist)",
  "data": {
    "batchId": "...",
    "name": "BA2-A1",
    "warning": "5 recent attendance sessions found",
    "softDeleted": true
  }
}
```

---

## 11. GET UNASSIGNED STUDENTS

**Endpoint:** `GET /api/admin/batches/unassigned?branchId=...&year=2&division=A`

---

## 12. GET BATCH STATS

**Endpoint:** `GET /api/admin/batches/stats?branchId=...&year=2`

### Sample Response
```json
{
  "success": true,
  "message": "Batch statistics fetched successfully",
  "data": {
    "totalBatches": 3,
    "totalStudentsInBatches": 35,
    "unassignedCount": 8,
    "totalClassStudents": 43,
    "averageStudentsPerBatch": 12,
    "batches": [
      { "_id": "...", "name": "BA2-A1", "studentCount": 12, "isMerged": false }
    ]
  }
}
```

---

## 🧪 TESTING SEQUENCE (Recommended Order)

1. **Setup**  
   - Get your Branch ID from `/api/admin/branches`
   - Get 8-10 Student IDs from your DB

2. **Quick Setup (Happy Path)**
   ```
   POST /quick-setup → Verify 3 batches created
   GET / → Check batch list + unassignedCount
   ```

3. **Manual Creation + Management**
   ```
   POST / (create custom)
   GET /:id
   POST /:id/students
   DELETE /:id/students/:studentId
   ```

4. **Advanced Operations**
   ```
   POST /bulk-move
   POST /merge
   ```

5. **Stats & Cleanup**
   ```
   GET /stats
   GET /unassigned
   DELETE /:id   (test soft delete)
   ```

---

## ⚠️ EDGE CASES TO VERIFY

| # | Scenario | Expected Result |
|---|----------|-----------------|
| 1 | Missing branchId/year | 400 + "branchId and year are required" |
| 2 | Invalid ObjectId | 400 + "Invalid batch ID" |
| 3 | Duplicate batch name (same class) | 409 + "Batch with this name already exists" |
| 4 | Add student from different branch/year | Skipped (via helper validation) |
| 5 | Quick setup with 0 students | 400 + "No active students found" |
| 6 | Merge < 2 batches | 400 + "at least 2 sourceBatchIds" |
| 7 | Merge different years | 400 + "must belong to same branch and year" |
| 8 | Delete batch with recent attendance | Soft delete + warning message |
| 9 | Get batch with deleted flag | Not returned (isDeleted filter) |
| 10 | Bulk move same from/to batch | 400 + "Cannot move students to the same batch" |
| 11 | Add invalid studentId | Skipped, success with partial result |
| 12 | Unassigned students after quick setup | Should be 0 (or low) |
| 13 | Practical attendance uses helper | `getStudentsForSession` returns correct batch students |
| 14 | Teacher assignment populate | Now includes `studentCount`, `batchType`, `isMerged`, `labRoom` |

---

## ✅ RESPONSE FORMAT (Every API)

All APIs follow:

```json
{
  "success": true | false,
  "message": "Clear Hinglish message",
  "data": { ... } | null,
  "error": null | "ERROR_CODE"
}
```

---

## 📝 CONSOLE LOGS (Look for these)

All batch APIs log with prefix:

```
[BATCH] getBatches - branchId=xxx year=2 ...
[BATCH] quickSetupBatches - Found 45 students to split
[BATCH] addStudentsToBatch - Added 2, skipped 0
```

---

## 🔄 INTEGRATION POINTS (Already Updated)

### 1. Teacher Dashboard
- `getMyTeachingAssignments` now returns:
  ```json
  "batch": {
    "_id": "...",
    "name": "BA2-A1",
    "studentCount": 28,
    "batchType": "regular",
    "isMerged": false,
    "labRoom": "Lab-102"
  },
  "displayName": "Data Structures - CMPN 2-A (BA2-A1)"
  ```

### 2. Attendance Marking
- `getStudentsForSession` → Uses `getStudentsForBatch()` from `batchMembership.js`
- `markAndGenerateAttendance` → Always stores `batch` as ObjectId

### 3. Existing Data Backward Compatibility
- Legacy `student.batch` + `practicalBatches` still work
- Batch model `students` array is primary source of truth

---

## 🛠️ POSTMAN IMPORT

1. Import file: `backend/docs/batch-phase3-postman-collection.json`
2. Set environment variables:
   - `baseUrl` = `http://localhost:5000`
   - `adminToken` = your JWT
   - `branchId`, `batchId`, `studentId1` etc. (fill after first calls)

---

## 📌 NOTES FOR NEXT PHASES

- Frontend will consume these 12 APIs
- No breaking changes to existing attendance/assignment flows
- All operations use `batchMembership` helper

**Phase 3 Backend Complete ✅**
