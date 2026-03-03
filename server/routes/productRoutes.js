const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); 
const Product = require('../models/Product');
const Review = require('../models/Review');
const User = require('../models/User'); 
// Ensure you create this model or use a generic collection
const Order = require('../models/Order'); 

// --- ADMIN STATS ROUTE (Now Functional) ---
router.get('/admin/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Calculate real revenue by summing all successful orders
    const orders = await Order.find();
    const totalRevenue = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

    const categoryStats = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      inventoryCount: totalProducts,
      userCount: totalUsers,
      revenue: totalRevenue, 
      topCategory: categoryStats.length > 0 ? categoryStats[0]._id : "None"
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

// --- ORDER ROUTES (New: Triggers Revenue Increase) ---
router.post('/order', async (req, res) => {
  try {
    const { userId, items, totalAmount, paymentMethod, address } = req.body;
    
    const newOrder = new Order({
      userId,
      items,
      totalAmount: Number(totalAmount),
      paymentMethod,
      address,
      status: 'Success', // Defaulting to success for your flow
      createdAt: new Date()
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ message: "Order placement failed", error: err.message });
  }
});

// --- PRODUCT ROUTES ---

// 1. VIEW ALL PRODUCTS (With Exact Category Matching)
router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let matchQuery = {};

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

    let pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'reviews',
          let: { prodId: "$_id" }, 
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $eq: [{ $toObjectId: "$productId" }, "$$prodId"] 
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
    res.status(500).json({ message: "Server Error: Fetching products failed" });
  }
});

// 2. VIEW SINGLE PRODUCT DETAILS
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Product ID format" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 3. ADMIN: ADD NEW PRODUCT
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

// 4. ADMIN: UPDATE (MODIFY) PRODUCT
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    const updateData = { ...req.body };
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.stock) updateData.stock = Number(updateData.stock);
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true } 
    );
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: "Update failed" });
  }
});

// 5. ADMIN: DELETE PRODUCT
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    await Review.deleteMany({ productId: req.params.id });
    res.json({ message: "Product and reviews deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// --- REVIEW ROUTES ---
router.post('/:id/reviews', async (req, res) => {
  try {
    const newReview = new Review({
      productId: req.params.id,
      rating: Number(req.body.rating), 
      comment: req.body.comment?.trim() || "",
      userName: req.body.userName || "Anonymous"
    });
    await newReview.save();
    res.status(201).json({ message: "Review added" });
  } catch (err) {
    res.status(400).json({ message: "Failed to save review" });
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

router.delete('/delete/:reviewId', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.reviewId);
    res.json({ message: "Review removed" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting review" });
  }
});

module.exports = router;