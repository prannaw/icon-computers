// 1. Force Google DNS at the very top to bypass Windows DNS lookup bugs
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- Import Routes ---
const authRoutes = require('./routes/authRoutes'); 
const productRoutes = require('./routes/productRoutes');

const app = express();

// --- Middleware ---
app.use(cors()); 
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// --- Database Connection ---
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is not defined in your .env file!");
  process.exit(1);
}

// Set strictQuery to prepare for Mongoose 7/8 updates
mongoose.set('strictQuery', false);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ Icon Computers DB Connected Successfully");
    console.log("📊 Revenue & User tracking active on MongoDB Atlas");
  })
  .catch((err) => {
    console.error("❌ DB Connection Error: ", err.message);
    console.log("💡 Tip: Check if your IP is whitelisted in MongoDB Atlas Network Access.");
  });

// --- Base Route ---
app.get('/', (req, res) => {
  res.send('🚀 Icon Computers API is running and healthy.');
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// --- Global Error Handling ---
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack);
  res.status(500).json({ 
    message: "Something went wrong on the server!",
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// --- Server Startup ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
});