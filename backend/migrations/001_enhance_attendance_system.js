/**
 * MIGRATION: Enhance Attendance System
 * Date: 2026-01-31
 * Description: Add new fields to AttendanceSession, Student, and Subject models
 * 
 * RUN THIS MIGRATION BEFORE DEPLOYING NEW CODE
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wiet_attendance';

const migrate = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // ============================================
    // 1. MIGRATE ATTENDANCESESSION COLLECTION
    // ============================================
    console.log('\n📋 Migrating AttendanceSession collection...');
    
    const attendanceSessionsCount = await db.collection('attendancesessions').countDocuments();
    console.log(`   Found ${attendanceSessionsCount} attendance sessions`);

    if (attendanceSessionsCount > 0) {
      // Update existing documents
      const result = await db.collection('attendancesessions').updateMany(
        { semester: { $exists: false } },
        [
          {
            $set: {
              semester: 1, // Default semester - UPDATE THIS AS NEEDED
              assignedTeacher: "$teacher", // Copy teacher to assignedTeacher
              isSubstitute: false,
              substituteReason: null,
              isExtraLecture: false,
              extraLectureReason: null,
              isCancelled: false,
              cancelReason: null,
              createdBy: "$teacher", // Copy teacher to createdBy
              isLocked: false
            }
          }
        ]
      );
      console.log(`   ✅ Updated ${result.modifiedCount} attendance sessions`);
    }

    // Create indexes
    console.log('   📇 Creating indexes for AttendanceSession...');
    await db.collection('attendancesessions').createIndex(
      { 
        date: 1, 
        subject: 1, 
        branch: 1, 
        year: 1, 
        division: 1, 
        academicYear: 1,
        semester: 1,
        sessionType: 1,
        batch: 1,
        isExtraLecture: 1
      },
      { 
        unique: true,
        partialFilterExpression: { isCancelled: false },
        name: 'attendance_unique_idx'
      }
    );
    await db.collection('attendancesessions').createIndex({ academicYear: 1, semester: 1 });
    await db.collection('attendancesessions').createIndex({ teacher: 1 });
    await db.collection('attendancesessions').createIndex({ isCancelled: 1 });
    console.log('   ✅ Indexes created');

    // ============================================
    // 2. MIGRATE STUDENT COLLECTION
    // ============================================
    console.log('\n👨‍🎓 Migrating Student collection...');
    
    const studentsCount = await db.collection('students').countDocuments();
    console.log(`   Found ${studentsCount} students`);

    if (studentsCount > 0) {
      // Update existing documents
      const result = await db.collection('students').updateMany(
        { status: { $exists: false } },
        {
          $set: {
            status: "active",
            admissionDate: new Date("2024-07-01") // Default admission date - UPDATE THIS AS NEEDED
          }
        }
      );
      console.log(`   ✅ Updated ${result.modifiedCount} students`);

      // Rename "dropped" to "dropout" if any exist
      const renameResult = await db.collection('students').updateMany(
        { status: "dropped" },
        { $set: { status: "dropout" } }
      );
      if (renameResult.modifiedCount > 0) {
        console.log(`   ✅ Renamed ${renameResult.modifiedCount} students from "dropped" to "dropout"`);
      }
    }

    // Create indexes
    console.log('   📇 Creating indexes for Student...');
    await db.collection('students').createIndex({ branch: 1, year: 1, division: 1, status: 1 });
    await db.collection('students').createIndex({ academicYear: 1, status: 1 });
    await db.collection('students').createIndex({ rollNo: 1, branch: 1 });
    await db.collection('students').createIndex({ admissionDate: 1 });
    console.log('   ✅ Indexes created');

    // ============================================
    // 3. MIGRATE SUBJECT COLLECTION
    // ============================================
    console.log('\n📚 Migrating Subject collection...');
    
    const subjectsCount = await db.collection('subjects').countDocuments();
    console.log(`   Found ${subjectsCount} subjects`);

    if (subjectsCount > 0) {
      // Update existing documents
      const result = await db.collection('subjects').updateMany(
        { scheme: { $exists: false } },
        {
          $set: {
            scheme: "NEP2020", // Default scheme
            credits: 4, // Default credits
            semesterStartDate: new Date("2024-07-01"), // UPDATE THIS AS NEEDED
            semesterEndDate: new Date("2024-11-30"), // UPDATE THIS AS NEEDED
            isActive: true
          }
        }
      );
      console.log(`   ✅ Updated ${result.modifiedCount} subjects`);
    }

    // Update indexes (drop old, create new)
    console.log('   📇 Updating indexes for Subject...');
    try {
      await db.collection('subjects').dropIndex('code_1_branch_1_semester_1');
    } catch (err) {
      console.log('   ℹ️  Old index not found (this is OK)');
    }
    await db.collection('subjects').createIndex(
      { code: 1, branch: 1, semester: 1, scheme: 1 },
      { unique: true, name: 'subject_unique_idx' }
    );
    await db.collection('subjects').createIndex({ isActive: 1 });
    console.log('   ✅ Indexes updated');

    // ============================================
    // 4. SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`   AttendanceSessions: ${attendanceSessionsCount} records`);
    console.log(`   Students: ${studentsCount} records`);
    console.log(`   Subjects: ${subjectsCount} records`);
    console.log('\n⚠️  IMPORTANT: Review the default values set in this migration:');
    console.log('   - AttendanceSession.semester = 1 (update as needed)');
    console.log('   - Student.admissionDate = 2024-07-01 (update as needed)');
    console.log('   - Subject.semesterStartDate = 2024-07-01 (update as needed)');
    console.log('   - Subject.semesterEndDate = 2024-11-30 (update as needed)');
    console.log('\n📝 Next Steps:');
    console.log('   1. Update default values in this script if needed');
    console.log('   2. Re-run migration if values changed');
    console.log('   3. Test API endpoints with new fields');
    console.log('   4. Deploy new code');
    console.log('');

  } catch (error) {
    console.error('❌ MIGRATION FAILED:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration
migrate();
