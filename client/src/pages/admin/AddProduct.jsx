import React, { useState } from 'react';
import API from '../../api'; 
import '../../styles/AddProduct.css';

const AddProduct = () => {
  const categoryMap = {
    "LAPTOPS": ["Personal Laptops", "Business Laptops", "Gaming Laptops"],
    "MONITORS": ["LED Monitors", "OLED Monitors", "LCD Monitors"],
    "PRINTERS": ["Inkjet Printers", "Laser Printers"],
    "WIFI ROUTERS": ["Wireless Routers", "Wired Routers"],
    "CPU ACC.": ["Hard Drives", "Power Supplies", "RAMs", "Processors", "GPUs", "Motherboards"],
    "MOUSE": ["Ergonomical Mouse", "Gaming Mouse"],
    "KEYBOARDS": ["Mechanical Keyboards", "Membrane Keyboards"],
    "CABLES": ["USB Cables", "HDMI Cables", "VGA Cables", "DisplayPort Cables"]
  };

  const initialFormState = {
    name: '',
    price: '',
    description: '',
    category: 'LAPTOPS',
    subCategory: 'Personal Laptops',
    image: '',
    stock: 5
  };

  const [product, setProduct] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      setProduct({ 
        ...product, 
        category: value, 
        subCategory: categoryMap[value][0] 
      });
    } else {
      setProduct({ ...product, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/products', product);
      alert("🚀 Product added successfully!");
      setProduct(initialFormState);
    } catch (err) {
      console.error("Submission Error:", err);
      const serverMessage = err.response?.data?.message || "Check if backend is running.";
      alert(`❌ Error: ${serverMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <div className="admin-card">
        <h2>Add New Inventory</h2>
        <p className="subtitle">Syncing with your Homepage categories.</p>
        
        {/* Added autoComplete="off" here to stop browser recommendations */}
        <form onSubmit={handleSubmit} className="styled-form" autoComplete="off">
          
          <div className="form-group">
            <label>Product Name</label>
            <input 
              name="name" 
              value={product.name} 
              onChange={handleChange} 
              autoComplete="off"
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (₹)</label>
              <input 
                name="price" 
                type="number" 
                value={product.price} 
                onChange={handleChange} 
                autoComplete="off"
                required 
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity</label>
              <input 
                name="stock" 
                type="number" 
                value={product.stock} 
                onChange={handleChange} 
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Main Category</label>
              <select name="category" value={product.category} onChange={handleChange}>
                {Object.keys(categoryMap).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Sub-Category (Filter Tag)</label>
              <select name="subCategory" value={product.subCategory} onChange={handleChange} required>
                {categoryMap[product.category].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input 
              name="image" 
              value={product.image} 
              onChange={handleChange} 
              placeholder="Paste image link here" 
              autoComplete="off"
              required 
            />
          </div>

          <div className="form-group">
            <label>Specifications</label>
            <textarea 
              name="description" 
              value={product.description} 
              rows="3" 
              onChange={handleChange} 
              placeholder="RAM, SSD, Processor..." 
              autoComplete="off"
            />
          </div>

          <button type="submit" className="admin-submit-btn" disabled={loading}>
            {loading ? "Processing..." : "Save to Database"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;