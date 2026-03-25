const mongoose = require('mongoose');

const CompanySettingsSchema = new mongoose.Schema({
  // Company Identity
  companyName: { type: String, default: 'JCRM COLD STORAGE LLP' },
  companyShortName: { type: String, default: 'JCRM' },
  companyTagline: { type: String, default: 'COLD STORAGE' },
  logoUrl: { type: String, default: '' },

  // Address
  address: { type: String, default: 'BESIDE PRIMARY SCHOOL, OLD HALPATI VAS & ISHANPOR GRAM, OLPAD ROAD, PIN – 394540' },
  city: { type: String, default: 'Surat' },
  state: { type: String, default: 'Gujarat' },
  pincode: { type: String, default: '394540' },

  // Contact
  phone: { type: String, default: '8128299220' },
  email: { type: String, default: 'jcrmcoldstorage1@gmail.com' },

  // Tax & Legal
  gstNumber: { type: String, default: '24AAUFJ0917F1ZD' },
  panNumber: { type: String, default: '' },
  sacCode: { type: String, default: '996721' },

  // Bank Details
  bankName: { type: String, default: 'Canara Bank' },
  bankBranch: { type: String, default: 'Hazira' },
  accountNumber: { type: String, default: '120029409483' },
  ifscCode: { type: String, default: 'CNRB0003428' },

  // Invoice Customization
  termsAndConditions: [{
    type: String
  }],
  jurisdiction: { type: String, default: 'SURAT' },
  signatureLabel: { type: String, default: 'Authorized Signatory' },
  footerText: { type: String, default: 'THIS IS A COMPUTER GENERATED DOCUMENT' },
}, {
  timestamps: true
});

// Ensure only one settings document exists (singleton pattern)
CompanySettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      termsAndConditions: [
        'Any complaint about this tax invoice must be lodged within two working days.',
        'Payment to be made in favour of JCRM Cold Storage LLP.',
        'Interest @24% p.a. will be charged if not paid within 7 days.',
        'All goods are stored at owner\'s risk.'
      ]
    });
  }
  return settings;
};

CompanySettingsSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('CompanySettings', CompanySettingsSchema);
