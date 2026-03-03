import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/user/Home.jsx';
import Navbar from './components/Navbar.jsx';
import Signup from './pages/auth/Signup.jsx';
import Login from './pages/auth/Login.jsx';
import OTPVerify from './pages/auth/OTP.jsx';
import Cart from './pages/user/Cart.jsx';
import Checkout from './pages/user/Checkout.jsx';
import ProductDetails from './pages/user/ProductDetails.jsx';
import MyOrders from './pages/user/MyOrders.jsx';
import Profile from './pages/user/Profile.jsx';
import AddProduct from './pages/admin/AddProduct.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import ManageProducts from './pages/admin/ManageProducts.jsx';
import EditProduct from './pages/admin/EditProduct.jsx';
import ManageOrders from './pages/admin/ManageOrders.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';
import UpiVerifications from './pages/admin/UpiVerifications.jsx';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';
  const isLoggedIn = Boolean(user);

  return (
    <Router>
      <Navbar />
      <div className="app-body">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp" element={<OTPVerify />} />
          <Route path="/cart" element={isLoggedIn ? <Cart /> : <Navigate to="/login" replace />} />
          <Route path="/checkout" element={isLoggedIn ? <Checkout /> : <Navigate to="/login" replace />} />
          <Route path="/my-orders" element={isLoggedIn ? <MyOrders /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/product/:id" element={<ProductDetails />} />

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
          <Route
            path="/admin-orders"
            element={isAdmin ? <ManageOrders /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin-users"
            element={isAdmin ? <ManageUsers /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin-verifications"
            element={isAdmin ? <UpiVerifications /> : <Navigate to="/login" replace />}
          />
          <Route 
            path="/admin/edit-product/:id" 
            element={isAdmin ? <EditProduct /> : <Navigate to="/login" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
