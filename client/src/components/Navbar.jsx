import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { cartItems } = useCart() || { cartItems: [] };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve user data
  const storageData = JSON.parse(localStorage.getItem('user'));
  const userRole = storageData?.role || storageData?.result?.role;
  const isAdmin = userRole === 'admin';
  const fullUserName = storageData?.name || storageData?.result?.name || 'User';
  const firstName = fullUserName.split(' ')[0];

  // SYNC SEARCH BAR WITH URL (Optional but pro: if you refresh, the search text stays in the box)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('search') || '');
    setSelectedCategory(params.get('category') || 'all');
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigates to Home with query parameters
    // If searchTerm is empty, it still sends 'all' category to reset view
    if (!searchTerm && selectedCategory === 'all') {
      navigate('/');
    } else {
      navigate(`/?search=${encodeURIComponent(searchTerm)}&category=${selectedCategory}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Clear cart or other states if necessary here
    navigate('/login');
    window.location.reload(); 
  };

  return (
    <header className="main-header">
      <div className="top-bar">
        <div className="container">
          <span className="motto">Your one-stop destination for all your Computer needs!</span>
          <div className="top-links">
            <span>Email: contact@iconcomputers.com</span>
            <span className="separator">|</span>
            <span>Support: +91 9876543210</span>
          </div>
        </div>
      </div>

      <div className="main-nav">
        <div className="container nav-content">
          <Link to="/" className="logo-container">
            <span className="text-logo">
              ICON COMPUTERS
            </span>
          </Link>

          <form className="search-container" onSubmit={handleSearch}>
            <select 
              className="category-select" 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="LAPTOPS">Laptops</option>
              <option value="MONITORS">Monitors</option>
              <option value="PRINTERS">Printers</option>
              <option value="WIFI ROUTERS">Wifi Routers</option>
              <option value="CPU ACC.">CPU Acc.</option>
              <option value="MOUSE">Mouse</option>
              <option value="KEYBOARDS">Keyboards</option>
              <option value="CABLES">Cables</option>
            </select>
            
            <input 
              type="text" 
              placeholder="Search for hardware, brands..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <button type="submit" className="search-btn">Search</button>
          </form>

          <div className="user-actions">
            {isAdmin && (
              <>
                <Link to="/admin-dashboard" className="dashboard-link">Dashboard</Link>
                <Link to="/admin-add" className="admin-quick-add">
                   <span>+ Add</span>
                </Link>
              </>
            )}

            {storageData ? (
              <div className="profile-container">
                <div className="action-item">
                  <div className="action-icon-wrapper">
                    <span className="action-icon">👤</span>
                  </div>
                  <div className="action-text">
                    <span className="label">Hello,</span>
                    <span className="sub-label">{firstName}</span>
                  </div>
                </div>
                <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="action-item">
                <div className="action-icon-wrapper">
                  <span className="action-icon">👤</span>
                </div>
                <div className="action-text">
                  <span className="label">Login</span>
                  <span className="sub-label">Account</span>
                </div>
              </Link>
            )}

            <Link to="/cart" className="action-item">
              <div className="action-icon-wrapper">
                <span className="action-icon">🛒</span>
                {cartItems.length > 0 && (
                  <span className="cart-badge">{cartItems.length}</span>
                )}
              </div>
              <div className="action-text">
                <span className="label">Your</span>
                <span className="sub-label">Cart</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;