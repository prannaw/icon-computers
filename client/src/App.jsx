import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/user/Home.jsx';
import Navbar from './components/Navbar.jsx';
import Signup from './pages/auth/Signup.jsx';
import Login from './pages/auth/Login.jsx';
import OTPVerify from './pages/auth/OTP.jsx';
import Cart from './pages/user/Cart.jsx';
import ProductDetails from './pages/user/ProductDetails.jsx'; 

// Admin Pages
import AddProduct from './pages/admin/AddProduct.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import ManageProducts from './pages/admin/ManageProducts.jsx';
import EditProduct from './pages/admin/EditProduct.jsx';

function App() {
  // 1. Get the user data from localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  // 2. Simplified Role Check Logic
  // Matches the 'user' object structure we set in OTP.jsx and Login routes
  const isAdmin = user?.role === 'admin';

  return (
    <Router>
      <Navbar />
      {/* Ensure app-body has padding-top in your CSS so it's not hidden under the Navbar */}
      <div className="app-body">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          
          {/* OTP Verification Route */}
          <Route path="/otp" element={<OTPVerify />} />
          
          <Route path="/cart" element={<Cart />} />
          
          {/* Dynamic Route for Product Details */}
          <Route path="/product/:id" element={<ProductDetails />} />

          {/* Admin Protected Routes */}
          <Route 
            path="/admin-add" 
            element={isAdmin ? <AddProduct /> : <Navigate to="/login" replace />} 
          />
          
          <Route 
            path="/admin-dashboard" 
            element={isAdmin ? <Dashboard /> : <Navigate to="/login" replace />} 
          />

          <Route 
            path="/admin-manage" 
            element={isAdmin ? <ManageProducts /> : <Navigate to="/login" replace />} 
          />

          {/* Dynamic Route for Modifying Products */}
          <Route 
            path="/admin/edit-product/:id" 
            element={isAdmin ? <EditProduct /> : <Navigate to="/login" replace />} 
          />

          {/* Catch-all: Redirect unknown routes to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;