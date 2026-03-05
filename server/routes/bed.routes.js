const express = require('express');
const router = express.Router();
const { protect, authorize, checkApproval } = require('../middleware/auth');
const { validate, bedValidation, bedBookingValidation } = require('../middleware/validation');
const Bed = require('../models/Bed');
const BedBooking = require('../models/BedBooking');
const Hospital = require('../models/Hospital');
const blockchainService = require('../config/blockchain');

// @route   GET /api/beds
// @desc    Get all beds with filters
// @access  Public/Private
router.get('/', async (req, res) => {
  try {
    const { hospitalId, type, status, isAvailable } = req.query;
    let query = {};

    if (hospitalId) query.hospital = hospitalId;
    if (type) query.type = type;
    if (status) query.status = status;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    const beds = await Bed.find(query)
      .populate('hospital', 'name address phone')
      .populate('currentPatient', 'name')
      .sort({ hospital: 1, ward: 1, bedNumber: 1 });

    // Get statistics
    const stats = await Bed.getBedStats(hospitalId);
    const availableByType = await Bed.getAvailableBedsByType(hospitalId);

    res.json({
      success: true,
      data: {
        beds,
        stats,
        availableByType,
        total: beds.length,
        available: beds.filter(b => b.isAvailable).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching beds',
      error: error.message
    });
  }
});

// @route   GET /api/beds/available
// @desc    Get available beds (for users)
// @access  Public
router.get('/available', async (req, res) => {
  try {
    const { type, district, city } = req.query;
    
    let hospitalQuery = { isApproved: true };
    if (district) hospitalQuery['address.district'] = new RegExp(district, 'i');
    if (city) hospitalQuery['address.city'] = new RegExp(city, 'i');

    const hospitals = await Hospital.find(hospitalQuery).select('_id');
    const hospitalIds = hospitals.map(h => h._id);

    let bedQuery = {
      hospital: { $in: hospitalIds },
      status: 'available',
      isAvailable: true
    };
    if (type) bedQuery.type = type;

    const beds = await Bed.find(bedQuery)
      .populate('hospital', 'name address phone hasEmergency rating')
      .sort({ 'hospital.name': 1 });

    // Group by hospital
    const groupedByHospital = beds.reduce((acc, bed) => {
      const hospitalId = bed.hospital._id.toString();
      if (!acc[hospitalId]) {
        acc[hospitalId] = {
          hospital: bed.hospital,
          beds: [],
          availableCount: 0
        };
      }
      acc[hospitalId].beds.push(bed);
      acc[hospitalId].availableCount++;
      return acc;
    }, {});

    res.json({
      success: true,
      data: Object.values(groupedByHospital),
      totalAvailable: beds.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available beds',
      error: error.message
    });
  }
});

// @route   GET /api/beds/stats
// @desc    Get bed statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const { hospitalId } = req.query;

    const totalBeds = await Bed.countDocuments(hospitalId ? { hospital: hospitalId } : {});
    const availableBeds = await Bed.countDocuments({ 
      ...(hospitalId && { hospital: hospitalId }),
      status: 'available' 
    });
    const occupiedBeds = await Bed.countDocuments({ 
      ...(hospitalId && { hospital: hospitalId }),
      status: 'occupied' 
    });
    const maintenanceBeds = await Bed.countDocuments({ 
      ...(hospitalId && { hospital: hospitalId }),
      status: 'maintenance' 
    });
    const reservedBeds = await Bed.countDocuments({ 
      ...(hospitalId && { hospital: hospitalId }),
      status: 'reserved' 
    });

    const byType = await Bed.getAvailableBedsByType(hospitalId);

    res.json({
      success: true,
      data: {
        total: totalBeds,
        available: availableBeds,
        occupied: occupiedBeds,
        reserved: reservedBeds,
        maintenance: maintenanceBeds,
        byType
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bed statistics',
      error: error.message
    });
  }
});

