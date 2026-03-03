import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import '../../styles/MyOrders.css';

const OrderTimeline = ({ currentStage }) => {
  const stages = ['Order Placed', 'Packed', 'Shipped', 'Delivered'];
  
  // For a new order, 'Order Placed' (index 0) is the active stage
  const currentIndex = stages.indexOf(currentStage);

  return (
    <div className="timeline-container">
      <h3>Order Progress</h3>
      <div className="timeline">
        {stages.map((stage, index) => (
          <div 
            key={stage} 
            className={`step ${index <= currentIndex ? 'completed' : ''} ${index === currentIndex ? 'active' : ''}`}
          >
            <div className="circle">{index + 1}</div>
            <p>{stage}</p>
            {index < stages.length - 1 && <div className="line"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const MyOrders = () => {
  const { clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  const status = queryParams.get('status');
  const orderId = queryParams.get('orderId');
  const method = queryParams.get('method');

  useEffect(() => {
    // Automatically clear the cart when landing here after a success
    if (status === 'success' && clearCart) {
      clearCart();
    }
  }, [status, clearCart]);

  return (
    <div className="my-orders-page">
      {status === 'success' ? (
        <div className="order-success-container">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h2>Order Placed Successfully!</h2>
            <p className="order-number">Order ID: <strong>#{orderId}</strong></p>
            
            {/* --- Receipt Style Info Box --- */}
            <div className="receipt-details">
                <div className="receipt-row">
                    <span>Date:</span>
                    <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="receipt-row">
                    <span>Payment Method:</span>
                    <span className="method-badge">{method?.toUpperCase() || 'UPI'}</span>
                </div>
                <div className="receipt-row total-row">
                    <span>Payment Status:</span>
                    <span className="status-text">
                        {method === 'upi' ? 'Pending Verification' : 'Confirmed'}
                    </span>
                </div>
            </div>

            {method === 'upi' && (
              <div className="verification-banner">
                <p>📷 Screenshot uploaded. Our team is verifying the transaction. Your items will be packed shortly!</p>
              </div>
            )}

            <OrderTimeline currentStage="Order Placed" />

            <button className="continue-btn" onClick={() => navigate('/')}>
              Continue Shopping
            </button>
          </div>
        </div>
      ) : (
        <div className="no-orders">
          <div className="no-orders-content">
            <h2>Your Orders</h2>
            <div className="empty-orders-msg">
                <div className="empty-icon">📦</div>
                <p>You haven't placed any orders yet.</p>
                <button className="browse-btn" onClick={() => navigate('/')}>
                    Browse Latest Tech
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;