const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, default: '' },
  categoryId: { type: String, default: '' }, // Can be name or ID for now
  unit: { type: String, default: 'kg' },
  hsnCode: { type: String, default: '' },
  price: { type: Number, default: 0 },
  description: { type: String, default: '' },
  defaultLifeMonths: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, {
  timestamps: true
});

ProductSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Product', ProductSchema);
