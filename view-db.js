const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/hospital_blood_management').then(async () => {
  const db = mongoose.connection.db;

  // Users
  console.log('=== USERS ===');
  const users = await db.collection('users').find().toArray();
  users.forEach(u => console.log('  Name:', u.name, '| Email:', u.email, '| Role:', u.role, '| Blood:', u.bloodGroup));

  // Hospitals
  console.log('\n=== HOSPITALS ===');
  const hospitals = await db.collection('hospitals').find().toArray();
  hospitals.forEach(h => console.log('  ', h.name, '| City:', h.address?.city, '| Beds:', h.totalBeds, '| Active:', h.isActive));

  // Beds summary
  console.log('\n=== BEDS - Summary by Hospital ===');
  const bedsByHospital = await db.collection('beds').aggregate([
    { $group: { _id: '$hospital', total: { $sum: 1 }, available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } } } }
  ]).toArray();
  for (const b of bedsByHospital) {
    const hosp = await db.collection('hospitals').findOne({ _id: b._id });
    console.log('  ', hosp?.name || 'Unknown', '| Total:', b.total, '| Available:', b.available);
  }

  // Blood Units summary  
  console.log('\n=== BLOOD UNITS - Summary by Type ===');
  const bloodByType = await db.collection('bloodunits').aggregate([
    { $group: { _id: '$bloodGroup', total: { $sum: 1 }, available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } } } },
    { $sort: { _id: 1 } }
  ]).toArray();
  bloodByType.forEach(b => console.log('  ', b._id, '| Total:', b.total, '| Available:', b.available));

  // Emergency Alerts
  console.log('\n=== EMERGENCY ALERTS ===');
  const alerts = await db.collection('emergencyalerts').find().toArray();
  console.log('  Count:', alerts.length);

  // Bed Bookings
  console.log('\n=== BED BOOKINGS ===');
  const bookings = await db.collection('bedbookings').find().toArray();
  console.log('  Count:', bookings.length);

  // Blood Requests
  console.log('\n=== BLOOD REQUESTS ===');
  const requests = await db.collection('bloodrequests').find().toArray();
  console.log('  Count:', requests.length);

  // Blockchain Transactions
  console.log('\n=== BLOCKCHAIN TRANSACTIONS ===');
  const txns = await db.collection('blockchaintransactions').find().toArray();
  console.log('  Count:', txns.length);

  mongoose.disconnect();
}).catch(e => console.error('Error:', e.message));