// @route   POST /api/beds
// @desc    Add new bed
// @access  Staff/Admin
router.post('/', protect, authorize('staff', 'admin'), checkApproval, bedValidation, validate, async (req, res) => {
  try {
    const {
      bedNumber,
      ward,
      floor,
      type,
      hasOxygen,
      hasVentilator,
      hasMonitor,
      pricePerDay
    } = req.body;

    const hospitalId = req.user.hospital || req.body.hospitalId;

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: 'Hospital ID is required'
      });
    }

    // Check if bed already exists
    const existingBed = await Bed.findOne({
      hospital: hospitalId,
      bedNumber,
      ward
    });

    if (existingBed) {
      return res.status(400).json({
        success: false,
        message: 'Bed with this number already exists in this ward'
      });
    }

    const bed = await Bed.create({
      bedNumber,
      hospital: hospitalId,
      ward,
      floor: floor || 0,
      type: type || 'emergency',
      hasOxygen,
      hasVentilator,
      hasMonitor,
      pricePerDay: pricePerDay || 0,
      history: [{
        action: 'created',
        performedBy: req.user._id,
        timestamp: new Date()
      }]
    });

    // Update hospital bed count
    const hospital = await Hospital.findById(hospitalId);
    if (hospital) {
      await hospital.updateBedCount();
    }

    // Record on blockchain
    const blockchainResult = await blockchainService.updateBedStatus(
      bed._id.toString(),
      hospitalId.toString(),
      true
    );

    if (blockchainResult.success) {
      bed.blockchainTxHash = blockchainResult.transactionHash;
      bed.blockchainBlockNumber = blockchainResult.blockNumber;
      await bed.save();
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('bedUpdate', {
        type: 'add',
        hospitalId,
        bedType: bed.type
      });
    }

    res.status(201).json({
      success: true,
      message: 'Bed added successfully',
      data: bed,
      blockchain: blockchainResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding bed',
      error: error.message
    });
  }
});

// @route   PUT /api/beds/:id
// @desc    Update bed status
// @access  Staff/Admin
router.put('/:id', protect, authorize('staff', 'admin'), checkApproval, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const bed = await Bed.findById(req.params.id);

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }

    const previousStatus = bed.status;
    bed.status = status;
    bed.isAvailable = status === 'available';

    if (status === 'available') {
      bed.currentPatient = null;
      bed.currentBooking = null;
      bed.lastCleaned = new Date();
    }

    bed.history.push({
      action: status,
      performedBy: req.user._id,
      timestamp: new Date(),
      notes
    });

    await bed.save();

    // Update hospital bed count
    const hospital = await Hospital.findById(bed.hospital);
    if (hospital) {
      await hospital.updateBedCount();
    }

    // Record on blockchain
    const blockchainResult = await blockchainService.updateBedStatus(
      bed._id.toString(),
      bed.hospital.toString(),
      bed.isAvailable
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('bedUpdate', {
        type: 'statusChange',
        bedId: bed._id,
        hospitalId: bed.hospital,
        previousStatus,
        newStatus: status
      });
    }

    res.json({
      success: true,
      message: 'Bed status updated successfully',
      data: bed,
      blockchain: blockchainResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating bed',
      error: error.message
    });
  }
});

// @route   POST /api/beds/reserve
// @desc    Reserve a bed
// @access  User
router.post('/reserve', protect, bedBookingValidation, validate, async (req, res) => {
  try {
    const {
      bedId,
      patientDetails,
      bookingType,
      admissionDate,
      expectedDischargeDate,
      specialRequirements,
      attendingDoctor
    } = req.body;

    const bed = await Bed.findById(bedId).populate('hospital');

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }

    if (!bed.isAvailable || bed.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Bed is not available for booking'
      });
    }

    // Create booking
    const booking = await BedBooking.create({
      bed: bedId,
      hospital: bed.hospital._id,
      patient: req.user._id,
      patientDetails,
      bookingType: bookingType || 'scheduled',
      admissionDate: admissionDate || new Date(),
      expectedDischargeDate,
      specialRequirements,
      attendingDoctor,
      status: bookingType === 'emergency' ? 'confirmed' : 'pending',
      history: [{
        status: bookingType === 'emergency' ? 'confirmed' : 'pending',
        changedBy: req.user._id,
        timestamp: new Date()
      }]
    });

    // Update bed status
    bed.status = 'reserved';
    bed.isAvailable = false;
    bed.currentPatient = req.user._id;
    bed.currentBooking = booking._id;
    bed.history.push({
      action: 'reserved',
      patient: req.user._id,
      performedBy: req.user._id,
      timestamp: new Date()
    });
    await bed.save();

    // Update hospital bed count
    await bed.hospital.updateBedCount();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      const bookingPayload = {
        bookingId: booking._id,
        hospitalId: bed.hospital._id,
        hospitalName: bed.hospital.name,
        bedNumber: bed.bedNumber,
        ward: bed.ward,
        bookingType,
        patientName: patientDetails?.name || 'Unknown',
        bookedBy: req.user.name
      };

      io.to('staff').emit('newBedBooking', bookingPayload);
      io.to('admin').emit('newBedBooking', bookingPayload);

      io.emit('bedUpdate', {
        type: 'reserved',
        bedId: bed._id,
        hospitalId: bed.hospital._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Bed reservation submitted successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reserving bed',
      error: error.message
    });
  }
});

