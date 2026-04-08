const mongoose = require('mongoose');

const InwardSchema = new mongoose.Schema({
  inwardDate: { type: String, required: true },
  partyId: { type: String, required: true },
  productId: { type: String, required: true },
  totalWeight: { type: Number, required: true },
  remainingWeight: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  remainingQuantity: { type: Number, default: 0 },
  unitWeight: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  additionalCharges: [{
    label: { type: String },
    chargeType: { type: String, enum: ['quantity', 'weight', 'fixed'] },
    unit: { type: String },
    value: { type: Number },
    rate: { type: Number },
    amount: { type: Number }
  }],
  goodsCondition: { type: String, default: '' },
  remarks: { type: String, default: '' },
  inwardNumber: { type: String, default: '' }
}, {
  timestamps: true // adds createdAt and updatedAt
});

// To ensure frontend gets `id` instead of `_id`
InwardSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Inward', InwardSchema);
