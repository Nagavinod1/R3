const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const BloodUnit = require('../models/BloodUnit');
const BloodRequest = require('../models/BloodRequest');
const Bed = require('../models/Bed');
const BedBooking = require('../models/BedBooking');
const EmergencyAlert = require('../models/EmergencyAlert');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts
    const [
      totalUsers,
      totalStaff,
      totalHospitals,
      pendingHospitals,
      pendingStaff,
      bloodRequestsCount,
      bedBookingsCount,
      activeAlerts,
      totalBeds,
      availableBeds
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'staff' }),
      Hospital.countDocuments({ isApproved: true }),
      Hospital.countDocuments({ isApproved: false }),
      User.countDocuments({ role: 'staff', isApproved: false }),
      BloodRequest.countDocuments({ status: 'pending' }),
      BedBooking.countDocuments({ status: 'pending' }),
      EmergencyAlert.countDocuments({ status: { $in: ['active', 'acknowledged'] } }),
      Bed.countDocuments(),
      Bed.countDocuments({ status: 'available', isAvailable: true })
    ]);

    // Get blood inventory summary
    const bloodInventoryRaw = await BloodUnit.getInventorySummary();
    const bloodInventory = {
      totalUnits: bloodInventoryRaw.reduce((sum, item) => sum + (item.totalUnits || 0), 0),
      byGroup: bloodInventoryRaw
    };

    // Get district-wise hospital distribution
    const hospitalDistribution = await Hospital.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: '$address.district',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent requests
    const recentBloodRequests = await BloodRequest.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('requestedBy', 'name email')
      .populate('hospital', 'name');

    const recentBedBookings = await BedBooking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('patient', 'name email')
      .populate('hospital', 'name');

    // Get pending approvals
    const pendingHospitalsList = await Hospital.find({ isApproved: false })
      .sort({ createdAt: -1 })
      .limit(10);

    const pendingStaffList = await User.find({ role: 'staff', isApproved: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-password');

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalStaff,
          totalHospitals,
          pendingHospitals,
          pendingStaff,
          bloodRequestsCount,
          bedBookingsCount,
          activeAlerts,
          totalBeds,
          availableBeds
        },
        bloodInventory,
        hospitalDistribution,
        recentBloodRequests,
        recentBedBookings,
        pendingHospitalsList,
        pendingStaffList
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { role, isApproved, search } = req.query;

    let query = {};
    if (role) query.role = role;
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('hospital', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/approve
// @desc    Approve or reject user
// @access  Admin
router.put('/users/:id/approve', async (req, res) => {
  try {
    const { isApproved } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add notification to user
    await user.addNotification(
      isApproved ? 'Your account has been approved!' : 'Your account approval was rejected.',
      isApproved ? 'success' : 'error'
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${user._id}`).emit('accountStatus', { isApproved });
    }

    res.json({
      success: true,
      message: `User ${isApproved ? 'approved' : 'rejected'} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Activate or deactivate user
// @access  Admin
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// @route   GET /api/admin/staff
// @desc    Get all staff members
// @access  Admin
router.get('/staff', async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { isApproved, search } = req.query;

    let query = { role: 'staff' };
    
    // Filter by approval status
    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [staff, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('hospital', 'name address')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: staff,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff',
      error: error.message
    });
  }
});

// @route   POST /api/admin/staff
// @desc    Create new staff member
// @access  Admin
router.post('/staff', async (req, res) => {
  try {
    const { name, email, password, phone, hospital, department } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const staff = await User.create({
      name,
      email,
      password,
      phone,
      role: 'staff',
      hospital,
      department,
      isApproved: true // Admin-created staff is auto-approved
    });

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        hospital: staff.hospital
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating staff member',
      error: error.message
    });
  }
});

// @route   GET /api/admin/hospitals
// @desc    Get all hospitals
// @access  Admin
router.get('/hospitals', async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { isApproved, search } = req.query;

    let query = {};
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }

    const [hospitals, total] = await Promise.all([
      Hospital.find(query)
        .populate('admin', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Hospital.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: hospitals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hospitals',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/hospitals/:id/approve
// @desc    Approve or reject hospital
// @access  Admin
router.put('/hospitals/:id/approve', async (req, res) => {
  try {
    const { isApproved } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('hospitalApproval', {
        hospitalId: hospital._id,
        name: hospital.name,
        isApproved
      });
    }

    res.json({
      success: true,
      message: `Hospital ${isApproved ? 'approved' : 'rejected'} successfully`,
      hospital
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating hospital status',
      error: error.message
    });
  }
});

// @route   GET /api/admin/alerts
// @desc    Get all emergency alerts including blood requests
// @access  Admin
router.get('/alerts', async (req, res) => {
  try {
    const { status, severity, type } = req.query;
    
    // Fetch EmergencyAlerts
    let alertQuery = {};
    if (status && status !== 'all') alertQuery.status = status;
    if (severity && severity !== 'all') alertQuery.severity = severity;

    const emergencyAlerts = await EmergencyAlert.find(alertQuery)
      .populate('hospital', 'name phone')
      .populate('createdBy', 'name phone email')
      .sort({ createdAt: -1 });

    // Fetch pending/active Blood Requests as alerts
    let bloodRequestQuery = { status: { $in: ['pending', 'approved'] } };
    
    const bloodRequests = await BloodRequest.find(bloodRequestQuery)
      .populate('requestedBy', 'name phone email')
      .populate('hospital', 'name phone')
      .populate('targetHospital', 'name phone')
      .sort({ createdAt: -1 });

    // Transform blood requests to alert format
    const bloodRequestAlerts = bloodRequests.map(req => ({
      _id: req._id,
      type: 'blood',
      priority: req.priority === 1 ? 'critical' : req.priority === 2 ? 'high' : 'medium',
      status: req.status === 'pending' ? 'active' : req.status,
      bloodGroup: req.bloodGroup,
      unitsRequired: req.unitsRequired,
      hospital: req.targetHospital || req.hospital || { name: 'Patient Request' },
      user: {
        name: req.requestedBy?.name || 'Unknown',
        phone: req.requestedBy?.phone || '',
        email: req.requestedBy?.email || ''
      },
      patientInfo: req.patientInfo,
      description: `${req.unitsRequired} units of ${req.bloodGroup} blood requested for ${req.patientInfo?.name || 'patient'}. Reason: ${req.reason || 'Not specified'}. Type: ${req.requestType || 'normal'}`,
      createdAt: req.createdAt,
      requestType: req.requestType,
      isBloodRequest: true,
      bloodRequestId: req._id
    }));

    // Transform emergency alerts to consistent format
    const formattedEmergencyAlerts = emergencyAlerts.map(alert => ({
      _id: alert._id,
      type: alert.type === 'blood_shortage' ? 'blood' : alert.type === 'bed_shortage' ? 'bed' : alert.type,
      priority: alert.severity,
      status: alert.status,
      bloodGroup: alert.affectedBloodGroups?.[0] || '',
      hospital: alert.hospital || { name: 'System Alert' },
      user: {
        name: alert.createdBy?.name || 'System',
        phone: alert.createdBy?.phone || '',
        email: alert.createdBy?.email || ''
      },
      description: alert.description || alert.title,
      createdAt: alert.createdAt,
      isEmergencyAlert: true,
      metadata: alert.metadata
    }));

    // Combine and sort by creation date
    let allAlerts = [...bloodRequestAlerts, ...formattedEmergencyAlerts];
    
    // Filter by type if specified
    if (type && type !== 'all') {
      allAlerts = allAlerts.filter(a => a.type === type);
    }
    
    // Sort by priority (critical first) then by date
    allAlerts.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      data: allAlerts
    });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/alerts/:id/resolve
// @desc    Resolve an emergency alert or blood request
// @access  Admin
router.put('/alerts/:id/resolve', async (req, res) => {
  try {
    const { isBloodRequest } = req.body;
    
    let result;
    
    if (isBloodRequest) {
      // Handle blood request resolution
      result = await BloodRequest.findByIdAndUpdate(
        req.params.id,
        {
          status: 'fulfilled',
          processedBy: req.user._id,
          processedAt: new Date()
        },
        { new: true }
      );
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Blood request not found'
        });
      }
    } else {
      // Handle emergency alert resolution
      result = await EmergencyAlert.findByIdAndUpdate(
        req.params.id,
        {
          status: 'resolved',
          resolvedBy: req.user._id,
          resolvedAt: new Date()
        },
        { new: true }
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('alertResolved', { alertId: req.params.id, isBloodRequest });
    }

    res.json({
      success: true,
      message: isBloodRequest ? 'Blood request fulfilled' : 'Alert resolved successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resolving alert',
      error: error.message
    });
  }
});

// @route   GET /api/admin/analytics/blood
// @desc    Get blood inventory analytics
// @access  Admin
router.get('/analytics/blood', async (req, res) => {
  try {
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    
    const inventory = await BloodUnit.aggregate([
      { $match: { status: 'available' } },
      {
        $group: {
          _id: '$bloodGroup',
          totalUnits: { $sum: '$quantity' }
        }
      }
    ]);

    // Ensure all blood groups are represented
    const formattedData = bloodGroups.map(group => {
      const found = inventory.find(i => i._id === group);
      return {
        bloodGroup: group,
        units: found ? found.totalUnits : 0
      };
    });

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blood analytics',
      error: error.message
    });
  }
});

