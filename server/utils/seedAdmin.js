const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@hospital.com' });
    
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@hospital.com',
        password: 'admin123',
        phone: '9999999999',
        role: 'admin',
        isApproved: true,
        isActive: true,
        address: {
          street: 'Admin Office',
          city: 'System',
          district: 'System',
          state: 'System',
          pincode: '000000'
        }
      });
      
      console.log('✅ Default admin user created');
      console.log('   Email: admin@hospital.com');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
