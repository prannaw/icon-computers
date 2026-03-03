import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Admin.css';

const AdminSidebar = () => {
  return (
    <div className="admin-sidebar">
      <h3>Admin Panel</h3>
      <ul>
        <li><Link to="/admin">📊 Dashboard</Link></li>
        <li><Link to="/admin/products">📦 Products</Link></li>
        <li><Link to="/admin/orders">🧾 Orders</Link></li>
        <li><Link to="/admin/users">👥 Users</Link></li>
        <li><Link to="/admin/reviews">💬 Reviews</Link></li>
      </ul>
    </div>
  );
};
export default AdminSidebar;