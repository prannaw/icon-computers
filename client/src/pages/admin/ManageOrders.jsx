import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminOrders, updateAdminOrderTracking } from '../../api';
import '../../styles/Admin.css';

const trackingStages = ['Order Placed', 'Packed', 'Shipped', 'Delivered'];

const ManageOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [activeUpdateId, setActiveUpdateId] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data } = await fetchAdminOrders();
      setOrders(data?.orders || []);
    } catch (err) {
      console.error('Admin Orders Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleTrackingChange = async (orderId, trackingStage) => {
    try {
      setActiveUpdateId(orderId);
      await updateAdminOrderTracking(orderId, trackingStage);
      setOrders((prev) => prev.map((o) => (
        o._id === orderId
          ? {
              ...o,
              trackingStage,
              status:
                trackingStage === 'Delivered'
                  ? 'Delivered'
                  : trackingStage === 'Shipped'
                    ? 'Shipped'
                    : trackingStage === 'Packed'
                      ? 'Packed'
                      : 'Success'
            }
          : o
      )));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update tracking.');
    } finally {
      setActiveUpdateId('');
    }
  };

  return (
    <div className="admin-main">
      <div className="admin-header-row">
        <div>
          <h2>Order Tracking Control</h2>
          <p className="admin-subtitle">Manage Packed, Shipped, Delivered status for all customer orders</p>
        </div>
        <div className="admin-actions">
          <Link to="/admin-dashboard" className="admin-btn-secondary">Back to Dashboard</Link>
        </div>
      </div>

      {loading ? (
        <div className="chart-placeholder"><span>Loading orders...</span></div>
      ) : orders.length === 0 ? (
        <div className="chart-placeholder"><span>No orders yet.</span></div>
      ) : (
        <div className="orders-control-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Tracking</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.displayOrderId || order.cashfreeOrderId || `ICON_LOCAL_${String(order._id).slice(-8).toUpperCase()}`}</td>
                  <td>{order.userDisplayName || order.customer?.name || 'Guest'}</td>
                  <td>Rs {Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                  <td>{(order.paymentMethod || 'online').toUpperCase()}</td>
                  <td>{order.status}</td>
                  <td>
                    <select
                      className="tracking-select"
                      value={order.trackingStage || 'Order Placed'}
                      disabled={order.status === 'Cancelled' || activeUpdateId === order._id}
                      onChange={(e) => handleTrackingChange(order._id, e.target.value)}
                    >
                      {trackingStages.map((stage) => (
                        <option value={stage} key={stage}>{stage}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
