import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { cancelMyOrder, fetchMyOrders, verifyCashfreeOrder } from '../../api';
import '../../styles/MyOrders.css';

const MyOrders = () => {
  const { clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const orderIdFromQuery = queryParams.get('orderId') || queryParams.get('order_id');

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [actionOrderId, setActionOrderId] = useState('');
  const [message, setMessage] = useState('');
  const hasProcessedReturnRef = useRef(false);
  const clearCartRef = useRef(clearCart);

  useEffect(() => {
    clearCartRef.current = clearCart;
  }, [clearCart]);

  const isCurrentOrder = (status) => !['Cancelled', 'Delivered', 'Failed'].includes(status);

  const { currentOrders, previousOrders } = useMemo(() => {
    const current = orders.filter((o) => isCurrentOrder(o.status));
    const previous = orders.filter((o) => !isCurrentOrder(o.status));
    return { currentOrders: current, previousOrders: previous };
  }, [orders]);

  const canCancelOrder = (status) => !['Cancelled', 'Delivered', 'Shipped', 'Failed'].includes(status);
  const trackingStages = ['Order Placed', 'Packed', 'Shipped', 'Delivered'];

  const loadOrders = async () => {
    const { data } = await fetchMyOrders();
    setOrders(data?.orders || []);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        if (orderIdFromQuery && !hasProcessedReturnRef.current) {
          hasProcessedReturnRef.current = true;
          const verify = await verifyCashfreeOrder(orderIdFromQuery);
          if (verify?.data?.paid) {
            clearCartRef.current();
            setMessage('Payment verified and your order is now in the list below.');
          }
          navigate('/my-orders', { replace: true });
        }
        await loadOrders();
      } catch (err) {
        setMessage('Some order data could not be loaded right now.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [orderIdFromQuery, navigate]);

  const handleCancelOrder = async (order) => {
    const reason = window.prompt('Optional: reason for cancellation', '') || '';
    try {
      setActionOrderId(order._id);
      await cancelMyOrder(order._id, reason);
      await loadOrders();
      setMessage('Order cancelled successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to cancel this order.');
    } finally {
      setActionOrderId('');
    }
  };

  const renderOrderCard = (order) => (
    <div className="order-card" key={order._id}>
      <div className="order-card-head">
        <div>
          <h4>Order #{order.cashfreeOrderId || order._id?.slice(-8)}</h4>
          <p>{new Date(order.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <div className={`status-pill status-${(order.status || '').toLowerCase()}`}>{order.status}</div>
      </div>

      <div className="order-grid">
        <div>
          <strong>Amount:</strong> Rs {Number(order.totalAmount || 0).toLocaleString()}
        </div>
        <div>
          <strong>Payment:</strong> {(order.paymentMethod || 'online').toUpperCase()}
        </div>
        <div>
          <strong>Payment Status:</strong> {order.paymentStatus || 'UNKNOWN'}
        </div>
        <div>
          <strong>Items:</strong> {order.items?.length || 0}
        </div>
      </div>

      <div className="order-items">
        <strong>Products:</strong>{' '}
        {(order.items || []).slice(0, 3).map((item) => item.name).join(', ') || 'No items'}
        {order.items?.length > 3 ? ` +${order.items.length - 3} more` : ''}
      </div>

      <div className="tracking-block">
        <strong>Tracking:</strong>
        <div className="tracking-steps">
          {trackingStages.map((stage) => {
            const currentIndex = trackingStages.indexOf(order.trackingStage || 'Order Placed');
            const stageIndex = trackingStages.indexOf(stage);
            const done = stageIndex <= currentIndex;
            return (
              <div className={`tracking-step ${done ? 'done' : ''}`} key={`${order._id}_${stage}`}>
                <span className="dot">{stageIndex + 1}</span>
                <span className="text">{stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      {order.address?.fullAddress && (
        <div className="order-address">
          <strong>Delivery Address:</strong> {order.address.fullAddress}, {order.address.pinCode}
        </div>
      )}

      {order.status === 'Cancelled' && order.cancellationReason && (
        <div className="cancel-note">
          <strong>Cancellation Note:</strong> {order.cancellationReason}
        </div>
      )}

      <div className="order-actions">
        {canCancelOrder(order.status) && (
          <button
            className="cancel-order-btn"
            disabled={actionOrderId === order._id}
            onClick={() => handleCancelOrder(order)}
          >
            {actionOrderId === order._id ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="my-orders-page">
        <div className="orders-shell">Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <div className="orders-shell">
        <div className="orders-header">
          <h2>My Orders</h2>
          <button className="continue-btn" onClick={() => navigate('/products')}>Continue Shopping</button>
        </div>

        {message && <p className="orders-message">{message}</p>}

        <section className="orders-section">
          <h3>Current Orders</h3>
          {currentOrders.length === 0 ? (
            <div className="empty-orders">No current orders.</div>
          ) : (
            currentOrders.map(renderOrderCard)
          )}
        </section>

        <section className="orders-section">
          <h3>Previous Orders</h3>
          {previousOrders.length === 0 ? (
            <div className="empty-orders">No previous orders yet.</div>
          ) : (
            previousOrders.map(renderOrderCard)
          )}
        </section>
      </div>
    </div>
  );
};

export default MyOrders;
