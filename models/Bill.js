const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  partyId: { type: String, required: true },
  partyName: { type: String },
  lineItems: [{
    inwardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inward' },
    description: { type: String },
    quantity: { type: Number },
    unitWeight: { type: Number },
    weight: { type: Number },
    remaining: { type: Number },
    inDate: { type: String },
    outDate: { type: String },
    months: { type: Number },
    rate: { type: Number },
    tax: { type: Number },
    total: { type: Number }
  }],
  subTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  outwardDate: { type: String, default: '' },
  storageMonths: { type: Number, default: 1 },
  gst: { type: Number, default: 0 }, // Percentage or amount
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Unpaid'], default: 'Pending' },
  paymentMode: { type: String, default: 'Cash' },
  remarks: { type: String, default: '' }
}, {
  timestamps: true
});

BillSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Bill', BillSchema);
