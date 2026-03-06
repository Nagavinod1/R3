const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema({
  bedNumber: {
    type: String,
    required: [true, 'Please provide bed number']
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  ward: {
    type: String,
    required: [true, 'Please provide ward name']
  },
  floor: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['general', 'semi-private', 'private', 'ICU', 'NICU', 'PICU', 'CCU', 'emergency', 'maternity', 'pediatric', 'isolation'],
    default: 'emergency'
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance', 'cleaning'],
    default: 'available'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  hasOxygen: {
    type: Boolean,
    default: false
  },
  hasVentilator: {
    type: Boolean,
    default: false
  },
  hasMonitor: {
    type: Boolean,
    default: false
  },
  pricePerDay: {
    type: Number,
    default: 0
  },
  currentPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  currentBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BedBooking'
  },
  lastOccupied: {
    type: Date
  },
  lastCleaned: {
    type: Date
  },
  blockchainTxHash: {
    type: String
  },
  blockchainBlockNumber: {
    type: Number
  },
  history: [{
    action: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance', 'cleaning', 'created', 'updated']
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

// Compound index for unique bed in hospital
BedSchema.index({ hospital: 1, bedNumber: 1, ward: 1 }, { unique: true });
BedSchema.index({ status: 1, type: 1, hospital: 1 });

// Update isAvailable based on status
BedSchema.pre('save', function(next) {
  this.isAvailable = this.status === 'available';
  next();
});

// Static method to get bed statistics
BedSchema.statics.getBedStats = async function(hospitalId) {
  const match = hospitalId ? { hospital: new mongoose.Types.ObjectId(hospitalId) } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: { type: '$type', status: '$status' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
};

// Static method to get available beds count by type
BedSchema.statics.getAvailableBedsByType = async function(hospitalId) {
  const match = hospitalId 
    ? { hospital: new mongoose.Types.ObjectId(hospitalId), status: 'available' } 
    : { status: 'available' };
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('Bed', BedSchema);
