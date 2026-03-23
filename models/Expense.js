const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  notes: { type: String, default: '' },
  paymentMode: { type: String, default: 'Cash' },
  attachmentUrl: { type: String, default: '' }
}, {
  timestamps: true
});

ExpenseSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
