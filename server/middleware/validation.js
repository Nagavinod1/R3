const { validationResult, body, param, query } = require('express-validator');

// Validation result handler
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// User registration validation
exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
  body('role')
    .optional()
    .isIn(['user', 'staff']).withMessage('Invalid role'),
  body('bloodGroup')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']).withMessage('Invalid blood group')
];

// Login validation
exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Blood unit validation
exports.bloodUnitValidation = [
  body('bloodGroup')
    .notEmpty().withMessage('Blood group is required')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('expiryDate')
    .notEmpty().withMessage('Expiry date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('componentType')
    .optional()
    .isIn(['whole_blood', 'packed_rbc', 'platelets', 'plasma', 'cryoprecipitate'])
    .withMessage('Invalid component type')
];

// Blood request validation
exports.bloodRequestValidation = [
  body('bloodGroup')
    .notEmpty().withMessage('Blood group is required')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('unitsRequired')
    .notEmpty().withMessage('Units required is required')
    .isInt({ min: 1 }).withMessage('Minimum 1 unit required'),
  body('requestType')
    .optional()
    .isIn(['emergency', 'normal', 'scheduled']).withMessage('Invalid request type'),
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isLength({ min: 10 }).withMessage('Reason must be at least 10 characters'),
  body('patientInfo.name')
    .notEmpty().withMessage('Patient name is required')
];

// Bed validation
exports.bedValidation = [
  body('bedNumber')
    .notEmpty().withMessage('Bed number is required'),
  body('ward')
    .notEmpty().withMessage('Ward is required'),
  body('type')
    .optional()
    .isIn(['general', 'semi-private', 'private', 'ICU', 'NICU', 'PICU', 'CCU', 'emergency', 'maternity', 'pediatric', 'isolation'])
    .withMessage('Invalid bed type'),
  body('pricePerDay')
    .optional()
    .isNumeric().withMessage('Price must be a number')
];

// Bed booking validation
exports.bedBookingValidation = [
  body('bedId')
    .notEmpty().withMessage('Bed ID is required')
    .isMongoId().withMessage('Invalid bed ID'),
  body('patientDetails.name')
    .notEmpty().withMessage('Patient name is required'),
  body('bookingType')
    .optional()
    .isIn(['emergency', 'scheduled', 'walk-in']).withMessage('Invalid booking type')
];

// Hospital validation
exports.hospitalValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Hospital name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('registrationNumber')
    .optional()
    .trim(),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .trim(),
  body('address.city')
    .optional(),
  body('address.district')
    .optional(),
  body('address.state')
    .optional()
];

// MongoDB ID validation
exports.mongoIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];

// Pagination validation
exports.paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];
