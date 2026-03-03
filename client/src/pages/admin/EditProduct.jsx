import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api';
import '../../styles/AddProduct.css'; 

const EditProduct = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    subCategory: '',
    image: '',
    stock: ''
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Force window to top when the edit page opens
    window.scrollTo(0, 0);

    const getProductDetails = async () => {
      try {
        const res = await API.get(`/products/${id}`);
        setFormData({
          name: res.data.name || '',
          price: res.data.price || '',
          description: res.data.description || '',
          category: res.data.category || '',
          subCategory: res.data.subCategory || '',
          image: res.data.image || '',
          stock: res.data.stock || ''
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        alert("Could not fetch product details.");
        navigate('/admin-manage');
      }
    };

    getProductDetails();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await API.put(`/products/${id}`, formData);
      alert("🚀 Product updated successfully!");
      navigate('/admin-manage'); 
    } catch (err) {
      console.error("Update failed:", err);
      alert("❌ Failed to update product.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-form-container">
        <div className="admin-card">
          <p className="loading-text">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-form-container">
      <div className="admin-card">
        <h2>Modify Product</h2>
        <p className="subtitle">Update the product information below</p>
        
        {/* Added autoComplete="off" to disable browser suggestions */}
        <form onSubmit={handleSubmit} className="styled-form" autoComplete="off">
          <div className="form-group">
            <label>Product Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name} 
              onChange={handleChange} 
              autoComplete="off"
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input 
                type="text" 
                name="category" 
                placeholder="e.g. LAPTOPS"
                value={formData.category} 
                onChange={handleChange} 
                autoComplete="off"
                required 
              />
            </div>
            <div className="form-group">
              <label>Sub-Category</label>
              <input 
                type="text" 
                name="subCategory" 
                placeholder="e.g. Gaming"
                value={formData.subCategory} 
                onChange={handleChange} 
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (₹)</label>
              <input 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                autoComplete="off"
                required 
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity</label>
              <input 
                type="number" 
                name="stock" 
                value={formData.stock} 
                onChange={handleChange} 
                autoComplete="off"
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input 
              type="text" 
              name="image" 
              placeholder="https://example.com/image.jpg"
              value={formData.image} 
              onChange={handleChange} 
              autoComplete="off"
              required 
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              rows="5"
              placeholder="Enter detailed product specifications..."
              value={formData.description} 
              onChange={handleChange}
              autoComplete="off"
            ></textarea>
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: '15px' }}>
            <button 
              type="submit" 
              className="admin-submit-btn" 
              disabled={updating}
            >
              {updating ? "Saving Changes..." : "Update Product"}
            </button>
            <button 
              type="button" 
              className="admin-cancel-btn" 
              style={{ 
                backgroundColor: '#e2e8f0', 
                color: '#4a5568', 
                border: 'none', 
                padding: '12px 25px', 
                borderRadius: '8px', 
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/admin-manage')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;