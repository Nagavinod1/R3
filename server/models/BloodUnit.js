const mongoose = require('mongoose');

const BloodUnitSchema = new mongoose.Schema({
  bloodGroup: {
    type: String,
    required: [true, 'Please provide blood group'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity in units'],
    min: [1, 'Quantity must be at least 1 unit']
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'used', 'expired', 'discarded'],
    default: 'available'
  },
  donorInfo: {
    name: String,
    age: Number,
    gender: String,
    phone: String,
    bloodDonationId: String
  },
  collectionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  componentType: {
    type: String,
    enum: ['whole_blood', 'packed_rbc', 'platelets', 'plasma', 'cryoprecipitate'],
    default: 'whole_blood'
  },
  storageLocation: {
    type: String,
    default: ''
  },
  testResults: {
    hiv: { type: Boolean, default: false },
    hepatitisB: { type: Boolean, default: false },
    hepatitisC: { type: Boolean, default: false },
    syphilis: { type: Boolean, default: false },
    malaria: { type: Boolean, default: false },
    isCleared: { type: Boolean, default: true }
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blockchainTxHash: {
    type: String
  },
  blockchainBlockNumber: {
    type: Number
  },
  notes: {
    type: String
  },
  history: [{
    action: {
      type: String,
      enum: ['added', 'updated', 'reserved', 'used', 'expired', 'discarded']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    blockchainTxHash: String
  }]
}, {
  timestamps: true
});

// Index for quick lookups
BloodUnitSchema.index({ bloodGroup: 1, status: 1, hospital: 1 });
BloodUnitSchema.index({ expiryDate: 1 });

// Check if blood is expired
BloodUnitSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

// Days until expiry
BloodUnitSchema.methods.daysUntilExpiry = function() {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Pre-save hook to check expiry
BloodUnitSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'available') {
    this.status = 'expired';
  }
  next();
});

// Static method to get inventory summary
BloodUnitSchema.statics.getInventorySummary = async function(hospitalId) {
  const match = hospitalId ? { hospital: hospitalId, status: 'available' } : { status: 'available' };
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$bloodGroup',
        totalUnits: { $sum: '$quantity' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get low stock alerts
BloodUnitSchema.statics.getLowStockAlerts = async function(threshold = 5) {
  const inventory = await this.getInventorySummary();
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  return bloodGroups.map(group => {
    const found = inventory.find(i => i._id === group);
    const units = found ? found.totalUnits : 0;
    return {
      bloodGroup: group,
      units,
      isLow: units < threshold,
      status: units === 0 ? 'critical' : units < threshold ? 'low' : 'normal'
    };
  });
};

module.exports = mongoose.model('BloodUnit', BloodUnitSchema);
