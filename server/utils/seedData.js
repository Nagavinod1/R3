const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Hospital = require('../models/Hospital');
const Bed = require('../models/Bed');
const BloodUnit = require('../models/BloodUnit');
const User = require('../models/User');

const seedData = async () => {
  try {
    console.log('🌱 Starting to seed data...');

    // Check if data already exists
    const hospitalCount = await Hospital.countDocuments();
    const userCount = await User.countDocuments();
    if (hospitalCount > 0 && userCount > 1) {
      console.log('📊 Data already exists, skipping seed...');
      return;
    }

    // Get admin user for references
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('⚠️ No admin user found. Creating admin user...');
      adminUser = await User.create({
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
      console.log('✅ Admin user created: admin@hospital.com / admin123');
    }

    // Create sample hospitals from Kurnool, Andhra Pradesh
    const hospitals = await Hospital.insertMany([
      {
        name: 'Government General Hospital (GGH) Kurnool',
        registrationNumber: 'GGH-AP-KNL-001',
        address: {
          street: 'Budhawarpet Road',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518002'
        },
        phone: '08518-255160',
        email: 'ggh.kurnool@hospital.com',
        type: 'government',
        hasBloodBank: true,
        hasEmergency: true,
        totalBeds: 250,
        availableBeds: 85,
        rating: 4.2,
        isApproved: true,
        isActive: true,
        admin: adminUser._id
      },
      {
        name: 'Kurnool Medical College Teaching Hospital',
        registrationNumber: 'KMC-AP-KNL-002',
        address: {
          street: 'Kurnool Medical College Campus',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518002'
        },
        phone: '08518-255160',
        email: 'kmc_knl@nic.in',
        type: 'government',
        hasBloodBank: true,
        hasEmergency: true,
        totalBeds: 300,
        availableBeds: 95,
        rating: 4.5,
        isApproved: true,
        isActive: true,
        admin: adminUser._id
      },
      {
        name: 'Apollo Medical Centre Kurnool',
        registrationNumber: 'APL-AP-KNL-003',
        address: {
          street: 'NR Peta Area',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518004'
        },
        phone: '08518-200100',
        email: 'apollo.kurnool@hospital.com',
        type: 'private',
        hasBloodBank: true,
        hasEmergency: true,
        totalBeds: 150,
        availableBeds: 45,
        rating: 4.6,
        isApproved: true,
        isActive: true,
        admin: adminUser._id
      },
      {
        name: 'Venkateswara Hospital',
        registrationNumber: 'VNK-AP-KNL-004',
        address: {
          street: 'Kurnool Bazar Area',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518001'
        },
        phone: '08518-200200',
        email: 'venkateswara.kurnool@hospital.com',
        type: 'private',
        hasBloodBank: true,
        hasEmergency: true,
        totalBeds: 100,
        availableBeds: 35,
        rating: 4.3,
        isApproved: true,
        isActive: true,
        admin: adminUser._id
      },
      {
        name: 'Asha Children\'s Hospital',
        registrationNumber: 'ACH-AP-KNL-005',
        address: {
          street: 'Budhawarpet Area',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518002'
        },
        phone: '08518-200300',
        email: 'asha.children.kurnool@hospital.com',
        type: 'private',
        hasBloodBank: false,
        hasEmergency: true,
        totalBeds: 60,
        availableBeds: 20,
        rating: 4.4,
        isApproved: true,
        isActive: true,
        admin: adminUser._id
      },
      {
        name: 'KIMS Hospital Kurnool',
        registrationNumber: 'KIMS-AP-KNL-006',
        address: {
          street: 'One Town Area',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518001'
        },
        phone: '08518-200400',
        email: 'kims.kurnool@hospital.com',
        type: 'private',
        hasBloodBank: true,
        hasEmergency: true,
        totalBeds: 200,
        availableBeds: 65,
        rating: 4.7,
        isApproved: true,
        isActive: true,
        admin: adminUser._id
      },
      {
        name: 'Omni Hospital Kurnool',
        registrationNumber: 'OMN-AP-KNL-007',
        address: {
          street: 'NR Peta',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518004'
        },
        phone: '08518-200500',
        email: 'omni.kurnool@hospital.com',
        type: 'private',
        hasBloodBank: true,
        hasEmergency: true,
        totalBeds: 120,
        availableBeds: 40,
        rating: 4.4,
        isApproved: true,
        isActive: true,
        admin: adminUser._id
      },
      {
        name: 'Sree Ashwini Hospital',
        registrationNumber: 'SAH-AP-KNL-008',
        address: {
          street: 'Shilpa Birla Area',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518002'
        },
        phone: '08518-200600',
        email: 'ashwini.kurnool@hospital.com',
        type: 'private',
        hasBloodBank: true,
        hasEmergency: true,
        totalBeds: 80,
        availableBeds: 28,
        rating: 4.3,
        isApproved: true,
        isActive: true,
        admin: adminUser._id
      },
      {
        name: 'Sri Balaji Nursing Home',
        registrationNumber: 'SBN-AP-KNL-009',
        address: {
          street: 'Kurnool Bazar',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518001'
        },
        phone: '08518-200700',
        email: 'balaji.kurnool@hospital.com',
        type: 'private',
        hasBloodBank: false,
        hasEmergency: false,
        totalBeds: 40,
        availableBeds: 15,
        rating: 4.1,
        isApproved: true,
        isActive: true,
        admin: adminUser._id
      },
      {
        name: 'Aarka Hospital',
        registrationNumber: 'ARK-AP-KNL-010',
        address: {
          street: 'Budhawarpet',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518002'
        },
        phone: '08518-200800',
        email: 'aarka.kurnool@hospital.com',
        type: 'private',
        hasBloodBank: true,
        hasEmergency: true,
        totalBeds: 90,
        availableBeds: 30,
        rating: 4.2,
        isApproved: true,
        isActive: true,
        admin: adminUser._id
      }
    ]);

    console.log(`✅ Created ${hospitals.length} hospitals`);

    // Create beds for each hospital
    const bedTypes = ['emergency'];
    const bedsToCreate = [];

    for (const hospital of hospitals) {
      for (let i = 1; i <= 30; i++) {
        const bedType = bedTypes[Math.floor(Math.random() * bedTypes.length)];
        const isAvailable = Math.random() > 0.3; // 70% available
        bedsToCreate.push({
          bedNumber: `${bedType.charAt(0).toUpperCase()}${String(i).padStart(3, '0')}`,
          ward: `Ward ${Math.ceil(i / 10)}`,
          floor: Math.ceil(i / 10),
          type: bedType,
          hospital: hospital._id,
          status: isAvailable ? 'available' : 'occupied',
          isAvailable: isAvailable,
          pricePerDay: 3000,
          facilities: ['oxygen', 'monitor', 'nurse_call']
        });
      }
    }

    await Bed.insertMany(bedsToCreate);
    console.log(`✅ Created ${bedsToCreate.length} beds`);

    // Create blood units
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodUnitsToCreate = [];

    for (const hospital of hospitals) {
      for (const bloodGroup of bloodGroups) {
        const quantity = Math.floor(Math.random() * 30) + 5;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + Math.floor(Math.random() * 30) + 10);
        
        bloodUnitsToCreate.push({
          bloodGroup,
          quantity,
          hospital: hospital._id,
          collectionDate: new Date(),
          expiryDate,
          componentType: 'whole_blood',
          status: 'available',
          addedBy: adminUser._id,
          storageLocation: `Refrigerator ${Math.floor(Math.random() * 5) + 1}`,
          history: [{
            action: 'added',
            performedBy: adminUser._id,
            timestamp: new Date()
          }]
        });
      }
    }

    await BloodUnit.insertMany(bloodUnitsToCreate);
    console.log(`✅ Created ${bloodUnitsToCreate.length} blood units`);

    // Create Staff Users (2-3 per hospital)
    const staffUsers = [];
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

    let staffIndex = 0;
    for (const hospital of hospitals) {
      const staffCount = Math.floor(Math.random() * 2) + 2; // 2-3 staff per hospital
      for (let i = 0; i < staffCount && staffIndex < staffNames.length; i++) {
        const staffName = staffNames[staffIndex];
        const emailName = staffName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 10);
        staffUsers.push({
          name: staffName,
          email: `${emailName}${staffIndex}@hospital.com`,
          password: 'staff123',
          phone: `98765${String(staffIndex).padStart(5, '0')}`,
          role: 'staff',
          bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'][Math.floor(Math.random() * 8)],
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

    // Hash passwords before inserting (insertMany bypasses pre-save hooks)
    const salt = await bcrypt.genSalt(10);
    const staffUsersWithHashedPasswords = await Promise.all(
      staffUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, salt)
      }))
    );
    const createdStaff = await User.insertMany(staffUsersWithHashedPasswords);
    console.log(`✅ Created ${createdStaff.length} staff users`);

    // Update hospitals with staff references
    for (const hospital of hospitals) {
      const hospitalStaff = createdStaff.filter(s => s.hospital && s.hospital.toString() === hospital._id.toString());
      await Hospital.findByIdAndUpdate(hospital._id, {
        $push: { staff: { $each: hospitalStaff.map(s => s._id) } }
      });
    }
    console.log('✅ Updated hospitals with staff references');

    // Create Regular Users
    const regularUsers = [
      {
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
      },
      {
        name: 'Anitha Reddy',
        email: 'anitha.reddy@gmail.com',
        password: 'user123',
        phone: '9876543212',
        role: 'user',
        bloodGroup: 'O+',
        isApproved: true,
        isActive: true,
        address: {
          street: 'NR Peta Main Road',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518004'
        },
        emergencyContact: {
          name: 'Ramesh Reddy',
          phone: '9876543213',
          relation: 'Father'
        }
      },
      {
        name: 'Suresh Babu',
        email: 'suresh.babu@gmail.com',
        password: 'user123',
        phone: '9876543214',
        role: 'user',
        bloodGroup: 'A+',
        isApproved: true,
        isActive: true,
        address: {
          street: 'Budhawarpet Circle',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518002'
        },
        emergencyContact: {
          name: 'Lakshmi Devi',
          phone: '9876543215',
          relation: 'Wife'
        }
      },
      {
        name: 'Priya Lakshmi',
        email: 'priya.lakshmi@gmail.com',
        password: 'user123',
        phone: '9876543216',
        role: 'user',
        bloodGroup: 'AB+',
        isApproved: true,
        isActive: true,
        address: {
          street: 'One Town',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518001'
        },
        emergencyContact: {
          name: 'Krishna',
          phone: '9876543217',
          relation: 'Husband'
        }
      },
      {
        name: 'Venkata Rao',
        email: 'venkat.rao@gmail.com',
        password: 'user123',
        phone: '9876543218',
        role: 'user',
        bloodGroup: 'O-',
        isApproved: true,
        isActive: true,
        address: {
          street: 'Kurnool Bazar',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518001'
        },
        emergencyContact: {
          name: 'Padma',
          phone: '9876543219',
          relation: 'Wife'
        }
      },
      {
        name: 'Madhavi Latha',
        email: 'madhavi.latha@gmail.com',
        password: 'user123',
        phone: '9876543220',
        role: 'user',
        bloodGroup: 'B-',
        isApproved: true,
        isActive: true,
        address: {
          street: 'Shilpa Birla Road',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518002'
        },
        emergencyContact: {
          name: 'Ramu',
          phone: '9876543221',
          relation: 'Brother'
        }
      },
      {
        name: 'Srinivas Murthy',
        email: 'srinivas.murthy@gmail.com',
        password: 'user123',
        phone: '9876543222',
        role: 'user',
        bloodGroup: 'A-',
        isApproved: true,
        isActive: true,
        address: {
          street: 'Railway Station Road',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518003'
        },
        emergencyContact: {
          name: 'Saroja',
          phone: '9876543223',
          relation: 'Wife'
        }
      },
      {
        name: 'Kavitha Devi',
        email: 'kavitha.devi@gmail.com',
        password: 'user123',
        phone: '9876543224',
        role: 'user',
        bloodGroup: 'AB-',
        isApproved: true,
        isActive: true,
        address: {
          street: 'Bank Colony',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518002'
        },
        emergencyContact: {
          name: 'Nagaraj',
          phone: '9876543225',
          relation: 'Husband'
        }
      },
      {
        name: 'Ramakrishna',
        email: 'ramakrishna@gmail.com',
        password: 'user123',
        phone: '9876543226',
        role: 'user',
        bloodGroup: 'O+',
        isApproved: true,
        isActive: true,
        address: {
          street: 'Gandhi Nagar',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518004'
        },
        emergencyContact: {
          name: 'Vani',
          phone: '9876543227',
          relation: 'Wife'
        }
      },
      {
        name: 'Swapna',
        email: 'swapna@gmail.com',
        password: 'user123',
        phone: '9876543228',
        role: 'user',
        bloodGroup: 'B+',
        isApproved: true,
        isActive: true,
        address: {
          street: 'Teachers Colony',
          city: 'Kurnool',
          district: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518001'
        },
        emergencyContact: {
          name: 'Prasad',
          phone: '9876543229',
          relation: 'Husband'
        }
      }
    ];

    // Use create() with loop to trigger password hashing middleware
    for (const userData of regularUsers) {
      await User.create(userData);
    }
    console.log(`✅ Created ${regularUsers.length} regular users`);

    // Print login credentials summary
    console.log('\n📋 ===== LOGIN CREDENTIALS =====');
    console.log('👑 ADMIN:');
    console.log('   Email: admin@hospital.com');
    console.log('   Password: admin123');
    console.log('\n👨‍⚕️ STAFF (sample):');
    console.log('   Email: drrajeshku0@hospital.com');
    console.log('   Password: staff123');
    console.log('\n👤 USERS (sample):');
    console.log('   Email: ravi.teja@gmail.com');
    console.log('   Password: user123');
    console.log('================================\n');

    console.log('🎉 Seed data created successfully!');

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  }
};

module.exports = seedData;
