const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CouponSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  hashedCoupon: { type: String, required: true }, // bcrypt hash
  isUsed: { type: Boolean, default: false },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  usedAt: { type: Date },
  isActive: { type: Boolean, default: true }, // can be deactivated
}, { timestamps: true });

// compare raw coupon code with stored hash
CouponSchema.methods.compare = function (raw) {
  return bcrypt.compare(raw, this.hashedCoupon);
};

// Drop the stale codeHash_1 unique index left over from a previous schema version.
// It no longer exists in the schema so every insert stores null and hits the
// unique constraint. We drop it once after the model is ready.
CouponSchema.post('init', function () {});
CouponSchema.on('index', () => {});

const CouponModel = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

/**
 * Call once after DB is connected to remove the legacy index.
 * Safe to call multiple times — silently ignores "index not found".
 */
CouponModel.dropStaleIndexes = async function () {
  try {
    await CouponModel.collection.dropIndex('codeHash_1');
  } catch (err) {
    // code 27 / IndexNotFound means it was already gone — that's fine
    if (err?.code !== 27 && err?.codeName !== 'IndexNotFound') {
      console.warn('Coupon: could not drop stale codeHash_1 index:', err?.message);
    }
  }
};

module.exports = CouponModel;
