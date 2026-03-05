const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const User = require('../models/User');
const Hospital = require('../models/Hospital');

async function seedDemoUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_blood_management');
    console.log('Connected to MongoDB');

    // Get first hospital for staff assignment
    const hospital = await Hospital.findOne();

    // Delete existing demo users to recreate them
    await User.deleteOne({ email: 'drrajeshku0@hospital.com' });
    await User.deleteOne({ email: 'ravi.teja@gmail.com' });

    // Create demo staff user - password will be hashed by pre-save hook
    {
      await User.create({
        name: 'Dr. Rajesh Kumar',
        email: 'drrajeshku0@hospital.com',
        password: 'staff123',
        phone: '9876500000',
        role: 'staff',
        bloodGroup: 'A+',
        hospital: hospital?._id,
        department: 'General Medicine',
        isApproved: true,
        isActive: true,
        address: {
          street: 'Budhawarpet Road',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518002'
        }
      });
      console.log('✅ Created demo staff: drrajeshku0@hospital.com / staff123');
    }

    // Create demo regular user - password will be hashed by pre-save hook
    {
      await User.create({
        name: 'Ravi Teja',
        email: 'ravi.teja@gmail.com',
        password: 'user123',
        phone: '9876543210',
        role: 'user',
        bloodGroup: 'B+',
        isApproved: true,
        isActive: true,
        address: {
          street: 'Near Bus Stand',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518001'
        },
        emergencyContact: {
          name: 'Sita Devi',
          phone: '9876543211',
          relation: 'Mother'
        }
      });
      console.log('✅ Created demo user: ravi.teja@gmail.com / user123');
    }

    console.log('\n✅ Demo users ready!');
    console.log('Admin:  admin@hospital.com / admin123');
    console.log('Staff:  drrajeshku0@hospital.com / staff123');
    console.log('User:   ravi.teja@gmail.com / user123');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDemoUsers();
