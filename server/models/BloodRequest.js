const mongoose = require('mongoose');

const BloodRequestSchema = new mongoose.Schema({
  requestType: {
    type: String,
    enum: ['emergency', 'normal', 'scheduled'],
    default: 'normal'
  },
  bloodGroup: {
    type: String,
    required: [true, 'Please provide blood group'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  unitsRequired: {
    type: Number,
    required: [true, 'Please provide units required'],
    min: [1, 'Minimum 1 unit required']
  },
  unitsApproved: {
    type: Number,
    default: 0
  },
  componentType: {
    type: String,
    enum: ['whole_blood', 'packed_rbc', 'platelets', 'plasma', 'cryoprecipitate'],
    default: 'whole_blood'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientInfo: {
    name: {
      type: String,
      required: true
    },
    age: Number,
    gender: String,
    bloodGroup: String,
    condition: String,
    hospitalAdmissionId: String
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  targetHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'partially_approved', 'rejected', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3  // 1 = highest priority
  },
  requiredBy: {
    type: Date
  },
  reason: {
    type: String,
    required: [true, 'Please provide reason for request']
  },
  medicalDocuments: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  fulfilledAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  fulfilledUnits: [{
    bloodUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodUnit'
    },
    quantity: Number,
    assignedAt: Date
  }],
  notes: {
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
BloodRequestSchema.index({ status: 1, bloodGroup: 1, requestType: 1 });
BloodRequestSchema.index({ requestedBy: 1 });
BloodRequestSchema.index({ hospital: 1 });

// Pre-save hook to add history
BloodRequestSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.history.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

// Static method to get request statistics
BloodRequestSchema.statics.getRequestStats = async function(hospitalId) {
  const match = hospitalId ? { hospital: hospitalId } : {};
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const emergency = await this.countDocuments({ ...match, requestType: 'emergency', status: 'pending' });
  
  return {
    byStatus: stats,
    emergencyPending: emergency
  };
};

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);
