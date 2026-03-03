const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  description: {
    type: String,
    required: true
  },
  /**
   * category: Stores the broad group (e.g., "LAPTOPS", "MONITORS")
   * This matches the main icons on your Homepage.
   */
  category: { 
    type: String, 
    required: true,
    uppercase: true, // Standardizes "laptops" to "LAPTOPS"
    trim: true
  },
  /**
   * subCategory: Stores the specific filter tag (e.g., "Gaming Laptops")
   * This allows the $or logic in your routes to find specific types.
   */
  subCategory: { 
    type: String, 
    required: true,
    trim: true
  },
  image: { 
    type: String, 
    required: true 
  },
  stock: { 
    type: Number, 
    default: 0 
  }
  // Note: 'ratings' and 'reviews' arrays are removed here because your 
  // system calculates them dynamically from the Reviews collection 
  // using $lookup in productRoutes.js.
}, { 
  timestamps: true // Automatically creates 'createdAt' and 'updatedAt'
});

module.exports = mongoose.model('Product', productSchema);