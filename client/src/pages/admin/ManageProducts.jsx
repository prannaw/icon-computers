import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import '../../styles/Admin.css';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      // Fetching from your updated aggregate route
      const res = await API.get('/products');
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchProducts(); 
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this product?")) {
      try {
        await API.delete(`/products/${id}`);
        setProducts(products.filter(p => p._id !== id));
      } catch (err) {
        alert("Delete failed. Check your network or backend route.");
      }
    }
  };

  return (
    <div className="admin-main">
      <div className="admin-header-row">
        <h2>Inventory Management</h2>
        <span className="count-badge">{products.length} Items</span>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" className="loading-text">Loading Inventory...</td></tr>
          ) : products.length === 0 ? (
            <tr><td colSpan="5">No products found. Add some to get started!</td></tr>
          ) : (
            products.map(p => (
              <tr key={p._id}>
                <td>
                  <div className="table-img-container">
                    <img src={p.image} alt={p.name} />
                  </div>
                </td>
                <td className="product-name-cell">{p.name}</td>
                <td>
                  <span className="cat-tag">{p.category}</span>
                  {p.subCategory && <div className="sub-cat-text">{p.subCategory}</div>}
                </td>
                <td className="price-cell">₹{p.price?.toLocaleString('en-IN')}</td>
                <td className="actions-cell">
                  {/* MODIFY BUTTON */}
                  <button 
                    className="modify-btn" 
                    onClick={() => navigate(`/admin/edit-product/${p._id}`)}
                  >
                    Modify
                  </button>
                  
                  {/* DELETE BUTTON */}
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(p._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ManageProducts;