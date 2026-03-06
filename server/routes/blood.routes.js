const express = require('express');
const router = express.Router();
const { protect, authorize, checkApproval } = require('../middleware/auth');
const { validate, bloodUnitValidation, bloodRequestValidation } = require('../middleware/validation');
const BloodUnit = require('../models/BloodUnit');
const BloodRequest = require('../models/BloodRequest');
const Hospital = require('../models/Hospital');
const EmergencyAlert = require('../models/EmergencyAlert');
const BlockchainTransaction = require('../models/BlockchainTransaction');
const blockchainService = require('../config/blockchain');

// @route   GET /api/blood/inventory
// @desc    Get blood inventory (filterable by hospital)
// @access  Private
router.get('/inventory', protect, checkApproval, async (req, res) => {
  try {
    const { hospitalId, bloodGroup, status } = req.query;
    let query = {};

    // Staff can only see their hospital's inventory
    if (req.user.role === 'staff' && req.user.hospital) {
      query.hospital = req.user.hospital;
    } else if (hospitalId) {
      query.hospital = hospitalId;
    }

    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (status) query.status = status;

    const inventory = await BloodUnit.find(query)
      .populate('hospital', 'name address')
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });

    // Get summary
    const summary = await BloodUnit.getInventorySummary(query.hospital);
    const lowStockAlerts = await BloodUnit.getLowStockAlerts(5);

    res.json({
      success: true,
      data: {
        inventory,
        summary,
        lowStockAlerts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory',
      error: error.message
    });
  }
});

// @route   GET /api/blood/summary
// @desc    Get blood inventory summary for all blood groups
// @access  Public (for dashboard display)
router.get('/summary', async (req, res) => {
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

    const formattedData = bloodGroups.map(group => {
      const found = inventory.find(i => i._id === group);
      const unitCount = found ? found.totalUnits : 0;
      return {
        bloodGroup: group,
        units: unitCount,
        count: unitCount
      };
    });

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blood summary',
      error: error.message
    });
  }
});

// @route   POST /api/blood/add
// @desc    Add new blood unit
// @access  Staff
router.post('/add', protect, authorize('staff', 'admin'), checkApproval, bloodUnitValidation, validate, async (req, res) => {
  try {
    const {
      bloodGroup,
      quantity,
      expiryDate,
      componentType,
      donorInfo,
      storageLocation,
      testResults,
      notes
    } = req.body;

    // Get hospital from staff's assigned hospital or from request
    const hospitalId = req.user.hospital || req.body.hospitalId;

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: 'Hospital ID is required'
      });
    }

    // Create blood unit
    const bloodUnit = await BloodUnit.create({
      bloodGroup,
      quantity,
      hospital: hospitalId,
      collectionDate: new Date(),
      expiryDate,
      componentType: componentType || 'whole_blood',
      donorInfo,
      storageLocation,
      testResults,
      notes,
      addedBy: req.user._id,
      history: [{
        action: 'added',
        performedBy: req.user._id,
        timestamp: new Date()
      }]
    });

    // Record on blockchain
    const blockchainResult = await blockchainService.recordBloodUnit(
      bloodUnit._id.toString(),
      bloodGroup,
      quantity,
      hospitalId.toString()
    );

    if (blockchainResult.success) {
      bloodUnit.blockchainTxHash = blockchainResult.transactionHash;
      bloodUnit.blockchainBlockNumber = blockchainResult.blockNumber;
      bloodUnit.history[0].blockchainTxHash = blockchainResult.transactionHash;
      await bloodUnit.save();

      const previousTx = await BlockchainTransaction.findOne({
        entityType: 'BloodUnit',
        entityId: bloodUnit._id
      }).sort({ createdAt: -1 });

      await BlockchainTransaction.create({
        transactionType: 'blood_unit_add',
        entityType: 'BloodUnit',
        entityId: bloodUnit._id,
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        status: 'confirmed',
        data: {
          bloodGroup,
          quantity,
          status: bloodUnit.status,
          hospitalId: hospitalId.toString()
        },
        dataHash: blockchainService.generateHash({
          bloodUnitId: bloodUnit._id.toString(),
          bloodGroup,
          quantity,
          status: bloodUnit.status
        }),
        previousHash: previousTx?.dataHash || null,
        hospital: bloodUnit.hospital,
        performedBy: req.user._id
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('bloodInventoryUpdate', {
        type: 'add',
        bloodGroup,
        quantity,
        hospitalId
      });
    }

    res.status(201).json({
      success: true,
      message: 'Blood unit added successfully',
      data: bloodUnit,
      blockchain: blockchainResult
    });
  } catch (error) {
    console.error('Add blood unit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding blood unit',
      error: error.message
    });
  }
});

