const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const BedBooking = require('../models/BedBooking');

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Get user's blood requests
    const bloodRequests = await BloodRequest.find({ requestedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('hospital', 'name');

    // Get user's bed bookings
    const bedBookings = await BedBooking.find({ patient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('hospital', 'name')
      .populate('bed', 'bedNumber ward type');

    // Get request statistics
    const bloodRequestStats = await BloodRequest.aggregate([
      { $match: { requestedBy: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const bedBookingStats = await BedBooking.aggregate([
      { $match: { patient: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        bloodRequests,
        bedBookings,
        stats: {
          bloodRequests: bloodRequestStats,
          bedBookings: bedBookingStats
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/users/blood-requests
// @desc    Get user's blood requests
// @access  Private
router.get('/blood-requests', protect, async (req, res) => {
  try {
    const { status } = req.query;
    let query = { requestedBy: req.user._id };
    if (status) query.status = status;

    const requests = await BloodRequest.find(query)
      .populate('hospital', 'name address')
      .populate('targetHospital', 'name address')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blood requests',
      error: error.message
    });
  }
});

// @route   GET /api/users/bed-bookings
// @desc    Get user's bed bookings
// @access  Private
router.get('/bed-bookings', protect, async (req, res) => {
  try {
    const { status } = req.query;
    let query = { patient: req.user._id };
    if (status) query.status = status;

    const bookings = await BedBooking.find(query)
      .populate('bed', 'bedNumber ward type pricePerDay')
      .populate('hospital', 'name address phone')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bed bookings',
      error: error.message
    });
  }
});

// @route   PUT /api/users/blood-requests/:id/cancel
// @desc    Cancel blood request
// @access  Private
router.put('/blood-requests/:id/cancel', protect, async (req, res) => {
  try {
    const request = await BloodRequest.findOne({
      _id: req.params.id,
      requestedBy: req.user._id
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a request that is already processed'
      });
    }

    request.status = 'cancelled';
    request.history.push({
      status: 'cancelled',
      changedBy: req.user._id,
      timestamp: new Date(),
      notes: 'Cancelled by user'
    });

    await request.save();

    res.json({
      success: true,
      message: 'Blood request cancelled successfully',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling request',
      error: error.message
    });
  }
});

// @route   PUT /api/users/bed-bookings/:id/cancel
// @desc    Cancel bed booking
// @access  Private
router.put('/bed-bookings/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await BedBooking.findOne({
      _id: req.params.id,
      patient: req.user._id
    }).populate('bed');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Bed booking not found'
      });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a booking that is checked-in or completed'
      });
    }

    booking.status = 'cancelled';
    booking.history.push({
      status: 'cancelled',
      changedBy: req.user._id,
      timestamp: new Date(),
      notes: 'Cancelled by user'
    });

    await booking.save();

    // Free up the bed if it was reserved
    if (booking.bed) {
      const Bed = require('../models/Bed');
      await Bed.findByIdAndUpdate(booking.bed._id, {
        status: 'available',
        isAvailable: true,
        currentPatient: null,
        currentBooking: null
      });
    }

    res.json({
      success: true,
      message: 'Bed booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
});

// @route   GET /api/users/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    
    res.json({
      success: true,
      data: user.notifications,
      unreadCount: user.notifications.filter(n => !n.read).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// @route   PUT /api/users/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'notifications.$[].read': true }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notifications',
      error: error.message
    });
  }
});

module.exports = router;
