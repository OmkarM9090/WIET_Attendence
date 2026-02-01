# Weekly Attendance Feature - Testing Guide

## Test Environment Setup

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173` (or development server)
- Database with test data
- Authentication token for teacher account

### Sample Test Data
```
Academic Year: 2025-2026
Teacher: test.teacher@college.edu
Session: Mathematics - Class 3A - Monday 10:00-11:00
Students: 60 (Roll No 1-60)
Date: Today or Yesterday (Feb 1-2, 2026)
```

---

## Test Case 1: New Attendance Creation

### Test 1.1: Mark Attendance for First Time

**Preconditions:**
- Teacher logged in
- No attendance marked for this session today
- At least one student selected as absent

**Steps:**
1. Navigate to `/teacher/mark-attendance`
2. Select teaching session from dropdown
3. Ensure date shows today
4. Select 3-5 students as absent (e.g., roll 9, 12, 15)
5. Click "Save Attendance & Generate Report"

**Expected Results:**
```
✅ API returns:
   {
     success: true,
     alreadyExists: false,
     attendance: {...},
     reportText: "Watumull College..."
   }

✅ Frontend displays:
   - ReportPreview component visible
   - Report text with formatted content
   - Copy button functional
   - WhatsApp share button functional
   - No modal shown (alreadyExists = false)
```

**Error Scenarios:**
- No students selected → Show error: "Please select students"
- Invalid date → Show error: "Cannot mark for future dates"
- No session selected → Show error: "Please select a session"

---

## Test Case 2: Duplicate Detection & Edit Modal

### Test 2.1: Attempt to Mark Same Session Same Date Again

**Preconditions:**
- Attendance already marked for session A on Feb 1
- Trying to mark same session A on Feb 1 (duplicate)

**Steps:**
1. Navigate to `/teacher/mark-attendance`
2. Select SAME session as Test 1.1
3. Select SAME date (today)
4. Select DIFFERENT students as absent (e.g., roll 20, 25, 30)
5. Click "Save Attendance & Generate Report"

**Expected Results:**
```
✅ API returns:
   {
     success: true,
     alreadyExists: true,
     attendanceId: "507f1f77bcf86cd799439013",
     message: "Attendance already marked..."
   }

✅ Frontend displays:
   - Modal overlay appears (centered, semi-transparent background)
   - Modal title: "📝 Edit Attendance"
   - Modal message: "Attendance has already been marked..."
   - Warning box: "⚠️ You can only edit attendance for today or yesterday"
   - Two buttons: "Cancel" and "Edit Attendance"
   - No error alert shown
```

**UI Details to Verify:**
- Modal is centered on screen
- Background is darkened (opacity ~0.5)
- Modal has white background with rounded corners
- Text is readable and properly formatted
- Buttons are properly spaced

---

## Test Case 3: Edit Attendance - Accept

### Test 3.1: Click "Edit Attendance" Button

**Preconditions:**
- Edit modal is showing (from Test 2.1)
- attendanceId is captured

**Steps:**
1. With modal open, click "Edit Attendance" button
2. Observe loading state
3. Wait for API response

**Expected Results:**
```
✅ During API call:
   - Button shows "Updating..." text
   - Button is disabled (cursor: not-allowed)
   - Modal remains visible during request

✅ After success (HTTP 200):
   - Modal closes automatically
   - ReportPreview displays with updated report
   - Report shows NEW absent students (roll 20, 25, 30)
   - Original report is replaced with updated one
   - No error message shown
   - Report contains:
     * Updated roll numbers
     * Correct student names
     * Proper formatting
     * WhatsApp-compatible text
```

**Verify Report Content:**
```
Watumull College of Engineering and Technology

Daily Attendance Report

Class: TE Div A
Subject: Mathematics
Date: 01-02-2026
Time: 10:00 to 11:00
Teacher: [Teacher Name]

Absent Students:
Roll No   Name
20        [Student Name]
25        [Student Name]
30        [Student Name]
```

---

## Test Case 4: Edit Attendance - Cancel

### Test 4.1: Click "Cancel" Button in Modal

**Preconditions:**
- Edit modal is showing (from Test 2.1)

**Steps:**
1. With modal open, click "Cancel" button
2. Observe modal behavior
3. Check if student selection is preserved

**Expected Results:**
```
✅ Modal behavior:
   - Modal closes immediately
   - No API call made
   - No report generated
   - Backend not contacted

✅ Frontend state:
   - Selected absent students preserved
   - Ability to modify selection retained
   - Can click "Save" again with new selection
   - Can edit student list and retry

✅ User can then:
   1. Change student selection (e.g., mark different students absent)
   2. Click "Save Attendance" again
   3. Either edit again or accept changes
