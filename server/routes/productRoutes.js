const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const Product = require('../models/Product');
const Review = require('../models/Review');
const User = require('../models/User');
const Order = require('../models/Order');
const authRequired = require('../middleware/auth');

const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2023-08-01';
const CASHFREE_ENV = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase();

const getCashfreeBaseUrl = () => (
  CASHFREE_ENV === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com'
);

const getCashfreeHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-version': CASHFREE_API_VERSION,
  'x-client-id': process.env.CASHFREE_APP_ID,
  'x-client-secret': process.env.CASHFREE_SECRET_KEY
});

const getOrderStatusFromPayment = (paymentStatus) => {
  if (paymentStatus === 'PAID' || paymentStatus === 'SUCCESS') return 'Success';
  if (['FAILED', 'USER_DROPPED', 'CANCELLED', 'EXPIRED', 'TERMINATED'].includes(paymentStatus)) return 'Failed';
  return 'Pending';
};

const generateMerchantOrderId = () => `ICON_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
const TRACKING_STAGES = ['Order Placed', 'Packed', 'Shipped', 'Delivered'];

// --- ADMIN STATS ROUTE ---
router.get('/admin/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const orders = await Order.find({ status: 'Success' });
    const totalRevenue = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

    const categoryStats = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      inventoryCount: totalProducts,
      userCount: totalUsers,
      revenue: totalRevenue,
      topCategory: categoryStats.length > 0 ? categoryStats[0]._id : 'None'
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

router.get('/admin/revenue-trend', authRequired, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const months = Math.min(Math.max(Number(req.query.months) || 6, 3), 12);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const paidStatuses = ['Success', 'Packed', 'Shipped', 'Delivered'];
    const orders = await Order.find({
      createdAt: { $gte: start, $lt: end },
      status: { $in: paidStatuses }
    })
      .select('createdAt totalAmount')
      .lean();

    const monthlyRevenue = new Map();
    for (let i = 0; i < months; i += 1) {
      const bucket = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${bucket.getFullYear()}-${String(bucket.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue.set(key, 0);
    }

    orders.forEach((order) => {
      const dt = new Date(order.createdAt);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyRevenue.has(key)) {
        monthlyRevenue.set(key, monthlyRevenue.get(key) + Number(order.totalAmount || 0));
      }
    });

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const points = Array.from(monthlyRevenue.entries()).map(([key, revenue]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        key,
        label: `${labels[month - 1]} ${String(year).slice(-2)}`,
        revenue: Number(revenue.toFixed(2))
      };
    });

    const currentRevenue = points[points.length - 1]?.revenue || 0;
    const previousRevenue = points[points.length - 2]?.revenue || 0;
    const growthPercent = previousRevenue > 0
      ? Number((((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(2))
      : (currentRevenue > 0 ? 100 : 0);

    return res.json({
      months,
      points,
      summary: {
        currentRevenue,
        previousRevenue,
        growthPercent
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch revenue trend.' });
  }
});

router.get('/admin/users', authRequired, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const users = await User.find()
      .select('username email role isVerified isBlocked createdAt')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

router.get('/admin/verifications', authRequired, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const verifications = await Order.find({
      paymentMethod: 'upi',
      paymentStatus: { $in: ['INITIATED', 'PENDING', 'UNKNOWN'] },
      status: { $in: ['Pending', 'Success'] }
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json({ verifications });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch verification requests.' });
  }
});

// --- ADMIN ORDER TRACKING ROUTES ---
router.get('/admin/orders', authRequired, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const orders = await Order.find().sort({ createdAt: -1 }).limit(200).lean();

    const userIds = [...new Set(
      orders
        .map((o) => String(o.userId || ''))
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    )];

    const users = await User.find({ _id: { $in: userIds } }).select('_id username').lean();
    const userMap = new Map(users.map((u) => [String(u._id), u.username]));

    const normalizedOrders = orders.map((order) => ({
      ...order,
      displayOrderId: order.cashfreeOrderId || `ICON_LOCAL_${String(order._id).slice(-8).toUpperCase()}`,
      userDisplayName:
        order.customer?.name ||
        userMap.get(String(order.userId || '')) ||
        'Guest'
    }));

    return res.json({ orders: normalizedOrders });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch admin orders.' });
  }
});

router.patch('/admin/orders/:orderId/tracking', authRequired, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { orderId } = req.params;
    const { trackingStage } = req.body;

    if (!TRACKING_STAGES.includes(trackingStage)) {
      return res.status(400).json({ message: 'Invalid tracking stage.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cancelled orders cannot be moved in tracking.' });
    }

    order.trackingStage = trackingStage;
    order.trackingUpdatedAt = new Date();
    if (trackingStage === 'Order Placed') order.status = 'Success';
    if (trackingStage === 'Packed') order.status = 'Packed';
    if (trackingStage === 'Shipped') order.status = 'Shipped';
    if (trackingStage === 'Delivered') order.status = 'Delivered';

    await order.save();
    return res.json({ message: 'Tracking stage updated.', order });
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update tracking stage.' });
  }
});

// --- CASHFREE PAYMENT ROUTES ---
router.post('/payment/cashfree/create-order', async (req, res) => {
  try {
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return res.status(500).json({
        message: 'Cashfree is not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in server/.env.'
      });
    }

    const { userId, items, totalAmount, address, customer, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart items are required.' });
    }

    if (!Number(totalAmount) || Number(totalAmount) <= 0) {
      return res.status(400).json({ message: 'A valid order amount is required.' });
    }

    if (!address?.fullAddress || !address?.pinCode || !address?.phone) {
      return res.status(400).json({ message: 'Delivery address and phone are required.' });
    }

    const orderId = generateMerchantOrderId();
    const customerId = userId ? String(userId) : `guest_${Date.now()}`;
    const returnUrlBase = process.env.CASHFREE_RETURN_URL || 'http://localhost:3000/my-orders';

    const payload = {
      order_id: orderId,
      order_amount: Number(totalAmount.toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: customer?.name || 'Icon Customer',
        customer_email: customer?.email || 'customer@iconcomputers.local',
        customer_phone: customer?.phone || address.phone
      },
      order_meta: {
        return_url: `${returnUrlBase}?order_id={order_id}`,
        notify_url: process.env.CASHFREE_NOTIFY_URL || undefined
      },
      order_note: `Payment for ${items.length} item(s) at Icon Computers`
    };

    if (!payload.order_meta.notify_url) {
      delete payload.order_meta.notify_url;
    }

    const cfResponse = await fetch(`${getCashfreeBaseUrl()}/pg/orders`, {
      method: 'POST',
      headers: getCashfreeHeaders(),
      body: JSON.stringify(payload)
    });

    const cfData = await cfResponse.json();

    if (!cfResponse.ok || !cfData?.payment_session_id) {
      return res.status(cfResponse.status || 400).json({
        message: 'Failed to create Cashfree order.',
        details: cfData
      });
    }

    const newOrder = await Order.create({
      userId: userId || 'GUEST',
      items,
      totalAmount: Number(totalAmount),
      paymentMethod: paymentMethod || 'cashfree',
      paymentStatus: 'INITIATED',
      status: 'Pending',
      orderCurrency: 'INR',
      address,
      customer,
      cashfreeOrderId: orderId,
      cashfreeCfOrderId: String(cfData.cf_order_id || ''),
      paymentSessionId: cfData.payment_session_id,
      trackingStage: 'Order Placed',
      trackingUpdatedAt: new Date(),
      gatewayResponse: cfData,
      createdAt: new Date()
    });

    return res.status(201).json({
      localOrderId: newOrder._id,
      orderId,
      paymentSessionId: cfData.payment_session_id,
      cashfreeOrderId: String(cfData.cf_order_id || ''),
      cashfreeEnv: CASHFREE_ENV
    });
  } catch (err) {
    console.error('Cashfree create-order error:', err);
    return res.status(500).json({ message: 'Unable to create payment order.' });
  }
});

router.post('/payment/cashfree/verify', async (req, res) => {
  try {
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return res.status(500).json({ message: 'Cashfree is not configured.' });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required.' });
    }

    const cfResponse = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: getCashfreeHeaders()
    });

    const cfData = await cfResponse.json();

    if (!cfResponse.ok) {
      return res.status(cfResponse.status || 400).json({
        message: 'Failed to verify Cashfree order.',
        details: cfData
      });
    }

    const paymentStatus = cfData?.order_status || 'UNKNOWN';
    const status = getOrderStatusFromPayment(paymentStatus);

    const updateData = {
      paymentStatus,
      status,
      gatewayResponse: cfData
    };

    if (status === 'Success') {
      updateData.paidAt = new Date();
    }

    const order = await Order.findOneAndUpdate(
      { cashfreeOrderId: orderId },
      { $set: updateData },
      { new: true }
    );

    return res.json({
      paid: status === 'Success',
      status,
      paymentStatus,
      orderId,
      localOrderId: order?._id || null
    });
  } catch (err) {
    console.error('Cashfree verify error:', err);
    return res.status(500).json({ message: 'Unable to verify payment status.' });
  }
});

router.post('/payment/cashfree/webhook', async (req, res) => {
  try {
    const signature = req.get('x-webhook-signature');
    const timestamp = req.get('x-webhook-timestamp');
    const rawBody = req.rawBody || '';

    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY;

    if (webhookSecret && signature && timestamp && rawBody) {
      const signedPayload = `${timestamp}${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('base64');

      if (expectedSignature !== signature) {
        return res.status(401).json({ message: 'Invalid webhook signature.' });
      }
    }

    const eventData = req.body || {};
    const payment = eventData?.data?.payment || {};
    const order = eventData?.data?.order || {};
    const orderId = order?.order_id;

    if (!orderId) {
      return res.status(200).json({ received: true });
    }

    const paymentStatus = payment?.payment_status || order?.order_status || 'UNKNOWN';
    const status = getOrderStatusFromPayment(paymentStatus);

    const updateData = {
      paymentStatus,
      status,
      gatewayResponse: eventData
    };

    if (status === 'Success') {
      updateData.paidAt = new Date();
    }

    await Order.findOneAndUpdate(
      { cashfreeOrderId: orderId },
      { $set: updateData },
      { new: true }
    );

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Cashfree webhook error:', err);
    return res.status(500).json({ message: 'Webhook processing failed.' });
  }
});

