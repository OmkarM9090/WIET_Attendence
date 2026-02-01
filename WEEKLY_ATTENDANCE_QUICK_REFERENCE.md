# Weekly Attendance Feature - Quick Reference

## What Changed?

### Before ❌
- Marking attendance twice for same session+date = **409 Conflict error**
- User saw raw HTTP error message
- No way to edit attendance
- Could not handle weekly sessions on different dates

### After ✅
- Marking attendance twice = **Shows Edit Modal**
- User-friendly message: "Attendance already marked. Do you want to edit?"
- Can edit absent students and regenerate report
- Weekly attendance supported (same session, different dates)

---

## API Quick Reference

### POST: Mark & Generate Attendance

```bash
curl -X POST http://localhost:5000/api/attendance/mark-and-generate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "teachingAssignmentId": "507f1f77bcf86cd799439011",
    "date": "2026-02-01",
    "absentRollNumbers": [9, 12, 15]
  }'
```

**Response (New Attendance):**
```json
{
  "success": true,
  "alreadyExists": false,
  "attendance": { ... },
  "reportText": "Watumull College...\nAbsent: 9, 12, 15"
}
```

**Response (Duplicate Detected):**
```json
{
  "success": true,
  "alreadyExists": true,
  "attendanceId": "507f1f77bcf86cd799439012",
  "message": "Attendance already marked for this session and date. Edit it to update?"
}
```

---

### PUT: Update Existing Attendance

```bash
curl -X PUT http://localhost:5000/api/attendance/update/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "absentRollNumbers": [9, 12]  # Updated list
  }'
```

**Response:**
```json
{
  "success": true,
  "attendance": { ... },
  "reportText": "Watumull College...\nAbsent: 9, 12",
  "message": "Attendance updated successfully"
}
```

---

## Frontend Flow

### User Story: First Time Marking

1. **Teacher navigates to:** `/teacher/mark-attendance`
2. **Selects:** Teaching session, date, absent students
3. **Clicks:** "Save Attendance & Generate Report"
4. **Response:** 
   - ✅ Report generated and displayed
   - ✅ Shows Copy and WhatsApp Share buttons

### User Story: Editing Attendance

1. **Teacher navigates to:** `/teacher/mark-attendance`
2. **Selects:** SAME session, SAME date, DIFFERENT students
3. **Clicks:** "Save Attendance & Generate Report"
4. **Modal appears:** 
   ```
   📝 Edit Attendance
   
   Attendance has already been marked for this session and date. 
   You can update the list of absent students and regenerate the report.
   
   ⚠️ Note: You can only edit attendance for today or yesterday.
   
   [Cancel]  [Edit Attendance]
   ```
5. **Clicks:** "Edit Attendance"
6. **Backend:** Updates absent students list, regenerates report
7. **Frontend:** Shows updated report

### User Story: Weekly Attendance

1. **Session 1:** Monday, Feb 1 → Mark attendance → Save ✅
2. **Session 2:** Wednesday, Feb 3 → Mark same session → Save ✅
3. **Result:** Two separate attendance records (no conflict)

---

## Key Concepts

### Duplicate Detection
- **What:** Checks if AttendanceSession exists for (teachingAssignmentId + date)
- **When:** On every POST request
- **Response:** Instead of error, returns `{alreadyExists: true, attendanceId}`
- **Result:** Frontend shows modal instead of error

### Edit Modal
- **Shows:** When `response.data.alreadyExists === true`
- **Action 1:** Click "Cancel" → Closes modal, user can modify students and retry
- **Action 2:** Click "Edit Attendance" → Calls PUT endpoint, updates record
- **Loading:** Shows "Updating..." text while API call in progress

### Weekly Attendance
- **Same Session:** Teacher (subject, class, time)
- **Different Dates:** Feb 1, Feb 3, Feb 5 (Mon, Wed, Fri)
- **Result:** Multiple AttendanceSession records created (one per date)
- **No Conflict:** Different date = no duplicate

---

## State Management (Frontend)

```javascript
// New states added:
const [showEditModal, setShowEditModal] = useState(false);
const [existingAttendanceId, setExistingAttendanceId] = useState(null);
const [isEditingExisting, setIsEditingExisting] = useState(false);

// When POST returns alreadyExists:
setExistingAttendanceId(response.data.attendanceId);
setShowEditModal(true);

// When user clicks Edit:
// PUT to /api/attendance/update/{attendanceId}
// Then setShowEditModal(false)
// Then setReportText(newReportText)
```

---

## Error Codes & Messages

| HTTP | Meaning | Solution |
|------|---------|----------|
| 200 `alreadyExists=true` | Duplicate found, allow edit | Show modal |
| 200 `alreadyExists=false` | New attendance saved | Show report |
| 400 | Invalid input, bad date, wrong roll | Check inputs |
| 403 | Not your session | Contact admin |
| 404 | Session not found | Select valid session |
| 500 | Server error | Check server logs |