```

---

## Test Case 5: Weekly Attendance

### Test 5.1: Mark Same Session on Different Dates

**Preconditions:**
- Session A marked on Feb 1 (Monday) - DONE
- Now trying to mark Session A on Feb 3 (Wednesday)

**Steps:**
1. Navigate to `/teacher/mark-attendance`
2. Select SAME session A as before
3. Change date to Feb 3 (different date)
4. Select absent students (e.g., roll 5, 10)
5. Click "Save Attendance & Generate Report"

**Expected Results:**
```
✅ API returns:
   {
     success: true,
     alreadyExists: false,  ← Note: false (different date!)
     attendance: {...},
     reportText: "..."
   }

✅ Frontend displays:
   - Report generated (NOT modal)
   - No duplicate error
   - Attendance saved for Feb 3
   - Separate from Feb 1 attendance

✅ Database state:
   - Two AttendanceSession records exist:
     * Session A on Feb 1 with students [20, 25, 30]
     * Session A on Feb 3 with students [5, 10]
   - No conflicts
   - No duplicate detected
```

**Verify Weekly Pattern:**
```
Session A (Monday 10:00-11:00)
├─ Feb 1 (Monday): Absent [20, 25, 30]
├─ Feb 3 (Wednesday): Absent [5, 10]
└─ Feb 5 (Friday): Try marking again
   └─ Should NOT show duplicate modal (different date)
```

---

## Test Case 6: Date Validation

### Test 6.1: Future Date Validation

**Preconditions:**
- Today is Feb 1, 2026

**Steps:**
1. Navigate to `/teacher/mark-attendance`
2. Select session
3. Try to select Feb 3 (tomorrow) in date picker
4. Observe date picker behavior

**Expected Results:**
```
✅ Date picker:
   - Cannot select future dates
   - Feb 3 date appears disabled
   - Clicking disabled date shows no change
   - Error message: "Cannot mark for future dates"

✅ Alternate flow:
   - If date validation is client-side, max attribute prevents selection
   - If date validation is server-side, error shown after click
```

### Test 6.2: Old Date Validation

**Steps:**
1. Try to select Jan 30, 2026 (3 days ago)
2. Observe date picker behavior

**Expected Results:**
```
✅ Date picker:
   - Cannot select dates before yesterday
   - Jan 30 date appears disabled
   - Error message: "Cannot mark for dates older than yesterday"

✅ Min date:
   - Yesterday's date is minimum allowed
   - Today's date is maximum allowed
```

### Test 6.3: Edit Old Attendance

**Preconditions:**
- Attendance marked for Jan 30 (old date)

**Steps:**
1. Try to edit attendance from Jan 30
2. Click "Edit Attendance" in modal
3. Submit updated attendance

**Expected Results:**
```
✅ API validation:
   - PUT request rejected
   - Status: 400
   - Message: "Can only edit attendance for today or yesterday"
   - Modal remains open
   - Error displayed to user
```

---

## Test Case 7: Authorization & Permission

### Test 7.1: Non-Assigned Teacher Cannot Mark

**Preconditions:**
- Logged in as Teacher B
- Session belongs to Teacher A

**Steps:**
1. Try to select Teacher A's session from dropdown
2. Session should NOT appear in dropdown
3. If somehow accessed, try to save attendance

**Expected Results:**
```
✅ Authorization:
   - Session not visible in dropdown (filtered by teacher ID)
   - If API called directly, error returned:
     {status: 403, message: "You are not authorized..."}
```

### Test 7.2: Substitute Teacher Can Mark

**Preconditions:**
- Substitute teacher marked for specific lecture

**Steps:**
1. Substitute logs in
2. Selects the assigned lecture
3. Marks attendance

**Expected Results:**
```
✅ Behavior:
   - Attendance saved successfully
   - `teacher` field set to substitute ID
   - `isSubstitute` flag can be set to true
   - Attendance tracked properly
```

---

## Test Case 8: Roll Number Validation

### Test 8.1: Invalid Roll Numbers

**Preconditions:**
- Student has 60 students (roll 1-60)

**Steps:**
1. Manually enter roll numbers: "9, 99, 12" (99 doesn't exist)
2. Click "Save Attendance"

**Expected Results:**
```
✅ Validation:
   - Error message: "Invalid roll numbers: 99"
   - Attendance not saved
   - Report not generated
   - User can correct input
```

### Test 8.2: Duplicate Roll Numbers

**Steps:**
1. Manually enter roll numbers: "9, 9, 12" (9 repeated)
2. Click "Save Attendance"

**Expected Results:**
```
✅ Handling:
   - Duplicates automatically removed
   - Only one instance of roll 9 marked absent
   - Attendance saved with [9, 12]
   - Report shows: 2 absent students (not 3)
