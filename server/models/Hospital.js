const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide hospital name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  registrationNumber: {
    type: String,
    required: [true, 'Please provide registration number'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number']
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  type: {
    type: String,
    enum: ['government', 'private', 'semi-government'],
    default: 'private'
  },
  specializations: [{
    type: String
  }],
  facilities: [{
    type: String
  }],
  totalBeds: {
    type: Number,
    default: 0
  },
  availableBeds: {
    type: Number,
    default: 0
  },
  icuBeds: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  ventilators: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  hasBloodBank: {
    type: Boolean,
    default: false
  },
  hasEmergency: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  images: [{
    type: String
  }],
  operatingHours: {
    is24x7: {
      type: Boolean,
      default: false
    },
    openTime: String,
    closeTime: String
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockchainHash: {
    type: String
  }
}, {
  timestamps: true
});

// Index for geospatial queries
HospitalSchema.index({ 'address.coordinates': '2dsphere' });

// Virtual for full address
HospitalSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.district}, ${this.address.state} - ${this.address.pincode}`;
});

// Update available beds count
HospitalSchema.methods.updateBedCount = async function() {
  const Bed = mongoose.model('Bed');
  const beds = await Bed.find({ hospital: this._id });
  this.totalBeds = beds.length;
  this.availableBeds = beds.filter(b => b.isAvailable && b.status === 'available').length;
  this.icuBeds.total = beds.filter(b => b.type === 'ICU').length;
  this.icuBeds.available = beds.filter(b => b.type === 'ICU' && b.isAvailable && b.status === 'available').length;
  return this.save();
};

module.exports = mongoose.model('Hospital', HospitalSchema);
