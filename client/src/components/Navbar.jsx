import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { cartItems } = useCart() || { cartItems: [] };
  const cartCount = cartItems.reduce((acc, item) => acc + Number(item.quantity || 1), 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userData, setUserData] = useState(() => JSON.parse(localStorage.getItem('user')));

  const navigate = useNavigate();
  const location = useLocation();

  const userRole = userData?.role || userData?.result?.role;
  const isAdmin = userRole === 'admin';
  const fullUserName =
    userData?.username ||
    userData?.result?.username ||
    userData?.name ||
    userData?.result?.name ||
    'User';
  const firstName = fullUserName.split(' ')[0];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('search') || '');
    setSelectedCategory(params.get('category') || 'all');
  }, [location.search]);

  useEffect(() => {
    const refreshUser = () => {
      setUserData(JSON.parse(localStorage.getItem('user')));
    };
    window.addEventListener('storage', refreshUser);
    window.addEventListener('user-updated', refreshUser);
    return () => {
      window.removeEventListener('storage', refreshUser);
      window.removeEventListener('user-updated', refreshUser);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm && selectedCategory === 'all') {
      navigate('/products');
    } else {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}&category=${selectedCategory}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
        <div className={`container nav-content ${!userData ? 'nav-content-guest' : ''}`}>
          <Link to="/" className="logo-container">
            <span className="text-logo">ICON COMPUTERS</span>
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

          <div className={`user-actions ${!userData ? 'user-actions-guest' : ''}`}>
            {isAdmin && (
              <Link to="/admin-dashboard" className="dashboard-link">Dashboard</Link>
            )}

            {userData ? (
              <div className="profile-container">
                <Link to="/profile" className="action-item">
                  <div className="action-icon-wrapper">
                    <span className="action-icon">U</span>
                  </div>
                  <div className="action-text">
                    <span className="label">Hello,</span>
                    <span className="sub-label">{firstName}</span>
                  </div>
                </Link>
                <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="action-item">
                <div className="action-icon-wrapper">
                  <span className="action-icon">U</span>
                </div>
                <div className="action-text">
                  <span className="label">Login</span>
                  <span className="sub-label">Account</span>
                </div>
              </Link>
            )}

            <Link to="/cart" className="action-item cart-action-item">
              <div className="action-icon-wrapper">
                <span className="action-icon cart-icon" aria-hidden="true">🛒</span>
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </div>
              <div className="action-text cart-text">
                <span className="label">Your</span>
                <span className="sub-label">Cart</span>
              </div>
            </Link>

            {userData && (
              <Link to="/my-orders" className="orders-link">My Orders</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