// @route   PUT /api/blood/:id
// @desc    Update blood unit status
// @access  Staff
router.put('/:id', protect, authorize('staff', 'admin'), checkApproval, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const bloodUnit = await BloodUnit.findById(req.params.id);

    if (!bloodUnit) {
      return res.status(404).json({
        success: false,
        message: 'Blood unit not found'
      });
    }

    // Update status
    bloodUnit.status = status;
    bloodUnit.lastUpdatedBy = req.user._id;
    bloodUnit.history.push({
      action: status,
      performedBy: req.user._id,
      timestamp: new Date(),
      notes
    });

    await bloodUnit.save();

    let blockchainResult = { success: false, message: 'Blockchain not initialized' };
    blockchainResult = await blockchainService.recordBloodUnit(
      bloodUnit._id.toString(),
      bloodUnit.bloodGroup,
      bloodUnit.quantity,
      bloodUnit.hospital.toString()
    );

    if (blockchainResult.success) {
      bloodUnit.blockchainTxHash = blockchainResult.transactionHash;
      bloodUnit.blockchainBlockNumber = blockchainResult.blockNumber;

      const latestHistoryIndex = bloodUnit.history.length - 1;
      if (latestHistoryIndex >= 0) {
        bloodUnit.history[latestHistoryIndex].blockchainTxHash = blockchainResult.transactionHash;
      }
      await bloodUnit.save();

      const previousTx = await BlockchainTransaction.findOne({
        entityType: 'BloodUnit',
        entityId: bloodUnit._id
      }).sort({ createdAt: -1 });

      await BlockchainTransaction.create({
        transactionType: 'blood_unit_update',
        entityType: 'BloodUnit',
        entityId: bloodUnit._id,
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        status: 'confirmed',
        data: {
          bloodGroup: bloodUnit.bloodGroup,
          quantity: bloodUnit.quantity,
          status,
          hospitalId: bloodUnit.hospital.toString()
        },
        dataHash: blockchainService.generateHash({
          bloodUnitId: bloodUnit._id.toString(),
          bloodGroup: bloodUnit.bloodGroup,
          quantity: bloodUnit.quantity,
          status
        }),
        previousHash: previousTx?.dataHash || null,
        hospital: bloodUnit.hospital,
        performedBy: req.user._id
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('bloodInventoryUpdate', {
        type: 'update',
        bloodGroup: bloodUnit.bloodGroup,
        status,
        hospitalId: bloodUnit.hospital
      });
    }

    res.json({
      success: true,
      message: 'Blood unit updated successfully',
      data: bloodUnit,
      blockchain: blockchainResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating blood unit',
      error: error.message
    });
  }
});

