const mongoose = require('mongoose');

const BedBookingSchema = new mongoose.Schema({
  bed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed',
    required: true
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingType: {
    type: String,
    enum: ['emergency', 'scheduled', 'walk-in'],
    default: 'scheduled'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'rejected', 'no-show'],
    default: 'pending'
  },
  patientDetails: {
    name: {
      type: String,
      required: true
    },
    age: Number,
    gender: String,
    phone: String,
    condition: String,
    diagnosis: String,
    referredBy: String
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  expectedDischargeDate: {
    type: Date
  },
  actualDischargeDate: {
    type: Date
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  specialRequirements: [{
    type: String
  }],
  attendingDoctor: {
    name: String,
    specialization: String,
    phone: String
  },
  totalCharges: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'insurance'],
    default: 'pending'
  },
  insuranceDetails: {
    provider: String,
    policyNumber: String,
    coverageAmount: Number
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String
  },
  blockchainTxHash: {
    type: String
  },
  history: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Index for quick lookups
BedBookingSchema.index({ status: 1, hospital: 1 });
BedBookingSchema.index({ patient: 1 });
BedBookingSchema.index({ bed: 1, status: 1 });

// Pre-save hook to add history
BedBookingSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.history.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

// Calculate total charges based on days
BedBookingSchema.methods.calculateCharges = async function() {
  await this.populate('bed');
  const checkIn = this.checkInTime || this.admissionDate;
  const checkOut = this.actualDischargeDate || this.checkOutTime || new Date();
  const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) || 1;
  this.totalCharges = days * (this.bed.pricePerDay || 0);
  return this.totalCharges;
};

// Static method to get booking statistics
BedBookingSchema.statics.getBookingStats = async function(hospitalId) {
  const match = hospitalId ? { hospital: new mongoose.Types.ObjectId(hospitalId) } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('BedBooking', BedBookingSchema);
