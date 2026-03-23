const mongoose = require('mongoose');

const OutwardSchema = new mongoose.Schema({
  outwardDate: { type: String, required: true },
  inwardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inward', required: true },
  partyId: { type: String, required: true },
  productId: { type: String, required: true },
  outwardWeight: { type: Number, required: true },
  goodsCondition: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, {
  timestamps: true 
});

// To ensure frontend gets `id` instead of `_id`
OutwardSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Outward', OutwardSchema);