// @route   GET /api/blood/requests
// @desc    Get blood requests
// @access  Private
router.get('/requests', protect, checkApproval, async (req, res) => {
  try {
    const { status, bloodGroup, requestType } = req.query;
    let query = {};

    // Role-based filtering
    if (req.user.role === 'user') {
      query.requestedBy = req.user._id;
    } else if (req.user.role === 'staff' && req.user.hospital) {
      query.$or = [
        { hospital: req.user.hospital },
        { targetHospital: req.user.hospital }
      ];
    }

    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (requestType) query.requestType = requestType;

    const requests = await BloodRequest.find(query)
      .populate('requestedBy', 'name email phone')
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

// @route   POST /api/blood/request
// @desc    Create blood request
// @access  User
router.post('/request', protect, bloodRequestValidation, validate, async (req, res) => {
  try {
    const {
      bloodGroup,
      unitsRequired,
      requestType,
      componentType,
      patientInfo,
      targetHospital,
      reason,
      requiredBy
    } = req.body;

    // Set priority based on request type
    let priority = 3;
    if (requestType === 'emergency') priority = 1;
    else if (requestType === 'scheduled') priority = 4;

    const bloodRequest = await BloodRequest.create({
      bloodGroup,
      unitsRequired,
      requestType: requestType || 'normal',
      componentType,
      requestedBy: req.user._id,
      patientInfo,
      hospital: req.user.hospital,
      targetHospital,
      reason,
      requiredBy,
      priority,
      history: [{
        status: 'pending',
        changedBy: req.user._id,
        timestamp: new Date()
      }]
    });

    // Emit socket event for admin and staff - Blood Request Alert
    const io = req.app.get('io');
    if (io) {
      const alertData = {
        requestId: bloodRequest._id,
        bloodGroup,
        unitsRequired,
        requestType: requestType || 'normal',
        priority,
        patientName: patientInfo?.name || 'Unknown',
        reason,
        requestedBy: {
          name: req.user.name,
          email: req.user.email
        },
        timestamp: new Date().toISOString()
      };

      // Send to all staff members
      io.to('staff').emit('newBloodRequest', alertData);
      
      // Send to all admins
      io.to('admin').emit('newBloodRequest', alertData);

      // Also emit a general blood request alert for dashboard updates
      io.emit('bloodRequestAlert', {
        type: 'new_request',
        ...alertData,
        message: `New ${requestType || 'normal'} blood request: ${unitsRequired} units of ${bloodGroup}`
      });

      // Emergency alert for urgent requests
      if (requestType === 'emergency') {
        io.emit('emergencyAlert', {
          type: 'blood_emergency',
          severity: 'critical',
          title: '🩸 Emergency Blood Request',
          bloodGroup,
          unitsRequired,
          patientName: patientInfo?.name,
          message: `URGENT: ${unitsRequired} units of ${bloodGroup} needed immediately!`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Create EmergencyAlert record in database for persistence (so admin can see it later)
    try {
      const severityMap = { 1: 'critical', 2: 'high', 3: 'medium', 4: 'low' };
      await EmergencyAlert.create({
        type: 'blood_shortage',
        severity: severityMap[priority] || 'medium',
        title: `Blood Request: ${unitsRequired} units of ${bloodGroup}`,
        description: `Patient: ${patientInfo?.name || 'Unknown'}. Reason: ${reason || 'Not specified'}. Request type: ${requestType || 'normal'}`,
        affectedBloodGroups: [bloodGroup],
        status: 'active',
        createdBy: req.user._id,
        targetAudience: 'admin',
        autoGenerated: true,
        metadata: {
          bloodRequestId: bloodRequest._id,
          requestedBy: req.user.name,
          patientInfo,
          unitsRequired,
          requestType: requestType || 'normal',
          priority
        }
      });
    } catch (alertError) {
      console.error('Error creating emergency alert record:', alertError);
      // Don't fail the blood request if alert creation fails
    }

    res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully',
      data: bloodRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating blood request',
      error: error.message
    });
  }
});

// @route   PUT /api/blood/requests/:id/process
// @desc    Process blood request (approve/reject)
// @access  Staff
router.put('/requests/:id/process', protect, authorize('staff', 'admin'), checkApproval, async (req, res) => {
  try {
    const { status, unitsApproved, rejectionReason, notes } = req.body;

    const bloodRequest = await BloodRequest.findById(req.params.id);

    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found'
      });
    }

    bloodRequest.status = status;
    bloodRequest.processedBy = req.user._id;
    bloodRequest.processedAt = new Date();

    if (status === 'approved' || status === 'partially_approved') {
      bloodRequest.unitsApproved = unitsApproved || bloodRequest.unitsRequired;
    }

    if (status === 'rejected') {
      bloodRequest.rejectionReason = rejectionReason;
    }

    bloodRequest.notes = notes;
    bloodRequest.history.push({
      status,
      changedBy: req.user._id,
      timestamp: new Date(),
      notes
    });

    await bloodRequest.save();

    // Notify the requester
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${bloodRequest.requestedBy}`).emit('bloodRequestUpdate', {
        requestId: bloodRequest._id,
        status,
        unitsApproved: bloodRequest.unitsApproved
      });
    }

    res.json({
      success: true,
      message: `Blood request ${status} successfully`,
      data: bloodRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing blood request',
      error: error.message
    });
  }
});

// @route   PUT /api/blood/requests/:id
// @desc    Update blood request status (simple update)
// @access  Staff/Admin
router.put('/requests/:id', protect, authorize('staff', 'admin'), checkApproval, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const bloodRequest = await BloodRequest.findById(req.params.id);

    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found'
      });
    }

    bloodRequest.status = status;
    bloodRequest.processedBy = req.user._id;
    bloodRequest.processedAt = new Date();
    if (notes) bloodRequest.notes = notes;

    // Handle fulfilled status
    if (status === 'fulfilled') {
      bloodRequest.fulfilledAt = new Date();
    }

    bloodRequest.history = bloodRequest.history || [];
    bloodRequest.history.push({
      status,
      changedBy: req.user._id,
      timestamp: new Date(),
      notes
    });

    await bloodRequest.save();

    // Notify the requester
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${bloodRequest.requestedBy}`).emit('blood-request-update', {
        requestId: bloodRequest._id,
        status,
        message: `Your blood request has been ${status}`
      });
    }

    res.json({
      success: true,
      message: `Blood request ${status} successfully`,
      data: bloodRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating blood request',
      error: error.message
    });
  }
});

// @route   GET /api/blood/low-stock
// @desc    Get low stock alerts
// @access  Staff/Admin
router.get('/low-stock', protect, authorize('staff', 'admin'), checkApproval, async (req, res) => {
  try {
    const threshold = Number.parseInt(req.query.threshold, 10) || 5;
    const alerts = await BloodUnit.getLowStockAlerts(threshold);

    res.json({
      success: true,
      data: alerts.filter(a => a.isLow)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock alerts',
      error: error.message
    });
  }
});

// @route   GET /api/blood/:id/history
// @desc    Get blood unit history
// @access  Staff/Admin
router.get('/:id/history', protect, authorize('staff', 'admin'), checkApproval, async (req, res) => {
  try {
    const bloodUnit = await BloodUnit.findById(req.params.id)
      .populate('history.performedBy', 'name');

    if (!bloodUnit) {
      return res.status(404).json({
        success: false,
        message: 'Blood unit not found'
      });
    }

    res.json({
      success: true,
      data: bloodUnit.history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching history',
      error: error.message
    });
  }
});

module.exports = router;