// --- ORDER ROUTE (COD / Manual) ---
router.post('/order', async (req, res) => {
  try {
    const { userId, items, totalAmount, paymentMethod, address, customer } = req.body;

    const newOrder = new Order({
      userId,
      items,
      totalAmount: Number(totalAmount),
      paymentMethod,
      address,
      customer,
      paymentStatus: paymentMethod === 'cod' ? 'PENDING_COD' : 'PAID',
      status: paymentMethod === 'cod' ? 'Pending' : 'Success',
      cashfreeOrderId: generateMerchantOrderId(),
      trackingStage: 'Order Placed',
      trackingUpdatedAt: new Date(),
      createdAt: new Date()
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ message: 'Order placement failed', error: err.message });
  }
});

// --- USER ORDER ROUTES ---
router.get('/orders/my', authRequired, async (req, res) => {
  try {
    const userId = String(req.userId);
    const query = [{ userId }];

    if (mongoose.Types.ObjectId.isValid(userId)) {
      query.push({ userId: new mongoose.Types.ObjectId(userId) });
    }

    const orders = await Order.find({ $or: query }).sort({ createdAt: -1 });
    return res.json({ orders });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch orders.' });
  }
});

router.patch('/orders/:orderId/cancel', authRequired, async (req, res) => {
  try {
    const userId = String(req.userId);
    const orderId = req.params.orderId;
    const reason = req.body?.reason?.trim?.() || '';

    const query = [{ userId }];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      query.push({ userId: new mongoose.Types.ObjectId(userId) });
    }

    const order = await Order.findOne({ _id: orderId, $or: query });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const blockedStatuses = ['Cancelled', 'Delivered', 'Shipped', 'Failed'];
    if (blockedStatuses.includes(order.status)) {
      return res.status(400).json({ message: `Order cannot be cancelled in ${order.status} state.` });
    }

    order.status = 'Cancelled';
    order.paymentStatus = order.paymentStatus === 'PAID' ? 'REFUND_PENDING' : 'CANCELLED';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    await order.save();

    return res.json({
      message: 'Order cancelled successfully.',
      order
    });
  } catch (err) {
    return res.status(400).json({ message: 'Failed to cancel order.' });
  }
});

