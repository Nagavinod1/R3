const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Bed = require('../models/Bed');
const BloodUnit = require('../models/BloodUnit');
const BedBooking = require('../models/BedBooking');
const BloodRequest = require('../models/BloodRequest');
const EmergencyAlert = require('../models/EmergencyAlert');
const BlockchainTransaction = require('../models/BlockchainTransaction');

async function reseedAll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_blood_management');
    console.log('Connected to MongoDB\n');

    // ========== STEP 1: CLEAR ALL COLLECTIONS ==========
    console.log('🗑️  Clearing all collections...');
    await Promise.all([
      User.deleteMany({}),
      Hospital.deleteMany({}),
      Bed.deleteMany({}),
      BloodUnit.deleteMany({}),
      BedBooking.deleteMany({}),
      BloodRequest.deleteMany({}),
      EmergencyAlert.deleteMany({}),
      BlockchainTransaction.deleteMany({})
    ]);
    console.log('✅ All collections cleared\n');

    const salt = await bcrypt.genSalt(10);

    // ========== STEP 2: CREATE ADMIN USER ==========
    console.log('👑 Creating admin user...');
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@hospital.com',
      password: 'admin123',
      phone: '9999999999',
      role: 'admin',
      isApproved: true,
      isActive: true,
      bloodGroup: 'O+',
      address: {
        street: 'Admin Office, Kurnool Medical Complex',
        city: 'Kurnool',
        district: 'Kurnool',
        state: 'Andhra Pradesh',
        pincode: '518002'
      }
    });
    console.log('✅ Admin: admin@hospital.com / admin123\n');

    // ========== STEP 3: CREATE HOSPITALS ==========
    console.log('🏥 Creating hospitals...');
    const hospitals = await Hospital.insertMany([
      {
        name: 'Government General Hospital (GGH) Kurnool',
        registrationNumber: 'GGH-AP-KNL-001',
        address: { street: 'Budhawarpet Road', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518002' },
        phone: '08518-255160', email: 'ggh.kurnool@hospital.com',
        type: 'government', hasBloodBank: true, hasEmergency: true,
        totalBeds: 250, availableBeds: 85, rating: 4.2, isApproved: true, isActive: true, admin: adminUser._id
      },
      {
        name: 'Kurnool Medical College Teaching Hospital',
        registrationNumber: 'KMC-AP-KNL-002',
        address: { street: 'Kurnool Medical College Campus', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518002' },
        phone: '08518-255160', email: 'kmc_knl@nic.in',
        type: 'government', hasBloodBank: true, hasEmergency: true,
        totalBeds: 300, availableBeds: 95, rating: 4.5, isApproved: true, isActive: true, admin: adminUser._id
      },
      {
        name: 'Apollo Medical Centre Kurnool',
        registrationNumber: 'APL-AP-KNL-003',
        address: { street: 'NR Peta Area', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518004' },
        phone: '08518-200100', email: 'apollo.kurnool@hospital.com',
        type: 'private', hasBloodBank: true, hasEmergency: true,
        totalBeds: 150, availableBeds: 45, rating: 4.6, isApproved: true, isActive: true, admin: adminUser._id
      },
      {
        name: 'Venkateswara Hospital',
        registrationNumber: 'VNK-AP-KNL-004',
        address: { street: 'Kurnool Bazar Area', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518001' },
        phone: '08518-200200', email: 'venkateswara.kurnool@hospital.com',
        type: 'private', hasBloodBank: true, hasEmergency: true,
        totalBeds: 100, availableBeds: 35, rating: 4.3, isApproved: true, isActive: true, admin: adminUser._id
      },
      {
        name: 'Asha Children\'s Hospital',
        registrationNumber: 'ACH-AP-KNL-005',
        address: { street: 'Budhawarpet Area', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518002' },
        phone: '08518-200300', email: 'asha.children.kurnool@hospital.com',
        type: 'private', hasBloodBank: false, hasEmergency: true,
        totalBeds: 60, availableBeds: 20, rating: 4.4, isApproved: true, isActive: true, admin: adminUser._id
      },
      {
        name: 'KIMS Hospital Kurnool',
        registrationNumber: 'KIMS-AP-KNL-006',
        address: { street: 'One Town Area', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518001' },
        phone: '08518-200400', email: 'kims.kurnool@hospital.com',
        type: 'private', hasBloodBank: true, hasEmergency: true,
        totalBeds: 200, availableBeds: 65, rating: 4.7, isApproved: true, isActive: true, admin: adminUser._id
      },
      {
        name: 'Omni Hospital Kurnool',
        registrationNumber: 'OMN-AP-KNL-007',
        address: { street: 'NR Peta', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518004' },
        phone: '08518-200500', email: 'omni.kurnool@hospital.com',
        type: 'private', hasBloodBank: true, hasEmergency: true,
        totalBeds: 120, availableBeds: 40, rating: 4.4, isApproved: true, isActive: true, admin: adminUser._id
      },
      {
        name: 'Sree Ashwini Hospital',
        registrationNumber: 'SAH-AP-KNL-008',
        address: { street: 'Shilpa Birla Area', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518002' },
        phone: '08518-200600', email: 'ashwini.kurnool@hospital.com',
        type: 'private', hasBloodBank: true, hasEmergency: true,
        totalBeds: 80, availableBeds: 28, rating: 4.3, isApproved: true, isActive: true, admin: adminUser._id
      },
      {
        name: 'Sri Balaji Nursing Home',
        registrationNumber: 'SBN-AP-KNL-009',
        address: { street: 'Kurnool Bazar', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518001' },
        phone: '08518-200700', email: 'balaji.kurnool@hospital.com',
        type: 'private', hasBloodBank: false, hasEmergency: false,
        totalBeds: 40, availableBeds: 15, rating: 4.1, isApproved: true, isActive: true, admin: adminUser._id
      },
      {
        name: 'Aarka Hospital',
        registrationNumber: 'ARK-AP-KNL-010',
        address: { street: 'Budhawarpet', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518002' },
        phone: '08518-200800', email: 'aarka.kurnool@hospital.com',
        type: 'private', hasBloodBank: true, hasEmergency: true,
        totalBeds: 90, availableBeds: 30, rating: 4.2, isApproved: true, isActive: true, admin: adminUser._id
      }
    ]);
    console.log(`✅ Created ${hospitals.length} hospitals\n`);

    // ========== STEP 4: CREATE BEDS ==========
    console.log('🛏️  Creating beds...');
    const bedTypes = ['general', 'semi-private', 'private', 'ICU', 'emergency', 'maternity', 'pediatric'];
    const bedsToCreate = [];
    for (const hospital of hospitals) {
      for (let i = 1; i <= 30; i++) {
        const bedType = bedTypes[Math.floor(Math.random() * bedTypes.length)];
        const isAvailable = Math.random() > 0.3;
        const prefix = bedType === 'ICU' ? 'ICU' : bedType.charAt(0).toUpperCase();
        const wardNames = {
          'general': 'General Ward', 'semi-private': 'Semi-Private Ward', 'private': 'Private Wing',
          'ICU': 'Intensive Care Unit', 'emergency': 'Emergency Ward',
          'maternity': 'Maternity Ward', 'pediatric': 'Pediatric Ward'
        };
        bedsToCreate.push({
          bedNumber: `${prefix}-${String(i).padStart(3, '0')}`,
          ward: wardNames[bedType] || 'General Ward',
          floor: Math.ceil(i / 10),
          type: bedType,
          hospital: hospital._id,
          status: isAvailable ? 'available' : 'occupied',
          isAvailable: isAvailable,
          pricePerDay: bedType === 'ICU' ? 8000 : bedType === 'private' ? 5000 : bedType === 'semi-private' ? 3500 : 3000,
          hasOxygen: ['ICU', 'emergency', 'CCU'].includes(bedType) || Math.random() > 0.5,
          hasVentilator: ['ICU', 'CCU'].includes(bedType) || Math.random() > 0.8,
          hasMonitor: ['ICU', 'emergency', 'CCU'].includes(bedType) || Math.random() > 0.6
        });
      }
    }
    await Bed.insertMany(bedsToCreate);
    console.log(`✅ Created ${bedsToCreate.length} beds\n`);

    // ========== STEP 5: CREATE BLOOD UNITS ==========
    console.log('🩸 Creating blood units...');
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodUnitsToCreate = [];
    for (const hospital of hospitals) {
      if (!hospital.hasBloodBank) continue;
      for (const bloodGroup of bloodGroups) {
        const quantity = Math.floor(Math.random() * 30) + 5;
        const collectionDate = new Date();
        collectionDate.setDate(collectionDate.getDate() - Math.floor(Math.random() * 15));
        const expiryDate = new Date(collectionDate);
        expiryDate.setDate(expiryDate.getDate() + 42);
        const donorNum = Math.floor(Math.random() * 9000) + 1000;
        bloodUnitsToCreate.push({
          bloodGroup, quantity,
          hospital: hospital._id,
          collectionDate,
          expiryDate,
          componentType: 'whole_blood',
          status: 'available',
          addedBy: adminUser._id,
          storageLocation: `Refrigerator ${Math.floor(Math.random() * 5) + 1}`,
          donorInfo: {
            bloodDonationId: `DON-${bloodGroup.replace('+', 'P').replace('-', 'N')}-${donorNum}`
          },
          history: [{ action: 'added', performedBy: adminUser._id, timestamp: new Date() }]
        });
      }
    }
    await BloodUnit.insertMany(bloodUnitsToCreate);
    console.log(`✅ Created ${bloodUnitsToCreate.length} blood units (across ${hospitals.filter(h => h.hasBloodBank).length} hospitals with blood banks)\n`);

    // ========== STEP 6: CREATE STAFF USERS ==========
    console.log('👨‍⚕️ Creating staff users...');
    const staffNames = [
      'Dr. Rajesh Kumar', 'Dr. Priya Sharma', 'Dr. Venkat Rao', 'Dr. Lakshmi Devi',
      'Nurse Sunitha', 'Nurse Kavitha', 'Nurse Ramya', 'Nurse Anjali',
      'Dr. Srinivas Reddy', 'Dr. Padma Kumari', 'Dr. Anil Kumar', 'Dr. Swathi',
      'Nurse Bhavani', 'Nurse Divya', 'Nurse Rekha', 'Nurse Saritha',
      'Dr. Mahesh Babu', 'Dr. Anusha', 'Dr. Krishna Murthy', 'Dr. Radha',
      'Nurse Jyothi', 'Nurse Madhavi', 'Nurse Lavanya', 'Nurse Surekha',
      'Dr. Ramana', 'Dr. Vijaya', 'Dr. Naresh', 'Dr. Sujatha',
      'Nurse Prasanna', 'Nurse Keerthi'
    ];
    const departments = ['General Medicine', 'Emergency', 'ICU', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Gynecology', 'Neurology'];
    const staffUsers = [];
    let staffIndex = 0;

    for (const hospital of hospitals) {
      const staffCount = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < staffCount && staffIndex < staffNames.length; i++) {
        const staffName = staffNames[staffIndex];
        const emailName = staffName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 10);
        staffUsers.push({
          name: staffName,
          email: `${emailName}${staffIndex}@hospital.com`,
          password: await bcrypt.hash('staff123', salt),
          phone: `98765${String(staffIndex).padStart(5, '0')}`,
          role: 'staff',
          bloodGroup: bloodGroups[Math.floor(Math.random() * 8)],
          hospital: hospital._id,
          department: departments[Math.floor(Math.random() * departments.length)],
          isApproved: true,
          isActive: true,
          address: {
            street: hospital.address.street,
            city: hospital.address.city,
            district: hospital.address.district,
            state: hospital.address.state,
            pincode: hospital.address.pincode
          }
        });
        staffIndex++;
      }
    }
    const createdStaff = await User.insertMany(staffUsers);
    console.log(`✅ Created ${createdStaff.length} staff users`);

    // Update hospitals with staff references
    for (const hospital of hospitals) {
      const hospitalStaff = createdStaff.filter(s => s.hospital && s.hospital.toString() === hospital._id.toString());
      await Hospital.findByIdAndUpdate(hospital._id, {
        $push: { staff: { $each: hospitalStaff.map(s => s._id) } }
      });
    }
    console.log('✅ Updated hospitals with staff references\n');

    // ========== STEP 7: CREATE REGULAR USERS ==========
    console.log('👤 Creating regular users...');
    const regularUsers = [
      { name: 'Ravi Teja', email: 'ravi.teja@gmail.com', phone: '9876543210', bloodGroup: 'B+',
        address: { street: 'Near Bus Stand', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518001' },
        emergencyContact: { name: 'Sita Devi', phone: '9876543211', relation: 'Mother' } },
      { name: 'Anitha Reddy', email: 'anitha.reddy@gmail.com', phone: '9876543212', bloodGroup: 'O+',
        address: { street: 'NR Peta Main Road', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518004' },
        emergencyContact: { name: 'Ramesh Reddy', phone: '9876543213', relation: 'Father' } },
      { name: 'Suresh Babu', email: 'suresh.babu@gmail.com', phone: '9876543214', bloodGroup: 'A+',
        address: { street: 'Budhawarpet Circle', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518002' },
        emergencyContact: { name: 'Lakshmi Devi', phone: '9876543215', relation: 'Wife' } },
      { name: 'Priya Lakshmi', email: 'priya.lakshmi@gmail.com', phone: '9876543216', bloodGroup: 'AB+',
        address: { street: 'One Town', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518001' },
        emergencyContact: { name: 'Krishna', phone: '9876543217', relation: 'Husband' } },
      { name: 'Venkata Rao', email: 'venkat.rao@gmail.com', phone: '9876543218', bloodGroup: 'O-',
        address: { street: 'Kurnool Bazar', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518001' },
        emergencyContact: { name: 'Padma', phone: '9876543219', relation: 'Wife' } },
      { name: 'Madhavi Latha', email: 'madhavi.latha@gmail.com', phone: '9876543220', bloodGroup: 'B-',
        address: { street: 'Shilpa Birla Road', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518002' },
        emergencyContact: { name: 'Ramu', phone: '9876543221', relation: 'Brother' } },
      { name: 'Srinivas Murthy', email: 'srinivas.murthy@gmail.com', phone: '9876543222', bloodGroup: 'A-',
        address: { street: 'Railway Station Road', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518003' },
        emergencyContact: { name: 'Saroja', phone: '9876543223', relation: 'Wife' } },
      { name: 'Kavitha Devi', email: 'kavitha.devi@gmail.com', phone: '9876543224', bloodGroup: 'AB-',
        address: { street: 'Bank Colony', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518002' },
        emergencyContact: { name: 'Nagaraj', phone: '9876543225', relation: 'Husband' } },
      { name: 'Ramakrishna', email: 'ramakrishna@gmail.com', phone: '9876543226', bloodGroup: 'O+',
        address: { street: 'Gandhi Nagar', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518004' },
        emergencyContact: { name: 'Vani', phone: '9876543227', relation: 'Wife' } },
      { name: 'Swapna', email: 'swapna@gmail.com', phone: '9876543228', bloodGroup: 'B+',
        address: { street: 'Teachers Colony', city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518001' },
        emergencyContact: { name: 'Prasad', phone: '9876543229', relation: 'Husband' } }
    ];

    // Use User.create() individually so the pre-save password hash hook runs
    for (const userData of regularUsers) {
      await User.create({
        ...userData,
        password: 'user123',
        role: 'user',
        isApproved: true,
        isActive: true
      });
    }
    console.log(`✅ Created ${regularUsers.length} regular users\n`);

    // ========== STEP 8: CREATE SAMPLE BED BOOKINGS ==========
    console.log('📋 Creating sample bed bookings...');
    const allUsers = await User.find({ role: 'user' });
    const availableBeds = await Bed.find({ status: 'available' }).limit(5);

    const bookings = [];
    const bookingStatuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
    const conditions = ['Fever & Cold', 'Chest Pain', 'Fracture - Right Arm', 'Appendicitis', 'Road Accident Trauma'];

    for (let i = 0; i < Math.min(5, availableBeds.length, allUsers.length); i++) {
      const bed = availableBeds[i];
      const user = allUsers[i];
      const status = bookingStatuses[i];
      const admissionDate = new Date();
      admissionDate.setDate(admissionDate.getDate() - Math.floor(Math.random() * 5));
      const expectedDischarge = new Date(admissionDate);
      expectedDischarge.setDate(expectedDischarge.getDate() + Math.floor(Math.random() * 7) + 2);

      const booking = await BedBooking.create({
        bed: bed._id,
        hospital: bed.hospital,
        patient: user._id,
        bookingType: i === 0 ? 'emergency' : i === 4 ? 'walk-in' : 'scheduled',
        status: status,
        patientDetails: {
          name: user.name,
          age: 25 + Math.floor(Math.random() * 40),
          gender: i % 2 === 0 ? 'male' : 'female',
          phone: user.phone,
          condition: conditions[i],
          diagnosis: conditions[i]
        },
        admissionDate,
        expectedDischargeDate: expectedDischarge,
        checkInTime: ['checked-in', 'checked-out'].includes(status) ? admissionDate : undefined,
        checkOutTime: status === 'checked-out' ? expectedDischarge : undefined,
        attendingDoctor: {
          name: createdStaff[i]?.name || 'Dr. Rajesh Kumar',
          specialization: departments[Math.floor(Math.random() * departments.length)],
          phone: createdStaff[i]?.phone || '9876500000'
        },
        totalCharges: (Math.floor(Math.random() * 10) + 3) * 3000,
        paymentStatus: status === 'checked-out' ? 'paid' : 'pending',
        processedBy: createdStaff[0]?._id || adminUser._id,
        notes: `Sample booking ${i + 1} for demo purposes`
      });
      bookings.push(booking);

      // Update bed status for active bookings
      if (['confirmed', 'checked-in'].includes(status)) {
        await Bed.findByIdAndUpdate(bed._id, {
          status: 'occupied', isAvailable: false,
          currentPatient: user._id, currentBooking: booking._id
        });
      }
    }
    console.log(`✅ Created ${bookings.length} bed bookings\n`);

    // ========== STEP 9: CREATE SAMPLE BLOOD REQUESTS ==========
    console.log('🔴 Creating sample blood requests...');
    const requestStatuses = ['pending', 'approved', 'fulfilled', 'rejected', 'cancelled'];
    const reasons = [
      'Surgery scheduled - need blood units',
      'Emergency accident victim needs blood',
      'Anemia patient requires transfusion',
      'Post-delivery complication',
      'Scheduled knee replacement surgery'
    ];

    for (let i = 0; i < 5; i++) {
      const user = allUsers[i % allUsers.length];
      const hospital = hospitals[i % hospitals.length];
      await BloodRequest.create({
        requestType: i === 1 ? 'emergency' : i === 4 ? 'scheduled' : 'normal',
        bloodGroup: bloodGroups[i],
        unitsRequired: Math.floor(Math.random() * 3) + 1,
        unitsApproved: ['approved', 'fulfilled'].includes(requestStatuses[i]) ? Math.floor(Math.random() * 3) + 1 : 0,
        componentType: 'whole_blood',
        requestedBy: user._id,
        patientInfo: {
          name: user.name,
          age: 30 + Math.floor(Math.random() * 30),
          gender: i % 2 === 0 ? 'male' : 'female',
          bloodGroup: bloodGroups[i],
          condition: reasons[i]
        },
        hospital: hospital._id,
        targetHospital: hospitals[(i + 1) % hospitals.length]._id,
        status: requestStatuses[i],
        priority: i === 1 ? 1 : i === 0 ? 2 : 3,
        reason: reasons[i],
        processedBy: ['approved', 'fulfilled', 'rejected'].includes(requestStatuses[i]) ? createdStaff[0]?._id || adminUser._id : undefined,
        notes: `Sample blood request ${i + 1}`
      });
    }
    console.log('✅ Created 5 blood requests\n');

    // ========== STEP 10: CREATE SAMPLE EMERGENCY ALERTS ==========
    console.log('🚨 Creating sample emergency alerts...');
    await EmergencyAlert.create([
      {
        type: 'blood_shortage',
        severity: 'high',
        title: 'O- Blood Shortage at GGH Kurnool',
        description: 'O- blood units running critically low. Only 2 units remaining. Urgent donors needed.',
        hospital: hospitals[0]._id,
        affectedBloodGroups: ['O-'],
        status: 'active',
        createdBy: adminUser._id,
        targetAudience: 'all'
      },
      {
        type: 'bed_shortage',
        severity: 'medium',
        title: 'ICU Beds Full at KIMS Hospital',
        description: 'All ICU beds are currently occupied at KIMS Hospital. Patients may need to be diverted.',
        hospital: hospitals[5]._id,
        status: 'acknowledged',
        acknowledgedBy: createdStaff[0]?._id || adminUser._id,
        acknowledgedAt: new Date(),
        createdBy: adminUser._id,
        targetAudience: 'staff'
      },
      {
        type: 'critical_patient',
        severity: 'critical',
        title: 'Mass Casualty - Road Accident',
        description: 'Multiple victims from road accident brought to Apollo Medical Centre. Additional staff needed.',
        hospital: hospitals[2]._id,
        status: 'active',
        createdBy: adminUser._id,
        targetAudience: 'all'
      }
    ]);
    console.log('✅ Created 3 emergency alerts\n');

    // ========== FINAL SUMMARY ==========
    const counts = {
      users: await User.countDocuments(),
      admins: await User.countDocuments({ role: 'admin' }),
      staff: await User.countDocuments({ role: 'staff' }),
      regularUsers: await User.countDocuments({ role: 'user' }),
      hospitals: await Hospital.countDocuments(),
      beds: await Bed.countDocuments(),
      bedsAvailable: await Bed.countDocuments({ status: 'available' }),
      bloodUnits: await BloodUnit.countDocuments(),
      bedBookings: await BedBooking.countDocuments(),
      bloodRequests: await BloodRequest.countDocuments(),
      emergencyAlerts: await EmergencyAlert.countDocuments()
    };

    console.log('═══════════════════════════════════════════════');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Users Total:       ${counts.users}`);
    console.log(`    ├─ Admins:       ${counts.admins}`);
    console.log(`    ├─ Staff:        ${counts.staff}`);
    console.log(`    └─ Regular:      ${counts.regularUsers}`);
    console.log(`  Hospitals:         ${counts.hospitals}`);
    console.log(`  Beds:              ${counts.beds} (${counts.bedsAvailable} available)`);
    console.log(`  Blood Units:       ${counts.bloodUnits}`);
    console.log(`  Bed Bookings:      ${counts.bedBookings}`);
    console.log(`  Blood Requests:    ${counts.bloodRequests}`);
    console.log(`  Emergency Alerts:  ${counts.emergencyAlerts}`);
    console.log('═══════════════════════════════════════════════');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('  👑 Admin:  admin@hospital.com / admin123');
    console.log('  👨‍⚕️ Staff:  drrajeshku0@hospital.com / staff123');
    console.log('  👤 User:   ravi.teja@gmail.com / user123');
    console.log('═══════════════════════════════════════════════\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

reseedAll();
