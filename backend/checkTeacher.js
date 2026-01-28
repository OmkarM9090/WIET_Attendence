// Quick Database Check Script
// Run this to verify if teacher exists

import mongoose from 'mongoose';
import Teacher from './src/models/Teacher.js';
import User from './src/models/User.js';

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://omkarm842584:omkar12345@cluster0.okt6udk.mongodb.net/Attendance?appName=Cluster0');

async function checkTeacher() {
  try {
    // Get all users
    const users = await User.find({});
    console.log('\n=== ALL USERS ===');
    users.forEach(u => console.log(`${u.role}: ${u.email} (ID: ${u._id})`));

    // Get all teachers
    const teachers = await Teacher.find({}).populate('userId');
    console.log('\n=== ALL TEACHERS ===');
    if (teachers.length === 0) {
      console.log('⚠️  NO TEACHERS FOUND IN DATABASE!');
      console.log('You need to create a teacher first using Admin panel');
    } else {
      teachers.forEach(t => {
        console.log(`Teacher: ${t.userId?.name || 'Unknown'}`);
        console.log(`  User ID: ${t.userId?._id}`);
        console.log(`  Email: ${t.userId?.email}`);
        console.log(`  Teacher ID: ${t._id}\n`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTeacher();
