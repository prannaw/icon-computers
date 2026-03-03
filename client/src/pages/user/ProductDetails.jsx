import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useCart } from '../../context/CartContext';
import { 
  fetchProductDetails, 
  fetchReviews, 
  postReview, 
  deleteReview 
} from '../../api'; 

import '../../styles/ProductDetails.css'; 

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // Initialize navigate
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  
  const storageData = JSON.parse(localStorage.getItem('user'));
  const userRole = storageData?.role || storageData?.result?.role;
  const isAdmin = userRole === 'admin';
  const currentUserName =
    storageData?.username ||
    storageData?.result?.username ||
    storageData?.name ||
    storageData?.result?.name ||
    "Guest User";

  const loadPageData = useCallback(async () => {
    try {
      const productRes = await fetchProductDetails(id);
      if (productRes.data) setProduct(productRes.data);

      const reviewsRes = await fetchReviews(id);
      if (reviewsRes.data) setReviews(reviewsRes.data);
    } catch (err) {
      console.error("Error loading page data:", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const handlePostReview = async () => {
    if (rating === 0 || !comment.trim()) {
      return alert("Please provide both a rating and a comment!");
    }

    setIsSubmitting(true);
    try {
      await postReview(id, {
        rating: Number(rating),
        comment: comment.trim(),
        userName: currentUserName 
      });
      
      // SUCCESS LOGIC: 
      alert("✅ Review posted successfully! Your rating will now appear on the homepage.");
      
      setRating(0);
      setComment("");
      
      /**
       * We reload the local data so the star average at the top 
       * of this page updates immediately.
       */
      await loadPageData(); 

    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to post review. Please try again.";
      alert(errorMsg);
      console.error("Submit Error:", err.response?.data || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteReview(reviewId);
        loadPageData(); 
      } catch (err) {
        alert("Error deleting review");
      }
    }
  };

  const handleAddToCart = () => {
    if (!storageData) {
      alert('Please login to add products to cart.');
      navigate('/login');
      return;
    }
    addToCart(product);
    alert('Added to cart.');
  };

  if (loading) return <div className="status-message">Loading Product Details...</div>;
  if (!product) return (
    <div className="status-message">
      <h2>Product not found!</h2>
      <p>The ID <strong>{id}</strong> does not exist in our catalog.</p>
    </div>
  );

  return (
    <div className="product-details-container">
      {/* BREADCRUMB: Adding a manual back button helps trigger 
          navigation which helps React re-mount the Home component.
      */}
      <button className="back-link" onClick={() => navigate(-1)}>
        ← Back to Products
      </button>

      <div className="product-main">
        <div className="image-gallery">
          <img src={product.image} alt={product.name} />
        </div>
        
        <div className="product-info">
          <div className="info-header">
             <span className="category-label">{product.category}</span>
             {/* Sub-category tag added for clarity */}
             <span className="subcategory-tag">{product.subCategory}</span>
          </div>
          <h1>{product.name}</h1>
          <p className="price">₹{product.price?.toLocaleString('en-IN')}</p>
          
          <div className="description-box">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="specs">
            <h3>Product Highlights:</h3>
            <ul>
              <li>Original {product.category}</li>
              <li>High Performance Hardware</li>
              <li>Icon Computers Certified</li>
            </ul>
          </div>
          
          <button className="add-to-cart-btn" onClick={handleAddToCart}>Add to Cart</button>
        </div>
      </div>

      <hr className="section-divider" />

      <section className="reviews-section">
        <div className="reviews-header">
          <div>
            <h2>Customer Reviews</h2>
            <p className="sub-text">Real feedback from the Icon community</p>
          </div>
          <div className="rating-summary">
            <span className="big-rating">
              {reviews.length > 0 
                ? (reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length).toFixed(1) 
                : "0.0"}
            </span>
            <div className="stars-row">
                {"★".repeat(Math.round(reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length || 0))}
                {"☆".repeat(5 - Math.round(reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length || 0))}
            </div>
            <span className="total-reviews">{reviews.length} Reviews</span>
          </div>
        </div>

        <div className="write-review-container">
          <h3>Write a Review</h3>
          <textarea 
            placeholder="Share your thoughts on this hardware..."
            value={comment}
            disabled={isSubmitting}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
          
          <div className="review-actions">
            <div className="rating-input">
              <span className="rating-label">Your Rating:</span>
              {[1, 2, 3, 4, 5].map(star => (
                <span 
                  key={star} 
                  onClick={() => !isSubmitting && setRating(star)} 
                  className={`star-icon ${star <= rating ? 'active' : ''}`}
                >
                  {star <= rating ? '★' : '☆'}
                </span>
              ))}
            </div>
            <button 
              className="submit-review-btn" 
              onClick={handlePostReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Posting..." : "Post Review"}
            </button>
          </div>
        </div>
        
        <div className="reviews-list">
          {reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet. Be the first to build with this!</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev._id} className="review-card">
                <div className="review-card-header">
                  <div className="user-meta">
                    <div className="user-avatar">{rev.userName?.charAt(0) || "U"}</div>
                    <div>
                      <span className="review-user">{rev.userName}</span>
                      <span className="verified-tag">✓ Verified Purchase</span>
                    </div>
                  </div>
                  <div className="review-right">
                    <div className="review-stars">
                      {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                    </div>
                    {isAdmin && (
                      <button 
                        className="admin-delete-review" 
                        onClick={() => handleDeleteReview(rev._id)}
                      >
                        Delete Review
                      </button>
                    )}
                  </div>
                </div>
                <p className="review-text">{rev.comment}</p>
                <span className="review-date">
                  {new Date(rev.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetails;