---

## Code Snippets

### Handle Save Response (Frontend)
```javascript
const response = await axiosInstance.post(
  "/attendance/mark-and-generate",
  { teachingAssignmentId, date, absentRollNumbers }
);

if (response.data?.alreadyExists === true) {
  // Duplicate found - show edit modal
  setExistingAttendanceId(response.data.attendanceId);
  setShowEditModal(true);
} else if (response.data?.success) {
  // New attendance created - show report
  setReportText(response.data.reportText);
}
```

### Handle Edit Request (Frontend)
```javascript
const response = await axiosInstance.put(
  `/attendance/update/${existingAttendanceId}`,
  { absentRollNumbers }
);

if (response.data?.success) {
  setReportText(response.data.reportText);
  setShowEditModal(false);
}
```

### Duplicate Detection Query (Backend)
```javascript
const existing = await AttendanceSession.findOne({
  teachingAssignmentId,
  date: { $gte: sessionDate, $lt: nextDate }
});

if (existing) {
  return res.json({
    success: true,
    alreadyExists: true,
    attendanceId: existing._id
  });
}
```

---

## Testing Commands

### Test 1: New Attendance
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Run test
curl -X POST http://localhost:5000/api/attendance/mark-and-generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"teachingAssignmentId":"...", "date":"2026-02-01", "absentRollNumbers":[9]}'
```

### Test 2: Duplicate Detection
```bash
# Run same command again (should show alreadyExists: true)
curl -X POST http://localhost:5000/api/attendance/mark-and-generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"teachingAssignmentId":"...", "date":"2026-02-01", "absentRollNumbers":[10]}'

# Response should have:
# "alreadyExists": true,
# "attendanceId": "..."
```

### Test 3: Edit Attendance
```bash
# Update with PUT
curl -X PUT http://localhost:5000/api/attendance/update/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"absentRollNumbers":[9, 12]}'

# Response should have updated report text
```

### Test 4: Weekly Attendance
```bash
# Mark Session A on Feb 1
curl -X POST ... -d '{"teachingAssignmentId":"...", "date":"2026-02-01", ...}'
# Response: alreadyExists: false ✅

# Mark Session A on Feb 3 (different date)
curl -X POST ... -d '{"teachingAssignmentId":"...", "date":"2026-02-03", ...}'
# Response: alreadyExists: false ✅
```

---

## Files Modified

### Backend (2 files)
1. ✅ `backend/src/controllers/attendanceController.js`
   - Modified: `markAndGenerateAttendance()` - Returns alreadyExists instead of 409
   - Added: `updateAttendance()` - New function for PUT endpoint

2. ✅ `backend/src/routes/attendanceRoutes.js`
   - Added: `PUT /update/:attendanceId` route

### Frontend (1 file)
1. ✅ `frontend/src/pages/TeacherMarkAttendance.jsx`
   - Added: Edit modal state & UI
   - Modified: `handleSaveAttendance()` - Handle alreadyExists response
   - Added: `handleEditAttendance()` - PUT request logic
   - Added: `handleCancelEdit()` - Close modal logic

---

## Deployment Checklist

- [ ] Backend deployed (updated controllers & routes)
- [ ] Frontend deployed (updated TeacherMarkAttendance.jsx)
- [ ] Server restarted
- [ ] Browser cache cleared
- [ ] Test new attendance creation
- [ ] Test duplicate detection modal
- [ ] Test edit functionality
- [ ] Test weekly attendance (different dates)
- [ ] Verify error messages are user-friendly

---

## Common Issues & Solutions

**Q: Modal not showing when marking duplicate attendance?**
A: Check that backend returns `{alreadyExists: true}`. Enable browser DevTools Network tab.

**Q: Edit button doesn't work?**
A: Verify PUT endpoint route is registered. Check server logs for errors.

**Q: Can I edit attendance from 3 days ago?**
A: No, only today and yesterday are editable. This is by design.

**Q: Why does same session on different dates allow marking?**
A: That's weekly attendance - one session occurs multiple times per week.

**Q: Report text not updating after edit?**
A: Check that `setReportText(response.data.reportText)` is called in `handleEditAttendance()`.

---

## Key Validation Rules

✅ **Date Validation**
- Only today or yesterday allowed
- Editing only possible for today/yesterday

✅ **Teacher Authorization**
- Only assigned teacher can mark
- Only original or assigned teacher can edit

✅ **Roll Numbers**
- Must exist in student list
- Must be numeric
- Duplicates automatically removed

✅ **Session Type**
- LECTURE: All students
- PRACTICAL: Only batch students

✅ **Academic Year**
- Must be current academic year
- Validates both student and assignment year

---

**Implementation Status: ✅ COMPLETE**

All features implemented and ready for testing.
See `WEEKLY_ATTENDANCE_IMPLEMENTATION.md` for detailed documentation.
