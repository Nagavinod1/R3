const mongoose = require('mongoose');

const BlockchainTransactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: ['blood_unit_add', 'blood_unit_update', 'blood_unit_use', 'bed_status_update', 'bed_booking', 'verification'],
    required: true
  },
  entityType: {
    type: String,
    enum: ['BloodUnit', 'Bed', 'BedBooking'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType'
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  blockHash: {
    type: String
  },
  gasUsed: {
    type: Number
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  dataHash: {
    type: String
  },
  previousHash: {
    type: String
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for quick lookups (transactionHash already indexed via unique: true)
BlockchainTransactionSchema.index({ entityType: 1, entityId: 1 });
BlockchainTransactionSchema.index({ hospital: 1, transactionType: 1 });

// Static method to get transaction history for an entity
BlockchainTransactionSchema.statics.getEntityHistory = async function(entityType, entityId) {
  return this.find({ entityType, entityId })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'name email');
};

// Static method to verify transaction chain
BlockchainTransactionSchema.statics.verifyChain = async function(entityType, entityId) {
  const transactions = await this.find({ entityType, entityId }).sort({ createdAt: 1 });
  
  if (transactions.length === 0) return { valid: true, message: 'No transactions found' };
  
  for (let i = 1; i < transactions.length; i++) {
    if (transactions[i].previousHash !== transactions[i-1].dataHash) {
      return {
        valid: false,
        message: 'Chain broken at transaction ' + transactions[i].transactionHash,
        brokenAt: i
      };
    }
  }
  
  return { valid: true, message: 'Chain verified successfully', totalTransactions: transactions.length };
};

module.exports = mongoose.model('BlockchainTransaction', BlockchainTransactionSchema);