// @route   GET /api/beds/bookings
// @desc    Get bed bookings
// @access  Private
router.get('/bookings', protect, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    // Admin can see all bookings
    if (req.user.role === 'user') {
      query.patient = req.user._id;
    } else if (req.user.role === 'staff' && req.user.hospital) {
      query.hospital = req.user.hospital;
    }
    // Admin sees all bookings (no filter needed)

    if (status) query.status = status;

    const bookings = await BedBooking.find(query)
      .populate('bed', 'bedNumber ward type floor')
      .populate({
        path: 'bed',
        populate: {
          path: 'hospital',
          select: 'name address phone'
        }
      })
      .populate('hospital', 'name address phone')
      .populate('patient', 'name email phone')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// @route   PUT /api/beds/bookings/:id
// @desc    Update bed booking status (approve/reject/confirm/cancel)
// @access  Staff/Admin
router.put('/bookings/:id', protect, authorize('staff', 'admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;

    const booking = await BedBooking.findById(req.params.id)
      .populate('bed')
      .populate('hospital');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking status
    booking.status = status;
    booking.processedBy = req.user._id;
    if (notes) booking.notes = notes;

    // Handle specific status changes
    if (status === 'approved') {
      booking.approvedBy = req.user._id;
    }

    if (status === 'confirmed') {
      booking.approvedBy = req.user._id;
      // Update bed to reserved
      if (booking.bed) {
        await Bed.findByIdAndUpdate(booking.bed._id, {
          status: 'reserved',
          isAvailable: false
        });
      }
    }

    if (status === 'rejected' || status === 'cancelled') {
      // Free up the bed if it was reserved
      if (booking.bed && (booking.status === 'confirmed' || booking.status === 'approved')) {
        await Bed.findByIdAndUpdate(booking.bed._id, {
          status: 'available',
          isAvailable: true
        });
      }
    }

    // Add to history
    booking.history = booking.history || [];
    booking.history.push({
      status,
      changedBy: req.user._id,
      timestamp: new Date(),
      notes
    });

    await booking.save();

    // Notify patient via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.patient}`).emit('bookingUpdate', {
        bookingId: booking._id,
        status,
        message: `Your bed booking has been ${status}`
      });
    }

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
});

// @route   PUT /api/beds/bookings/:id/process
// @desc    Process bed booking (confirm/reject/check-in/check-out)
// @access  Staff/Admin
router.put('/bookings/:id/process', protect, authorize('staff', 'admin'), checkApproval, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const booking = await BedBooking.findById(req.params.id)
      .populate('bed')
      .populate('hospital');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;
    booking.processedBy = req.user._id;

    if (status === 'confirmed') {
      booking.approvedBy = req.user._id;
    }

    if (status === 'checked-in') {
      booking.checkInTime = new Date();
      // Update bed to occupied
      await Bed.findByIdAndUpdate(booking.bed._id, {
        status: 'occupied',
        isAvailable: false,
        lastOccupied: new Date()
      });
    }

    if (status === 'checked-out' || status === 'cancelled') {
      booking.checkOutTime = new Date();
      if (status === 'checked-out') {
        booking.actualDischargeDate = new Date();
        await booking.calculateCharges();
      }
      // Free up the bed
      await Bed.findByIdAndUpdate(booking.bed._id, {
        status: 'cleaning',
        isAvailable: false,
        currentPatient: null,
        currentBooking: null
      });
    }

    booking.notes = notes;
    booking.history.push({
      status,
      changedBy: req.user._id,
      timestamp: new Date(),
      notes
    });

    await booking.save();

    // Update hospital bed count
    await booking.hospital.updateBedCount();

    // Notify patient
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.patient}`).emit('bookingUpdate', {
        bookingId: booking._id,
        status
      });
    }

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing booking',
      error: error.message
    });
  }
});

// @route   DELETE /api/beds/:id
// @desc    Delete a bed
// @access  Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }

    if (bed.status === 'occupied' || bed.status === 'reserved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an occupied or reserved bed'
      });
    }

    await bed.deleteOne();

    // Update hospital bed count
    const hospital = await Hospital.findById(bed.hospital);
    if (hospital) {
      await hospital.updateBedCount();
    }

    res.json({
      success: true,
      message: 'Bed deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting bed',
      error: error.message
    });
  }
});

module.exports = router;