// @route   GET /api/admin/analytics/hospitals
// @desc    Get hospital distribution analytics
// @access  Admin
router.get('/analytics/hospitals', async (req, res) => {
  try {
    const distribution = await Hospital.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: '$address.district',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: distribution.map(d => ({
        district: d._id || 'Unknown',
        count: d.count
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hospital analytics',
      error: error.message
    });
  }
});

// @route   GET /api/admin/blood-requests
// @desc    Get all blood requests across system
// @access  Admin
router.get('/blood-requests', async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { status, bloodGroup, requestType } = req.query;

    const query = {};
    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (requestType) query.requestType = requestType;

    const [requests, total] = await Promise.all([
      BloodRequest.find(query)
        .populate('requestedBy', 'name email phone')
        .populate('hospital', 'name address phone')
        .populate('targetHospital', 'name address phone')
        .populate('processedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BloodRequest.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blood requests',
      error: error.message
    });
  }
});

// @route   GET /api/admin/bed-bookings
// @desc    Get all bed bookings across system
// @access  Admin
router.get('/bed-bookings', async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { status, bookingType } = req.query;

    const query = {};
    if (status) query.status = status;
    if (bookingType) query.bookingType = bookingType;

    const [bookings, total] = await Promise.all([
      BedBooking.find(query)
        .populate('bed', 'bedNumber ward type floor')
        .populate('hospital', 'name address phone')
        .populate('patient', 'name email phone')
        .populate('processedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BedBooking.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bed bookings',
      error: error.message
    });
  }
});

module.exports = router;

