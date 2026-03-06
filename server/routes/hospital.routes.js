const express = require('express');
const router = express.Router();
const { protect, authorize, checkApproval } = require('../middleware/auth');
const { validate, hospitalValidation } = require('../middleware/validation');
const Hospital = require('../models/Hospital');
const Bed = require('../models/Bed');
const BloodUnit = require('../models/BloodUnit');

// @route   GET /api/hospitals
// @desc    Get all approved hospitals
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { city, district, state, hasBloodBank, hasEmergency, search } = req.query;
    let query = { isApproved: true, isActive: true };

    if (city) query['address.city'] = new RegExp(city, 'i');
    if (district) query['address.district'] = new RegExp(district, 'i');
    if (state) query['address.state'] = new RegExp(state, 'i');
    if (hasBloodBank !== undefined) query.hasBloodBank = hasBloodBank === 'true';
    if (hasEmergency !== undefined) query.hasEmergency = hasEmergency === 'true';
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { 'address.city': new RegExp(search, 'i') }
      ];
    }

    const hospitals = await Hospital.find(query)
      .select('-staff -admin')
      .sort({ rating: -1, name: 1 });

    res.json({
      success: true,
      data: hospitals,
      count: hospitals.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hospitals',
      error: error.message
    });
  }
});

// @route   GET /api/hospitals/nearby
// @desc    Get nearby hospitals (with coordinates)
// @access  Public
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.query; // maxDistance in meters

    if (!latitude || !longitude) {
      // Return all hospitals if no coordinates
      const hospitals = await Hospital.find({ isApproved: true, isActive: true })
        .select('name address totalBeds availableBeds hasBloodBank hasEmergency phone rating')
        .sort({ rating: -1 })
        .limit(20);

      return res.json({
        success: true,
        data: hospitals
      });
    }

    const hospitals = await Hospital.find({
      isApproved: true,
      isActive: true,
      'address.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)]
          },
          $maxDistance: Number.parseInt(maxDistance, 10)
        }
      }
    }).select('name address totalBeds availableBeds hasBloodBank hasEmergency phone rating');

    res.json({
      success: true,
      data: hospitals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby hospitals',
      error: error.message
    });
  }
});

// @route   GET /api/hospitals/:id
// @desc    Get single hospital details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id)
      .populate('admin', 'name email phone');

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Get bed availability
    const bedStats = await Bed.getBedStats(hospital._id);
    const availableBeds = await Bed.getAvailableBedsByType(hospital._id);

    // Get blood inventory if has blood bank
    let bloodInventory = [];
    if (hospital.hasBloodBank) {
      bloodInventory = await BloodUnit.getInventorySummary(hospital._id);
    }

    res.json({
      success: true,
      data: {
        hospital,
        bedStats,
        availableBeds,
        bloodInventory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hospital',
      error: error.message
    });
  }
});

// @route   POST /api/hospitals
// @desc    Register new hospital
// @access  Private
router.post('/', protect, hospitalValidation, validate, async (req, res) => {
  try {
    const {
      name,
      registrationNumber,
      email,
      phone,
      address,
      type,
      totalBeds,
      specializations,
      facilities,
      hasBloodBank,
      hasEmergency,
      operatingHours,
      images
    } = req.body;

    // Check if hospital already exists (only if registrationNumber or email provided)
    if (registrationNumber || email) {
      const orConditions = [];
      if (registrationNumber) orConditions.push({ registrationNumber });
      if (email) orConditions.push({ email });

      const existingHospital = await Hospital.findOne({ $or: orConditions });
      if (existingHospital) {
        return res.status(400).json({
          success: false,
          message: 'Hospital with this registration number or email already exists'
        });
      }
    }

    const hospital = await Hospital.create({
      name,
      registrationNumber: registrationNumber || `REG-${Date.now()}`,
      email,
      phone,
      address,
      type: type || 'private',
      totalBeds,
      specializations,
      facilities,
      hasBloodBank: hasBloodBank || false,
      hasEmergency: hasEmergency !== false,
      operatingHours,
      images,
      admin: req.user._id,
      isApproved: req.user.role === 'admin' ? true : false,
      isActive: req.user.role === 'admin' ? true : false
    });

    // Update user's hospital reference if staff
    if (req.user.role === 'staff') {
      req.user.hospital = hospital._id;
      await req.user.save();
    }

    // Notify admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('newHospitalRegistration', {
        hospitalId: hospital._id,
        name: hospital.name,
        city: hospital.address.city
      });
    }

    res.status(201).json({
      success: true,
      message: 'Hospital registration submitted. Waiting for admin approval.',
      data: hospital
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering hospital',
      error: error.message
    });
  }
});

// @route   PUT /api/hospitals/:id
// @desc    Update hospital
// @access  Staff/Admin
router.put('/:id', protect, authorize('staff', 'admin'), async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Check authorization
    if (req.user.role === 'staff' && 
        hospital._id.toString() !== req.user.hospital?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this hospital'
      });
    }

    const allowedUpdates = [
      'name', 'email', 'phone', 'address', 'totalBeds', 'specializations', 'facilities',
      'hasBloodBank', 'hasEmergency', 'operatingHours', 'images'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        hospital[field] = req.body[field];
      }
    });

    await hospital.save();

    res.json({
      success: true,
      message: 'Hospital updated successfully',
      data: hospital
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating hospital',
      error: error.message
    });
  }
});

// @route   DELETE /api/hospitals/:id
// @desc    Delete hospital
// @access  Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    await Hospital.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Hospital deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting hospital',
      error: error.message
    });
  }
});

// @route   GET /api/hospitals/:id/beds
// @desc    Get hospital beds
// @access  Public
router.get('/:id/beds', async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = { hospital: req.params.id };

    if (type) query.type = type;
    if (status) query.status = status;

    const beds = await Bed.find(query)
      .sort({ ward: 1, bedNumber: 1 });

    const stats = await Bed.getBedStats(req.params.id);

    res.json({
      success: true,
      data: {
        beds,
        stats,
        total: beds.length,
        available: beds.filter(b => b.isAvailable).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hospital beds',
      error: error.message
    });
  }
});

// @route   GET /api/hospitals/:id/blood
// @desc    Get hospital blood inventory
// @access  Public
router.get('/:id/blood', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    if (!hospital.hasBloodBank) {
      return res.json({
        success: true,
        data: {
          hasBloodBank: false,
          message: 'This hospital does not have a blood bank'
        }
      });
    }

    const inventory = await BloodUnit.getInventorySummary(req.params.id);
    const lowStock = await BloodUnit.getLowStockAlerts(5);

    res.json({
      success: true,
      data: {
        hasBloodBank: true,
        inventory,
        lowStock: lowStock.filter(l => l.isLow)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blood inventory',
      error: error.message
    });
  }
});

// @route   GET /api/hospitals/districts
// @desc    Get list of districts with hospitals
// @access  Public
router.get('/meta/districts', async (req, res) => {
  try {
    const districts = await Hospital.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: '$address.district',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: districts.map(d => ({
        name: d._id,
        hospitalCount: d.count
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching districts',
      error: error.message
    });
  }
});

module.exports = router;
