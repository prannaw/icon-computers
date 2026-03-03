import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminVerifications, updateAdminOrderTracking } from '../../api';
import '../../styles/Admin.css';

const UpiVerifications = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [activeUpdateId, setActiveUpdateId] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await fetchAdminVerifications();
        setOrders(data?.verifications || []);
      } catch (err) {
        console.error('UPI verification fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const markPacked = async (orderId) => {
    try {
      setActiveUpdateId(orderId);
      await updateAdminOrderTracking(orderId, 'Packed');
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to update order.');
    } finally {
      setActiveUpdateId('');
    }
  };

  return (
    <div className="admin-main">
      <div className="admin-header-row">
        <div>
          <h2>UPI Verification Requests</h2>
          <p className="admin-subtitle">Review pending UPI orders and move them to Packed</p>
        </div>
        <div className="admin-actions">
          <Link to="/admin-dashboard" className="admin-btn-secondary">Back to Dashboard</Link>
        </div>
      </div>

      {loading ? (
        <div className="chart-placeholder"><span>Loading verification requests...</span></div>
      ) : orders.length === 0 ? (
        <div className="chart-placeholder"><span>No pending UPI verification requests.</span></div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Payment Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order.cashfreeOrderId || String(order._id).slice(-8)}</td>
                <td>{order.customer?.name || order.userDisplayName || 'Guest'}</td>
                <td>Rs {Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                <td>{order.paymentStatus || 'UNKNOWN'}</td>
                <td>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <button
                    className="modify-btn"
                    disabled={activeUpdateId === order._id}
                    onClick={() => markPacked(order._id)}
                  >
                    {activeUpdateId === order._id ? 'Updating...' : 'Mark Packed'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UpiVerifications;
