import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  // --- DEBUGGING: Remove this once ratings appear ---
  // console.log(`Product: ${product.name} | Rating: ${product.averageRating}`);

  // Normalize data to ensure numbers are used for calculation
  const avgRating = parseFloat(product.averageRating) || 0;
  const totalReviews = parseInt(product.reviewCount) || 0;

  const handleImageError = (e) => {
    e.target.onerror = null; 
    e.target.src = "https://via.placeholder.com/300x200?text=Image+Coming+Soon";
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product._id}`} className="product-link-wrapper">
        <div className="product-image">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              onError={handleImageError} 
            />
          ) : (
            <div className="image-placeholder">💻</div>
          )}
          {product.stock <= 0 && <span className="stock-badge">Out of Stock</span>}
        </div>
      </Link>
      
      <div className="product-info">
        <div className="category-row">
          <p className="product-category">{product.category}</p>
          {product.subCategory && (
            <span className="product-subcategory"> • {product.subCategory}</span>
          )}
        </div>

        <Link to={`/product/${product._id}`} className="product-link-wrapper">
          <h3 className="product-name">{product.name}</h3>
        </Link>
        
        {/* Updated Rating Section */}
        <div className="product-rating">
          <div className="stars-container">
            {renderStars(avgRating)}
          </div>
          <span className="rating-text">
            {avgRating > 0 
              ? `${avgRating.toFixed(1)} (${totalReviews})` 
              : "No reviews yet"}
          </span>
        </div>
        
        <p className="product-description">
          {product.description?.substring(0, 60) || "High-performance hardware for your computing needs."}...
        </p>
        
        <div className="product-card-footer">
          <span className="product-price">₹{product.price?.toLocaleString('en-IN')}</span>
          
          <button 
            className="add-btn" 
            onClick={() => addToCart(product)}
            disabled={product.stock <= 0}
          >
            {product.stock <= 0 ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;