const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., box, bag, can, packet
  weight: { type: Number, required: true }, // Standard weight in kg
  unit: { type: String, default: 'kg' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, {
  timestamps: true
});

PackageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Package', PackageSchema);