// --- PRODUCT ROUTES ---
router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const matchQuery = {};

    if (category && category.toLowerCase() !== 'all' && category.trim() !== '') {
      const searchTerm = category.trim();
      matchQuery.$or = [
        { category: { $regex: `^${searchTerm}$`, $options: 'i' } },
        { subCategory: { $regex: `^${searchTerm}$`, $options: 'i' } }
      ];
    }

    if (search) {
      matchQuery.name = { $regex: search.trim(), $options: 'i' };
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'reviews',
          let: { prodId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toObjectId: '$productId' }, '$$prodId']
                }
              }
            }
          ],
          as: 'reviews'
        }
      },
      {
        $addFields: {
          averageRating: {
            $round: [{ $ifNull: [{ $avg: '$reviews.rating' }, 0] }, 1]
          },
          reviewCount: { $size: '$reviews' }
        }
      }
    ];

    if (sort === 'priceLow') pipeline.push({ $sort: { price: 1 } });
    else if (sort === 'priceHigh') pipeline.push({ $sort: { price: -1 } });
    else if (sort === 'topRated') pipeline.push({ $sort: { averageRating: -1, reviewCount: -1 } });
    else pipeline.push({ $sort: { createdAt: -1 } });

    const products = await Product.aggregate(pipeline);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Fetching products failed' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Product ID format' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const newProduct = new Product({
      ...req.body,
      price: Number(req.body.price),
      stock: Number(req.body.stock)
    });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    const updateData = { ...req.body };
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.stock) updateData.stock = Number(updateData.stock);

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: 'Update failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    await Review.deleteMany({ productId: req.params.id });
    res.json({ message: 'Product and reviews deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

// --- REVIEW ROUTES ---
router.post('/:id/reviews', async (req, res) => {
  try {
    const newReview = new Review({
      productId: req.params.id,
      rating: Number(req.body.rating),
      comment: req.body.comment?.trim() || '',
      userName: req.body.userName || 'Anonymous'
    });
    await newReview.save();
    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(400).json({ message: 'Failed to save review' });
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

router.delete('/delete/:reviewId', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.reviewId);
    res.json({ message: 'Review removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting review' });
  }
});

module.exports = router;
