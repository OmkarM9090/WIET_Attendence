# Phase 2 Verification Plan

This document covers the database and model changes for practical batch management.

## Scope

- `Batch.js` enhanced model
- `Student.js` dual batch support
- `batchMembership.js` shared helper
- `migrateBatchStudents.js` migration script
- `verifyBatchIntegrity.js` integrity checker

## Manual Tests

1. Existing students still show the correct batch.
   - Open a student record that already has a legacy `batch`.
   - Confirm the student still loads normally.
   - Confirm existing attendance pages still display that student without crashing.

2. Existing attendance sessions still work.
   - Load an old lecture session.
   - Load an old practical session.
   - Confirm the session detail page and history page still open.

3. Reports still generate correctly.
   - Run teacher attendance history.
   - Run monthly attendance and defaulter views.
   - Confirm no batch-related errors appear for legacy sessions.

4. Excel files still work.
   - Download Excel for a lecture session.
   - Download Excel for a practical session.
   - Confirm the file is generated and opens correctly.

5. Old batch names still resolve.
   - Test a student/session/batch record that still stores batch data in legacy form.
   - Confirm the helper can resolve batch membership using either batch ObjectId or batch name.

6. Many-to-many membership works.
   - Add one student to two practical batches.
   - Confirm both batches show the student.
   - Confirm `Student.practicalBatches` contains both batch ids.

7. Merged batch works.
   - Create or inspect a merged batch like `BA3-BB1`.
   - Confirm the batch can hold students from both divisions.
   - Confirm the batch model stores `divisions` and `students` cleanly.

## Automated Checks

1. Migration dry-run report.
   - Command: `node backend/src/scripts/migrateBatchStudents.js --dry-run`
   - Expected: no data changes, clear summary of proposed updates, unresolved references, and sample planned updates.

2. Migration apply run.
   - Command: `node backend/src/scripts/migrateBatchStudents.js --apply`
   - Expected: `Batch.students` and `Student.practicalBatches` are populated where possible.
   - Expected: no duplicate links created because `$addToSet` is used.

3. Integrity report.
   - Command: `node backend/src/scripts/verifyBatchIntegrity.js`
   - Expected: read-only summary of empty batches, orphan references, attendance issues, and mismatches.

4. Model import checks.
   - Import `Batch.js`, `Student.js`, and `batchMembership.js`.
   - Expected: all modules load without side effects.

## Backward Compatibility Checks

- Existing attendance sessions with `batch` as ObjectId must still read.
- Existing attendance sessions with `batch` as string name must still be detectable by the integrity checker.
- Existing lectures with `batch = null` must remain valid.
- Existing student records with only the legacy `batch` field must still work.
- Existing teacher assignment flows must continue to save and load.

## Rollback Plan

1. Stop the app before migration if anything unexpected appears.
2. Restore the MongoDB snapshot or Atlas backup taken before the migration.
3. If only the migration script was applied, remove newly added links using the same student/batch pairs.
4. Re-run `verifyBatchIntegrity.js` after rollback to confirm the dataset is clean again.

## Success Criteria

- No import errors in the new model/helper files.
- No destructive database changes during dry-run.
- `Batch.students` is populated for legacy students where a matching batch exists.
- `Student.practicalBatches` is populated for migrated students.
- No existing attendance or report flow breaks on legacy data.
- Integrity checker produces a readable report with actionable issues.

## Notes

- The migration is intentionally gradual.
- Legacy `Student.batch` is preserved during this phase.
- The helper functions should be used as the single source of truth in later attendance and reporting updates.