```

### Test 8.3: Non-Batch Students in PRACTICAL

**Preconditions:**
- PRACTICAL session for Batch A
- Student roll 25 is in Batch B

**Steps:**
1. Select PRACTICAL session for Batch A
2. Try to mark roll 25 (Batch B) as absent
3. Click "Save Attendance"

**Expected Results:**
```
✅ Validation:
   - Error: "Invalid roll numbers: 25"
   - Only Batch A students shown in checkbox list
   - Cannot mark Batch B students for Batch A practical
```

---

## Test Case 9: WhatsApp Report Integration

### Test 9.1: Copy Report Button

**Preconditions:**
- Report is displayed (after successful save/edit)

**Steps:**
1. Click "Copy Report" button
2. Open WhatsApp Web or notes app
3. Paste (Ctrl+V / Cmd+V)

**Expected Results:**
```
✅ Clipboard:
   - Full report text copied
   - Formatting preserved:
     * Bold text (*text* format)
     * Column alignment
     * Proper line breaks
   - No HTML or extra characters

✅ Paste result:
   - WhatsApp: Text appears with bold formatting
   - Notes: Plain text with alignment
```

### Test 9.2: WhatsApp Share Button

**Preconditions:**
- Report is displayed

**Steps:**
1. Click "Share on WhatsApp" button
2. Browser opens WhatsApp Web (or redirect)

**Expected Results:**
```
✅ Behavior:
   - wa.me/?text=... URL opens
   - Report text is URL-encoded
   - WhatsApp Web loads with pre-filled message
   - Can send message directly

✅ Message quality:
   - All content visible
   - No truncation
   - Formatting intact
```

---

## Test Case 10: Error Handling

### Test 10.1: Network Error

**Steps:**
1. Turn off internet/simulate network failure
2. Click "Save Attendance"
3. Wait for timeout

**Expected Results:**
```
✅ Error handling:
   - Clear error message shown
   - Not raw network error
   - User-friendly language
   - Example: "Failed to save attendance. Check connection."
```

### Test 10.2: Server Error (500)

**Steps:**
1. Intentionally cause server error (e.g., invalid data)
2. Click "Save Attendance"

**Expected Results:**
```
✅ Error response:
   - Status: 500
   - Message: "Server error" or specific reason
   - User told to contact support if needed
```

### Test 10.3: Session Not Found

**Steps:**
1. Delete assignment from database
2. Try to mark attendance for that session

**Expected Results:**
```
✅ Error handling:
   - Status: 404
   - Message: "Teaching assignment not found"
   - Dropdown updated (assignment removed)
```

---

## Test Case 11: UI/UX Verification

### Test 11.1: Modal Appearance

**Steps:**
1. Trigger edit modal (from Test 2.1)
2. Verify all UI elements

**Expected Results:**
```
✅ Visual verification:
   - Modal centered on screen ✓
   - Dark overlay behind modal ✓
   - White background for modal ✓
   - Rounded corners (12px) ✓
   - Proper padding (32px) ✓
   - Shadow effect ✓
   - Text readable ✓
   - Icons visible (📝, ⚠️) ✓
   - Buttons properly aligned ✓
   - No text overflow ✓
   - Responsive on mobile ✓
```

### Test 11.2: Loading States

**Steps:**
1. Click "Save Attendance"
2. Immediately check button

**Expected Results:**
```
✅ Button states:
   - Text changes to "Saving..." ✓
   - Button disabled (cursor: not-allowed) ✓
   - Cannot click multiple times ✓
   - State persists until response ✓

✅ Modal button states:
   - Text changes to "Updating..." ✓
   - Button disabled ✓
   - Cancel button also disabled ✓
```

### Test 11.3: Error Alert Styling

**Steps:**
1. Trigger error (invalid roll number)
2. Observe error display

**Expected Results:**
```
✅ Alert appearance:
   - Red background color ✓
   - Error icon (🚨 or similar) ✓
   - Title: "Error" ✓
   - Description: Specific message ✓
   - Clear and readable ✓
   - Proper spacing ✓
```

---

## Test Case 12: Student List Filtering

### Test 12.1: LECTURE Session

**Steps:**
1. Select LECTURE session
2. Observe student list

**Expected Results:**
```
✅ Student list:
   - All students in class shown (60)
   - No batch column shown
   - Roll numbers 1-60 displayed
   - Checkboxes for selection
   - Real-time count updates
