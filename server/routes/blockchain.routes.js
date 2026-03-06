const express = require('express');
const router = express.Router();
const { protect, authorize, checkApproval } = require('../middleware/auth');
const BlockchainTransaction = require('../models/BlockchainTransaction');
const blockchainService = require('../config/blockchain');

// @route   GET /api/blockchain/status
// @desc    Get blockchain connection status
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const status = {
      initialized: blockchainService.initialized,
      networkUrl: process.env.BLOCKCHAIN_NETWORK || 'Not configured',
      contractAddress: process.env.CONTRACT_ADDRESS || 'Not deployed'
    };

    if (blockchainService.web3) {
      try {
        const blockNumber = await blockchainService.web3.eth.getBlockNumber();
        status.latestBlock = Number(blockNumber);
        status.connected = true;
      } catch (e) {
        status.connected = false;
        status.error = 'Unable to connect to blockchain network';
      }
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking blockchain status',
      error: error.message
    });
  }
});

// @route   GET /api/blockchain/transactions
// @desc    Get blockchain transactions
// @access  Staff/Admin
router.get('/transactions', protect, authorize('staff', 'admin'), checkApproval, async (req, res) => {
  try {
    const { entityType, entityId, hospitalId, limit = 50 } = req.query;
    let query = {};

    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (hospitalId) query.hospital = hospitalId;

    const transactions = await BlockchainTransaction.find(query)
      .populate('hospital', 'name')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit, 10));

    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
});

// @route   GET /api/blockchain/verify/:transactionHash
// @desc    Verify a blockchain transaction
// @access  Public
router.get('/verify/:transactionHash', async (req, res) => {
  try {
    const { transactionHash } = req.params;

    // Get from our database
    const dbTransaction = await BlockchainTransaction.findOne({ transactionHash })
      .populate('hospital', 'name')
      .populate('performedBy', 'name');

    // Verify on blockchain
    const blockchainVerification = await blockchainService.verifyTransaction(transactionHash);

    res.json({
      success: true,
      data: {
        databaseRecord: dbTransaction,
        blockchainVerification,
        isValid: dbTransaction && blockchainVerification.verified
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying transaction',
      error: error.message
    });
  }
});

// @route   GET /api/blockchain/history/:entityType/:entityId
// @desc    Get blockchain history for an entity
// @access  Staff/Admin
router.get('/history/:entityType/:entityId', protect, authorize('staff', 'admin'), checkApproval, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    // Get transactions from database
    const transactions = await BlockchainTransaction.getEntityHistory(entityType, entityId);

    // Verify chain integrity
    const chainVerification = await BlockchainTransaction.verifyChain(entityType, entityId);

    res.json({
      success: true,
      data: {
        transactions,
        chainVerification
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching history',
      error: error.message
    });
  }
});

// @route   POST /api/blockchain/record
// @desc    Manually record a transaction (for admin purposes)
// @access  Admin
router.post('/record', protect, authorize('admin'), async (req, res) => {
  try {
    const { entityType, entityId, transactionType, data, hospital } = req.body;

    // Generate hash for data
    const dataHash = blockchainService.generateHash(data);

    // Get previous transaction for chain
    const previousTx = await BlockchainTransaction.findOne({
      entityType,
      entityId
    }).sort({ createdAt: -1 });

    // Create transaction record
    const transaction = await BlockchainTransaction.create({
      transactionType,
      entityType,
      entityId,
      transactionHash: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      blockNumber: 0,
      status: 'confirmed',
      data,
      dataHash,
      previousHash: previousTx?.dataHash || null,
      hospital,
      performedBy: req.user._id,
      notes: 'Manually recorded transaction'
    });

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording transaction',
      error: error.message
    });
  }
});

// @route   GET /api/blockchain/stats
// @desc    Get blockchain statistics
// @access  Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await BlockchainTransaction.aggregate([
      {
        $group: {
          _id: '$transactionType',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalTransactions = await BlockchainTransaction.countDocuments();
    const confirmedTransactions = await BlockchainTransaction.countDocuments({ status: 'confirmed' });

    let blockchainStats = {};
    if (blockchainService.web3) {
      try {
        blockchainStats.latestBlock = Number(await blockchainService.web3.eth.getBlockNumber());
        blockchainStats.gasPrice = Number(await blockchainService.web3.eth.getGasPrice());
      } catch (e) {
        blockchainStats.error = 'Unable to fetch blockchain stats';
      }
    }

    res.json({
      success: true,
      data: {
        byType: stats,
        totalTransactions,
        confirmedTransactions,
        blockchain: blockchainStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;
