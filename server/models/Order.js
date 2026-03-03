const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, ref: 'User' },
  items: { type: Array, default: [] },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'cashfree' },
  paymentStatus: { type: String, default: 'INITIATED' },
  status: { type: String, default: 'Pending' },
  orderCurrency: { type: String, default: 'INR' },
  address: {
    fullAddress: { type: String, default: '' },
    pinCode: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  customer: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  cashfreeOrderId: { type: String, index: true },
  cashfreeCfOrderId: String,
  paymentSessionId: String,
  paidAt: Date,
  trackingStage: {
    type: String,
    enum: ['Order Placed', 'Packed', 'Shipped', 'Delivered'],
    default: 'Order Placed'
  },
  trackingUpdatedAt: Date,
  cancellationReason: { type: String, default: '' },
  cancelledAt: Date,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