```

### Test 12.2: PRACTICAL Session

**Steps:**
1. Select PRACTICAL session for Batch A
2. Observe student list

**Expected Results:**
```
✅ Student list:
   - Only Batch A students shown (e.g., 30)
   - Batch column shown in table
   - All entries show "Batch A"
   - No Batch B students visible
   - Count reflects batch size (30)
```

---

## Test Case 13: Real-Time Counts

### Test 13.1: Present/Absent Counts

**Steps:**
1. Start with no students selected
2. Click checkboxes one by one
3. Observe counters

**Expected Results:**
```
✅ Count updates:
   - Initially: Present: 60, Absent: 0
   - After checking roll 9: Present: 59, Absent: 1
   - After checking roll 12: Present: 58, Absent: 2
   - Counts always sum to total (60)
```

### Test 13.2: Bulk Add via Roll Numbers

**Steps:**
1. Enter "9, 12, 15" in roll number input
2. Click "Add" button

**Expected Results:**
```
✅ Bulk addition:
   - Checkboxes for rolls 9, 12, 15 get checked
   - Count updates: Present: 57, Absent: 3
   - Roll number field clears
   - Can add more via field
   - Can remove individually by unchecking
```

---

## Performance Testing

### Test 14.1: API Response Time

**Steps:**
1. Open browser DevTools → Network tab
2. Click "Save Attendance"
3. Monitor response time

**Expected Results:**
```
✅ Response times:
   - New attendance: < 100ms (including report generation)
   - Duplicate check: < 20ms
   - Edit attendance: < 100ms
   - Error responses: < 50ms
```

### Test 14.2: Modal Rendering

**Steps:**
1. Trigger modal (alreadyExists response)
2. Measure render time

**Expected Results:**
```
✅ Frontend performance:
   - Modal appears instantly (< 50ms)
   - No UI lag
   - Smooth transitions
   - No layout shift
```

---

## Browser Compatibility

### Test 15.1: Chrome/Edge

**Steps:**
1. Open in Chrome/Edge
2. Run all test cases

**Expected Results:**
```
✅ Chrome 90+:
   - All features work ✓
   - Modal displays correctly ✓
   - Copy to clipboard works ✓
   - WhatsApp link works ✓
```

### Test 15.2: Firefox

**Steps:**
1. Open in Firefox
2. Run key test cases

**Expected Results:**
```
✅ Firefox 88+:
   - All features work ✓
   - Modal styling correct ✓
   - No console errors ✓
```

### Test 15.3: Mobile (iOS Safari / Chrome Mobile)

**Steps:**
1. Open on mobile device
2. Run test cases

**Expected Results:**
```
✅ Mobile responsiveness:
   - Modal fits on screen ✓
   - Touch interactions work ✓
   - Modal can be dismissed ✓
   - WhatsApp share opens app ✓
```

---

## Test Execution Matrix

| Test Case | Priority | Status | Notes |
|-----------|----------|--------|-------|
| 1.1 | HIGH | [ ] | New attendance |
| 2.1 | HIGH | [ ] | Duplicate detection |
| 3.1 | HIGH | [ ] | Edit acceptance |
| 4.1 | HIGH | [ ] | Edit cancellation |
| 5.1 | HIGH | [ ] | Weekly attendance |
| 6.1-6.3 | MEDIUM | [ ] | Date validation |
| 7.1-7.2 | MEDIUM | [ ] | Authorization |
| 8.1-8.3 | MEDIUM | [ ] | Roll validation |
| 9.1-9.2 | MEDIUM | [ ] | WhatsApp integration |
| 10.1-10.3 | MEDIUM | [ ] | Error handling |
| 11.1-11.3 | LOW | [ ] | UI/UX verification |
| 12.1-12.2 | LOW | [ ] | Student filtering |
| 13.1-13.2 | LOW | [ ] | Real-time counts |
| 14.1-14.2 | LOW | [ ] | Performance |
| 15.1-15.3 | LOW | [ ] | Browser compatibility |

---

## Test Report Template

```
Test Case: [Number & Name]
Date: [Date]
Tester: [Name]
Status: [PASS / FAIL]

Expected Results:
[List what should happen]

Actual Results:
[What actually happened]

Screenshots/Logs:
[Attach evidence]

Notes:
[Any additional observations]

Recommendation:
[Ready for production / Needs fixes]
```

---

## Sign-Off Checklist

Before marking as complete:
- [ ] All HIGH priority tests passed
- [ ] All MEDIUM priority tests passed
- [ ] At least 50% of LOW priority tests passed
- [ ] No critical bugs found
- [ ] Error messages are user-friendly
- [ ] Performance is acceptable
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing done

---

**Testing Guide Complete**

Use this guide to validate all features of the weekly attendance enhancement.
