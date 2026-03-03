import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { placeOrder } from '../../api'; // Import the API function
import '../../styles/Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  // --- States for Payment Flow ---
  const [paymentMethod, setPaymentMethod] = useState('upi'); 
  const [showGateway, setShowGateway] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [timeLeft, setTimeLeft] = useState(120); 
  const [address, setAddress] = useState({ fullAddress: '', pinCode: '' });
  
  // Card Details State
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });

  // Calculate Prices
  const subtotal = cartItems.reduce((acc, item) => acc + Number(item.price), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  // Get User ID from LocalStorage for the order record
  const userData = JSON.parse(localStorage.getItem('user'));
  const userId = userData?.result?._id || userData?._id;

  // --- Timer Logic for UPI QR ---
  useEffect(() => {
    let timer;
    if (showGateway && paymentMethod === 'upi' && timeLeft > 0 && !isVerifying) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [showGateway, timeLeft, isVerifying, paymentMethod]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenGateway = () => {
    if (!address.fullAddress || !address.pinCode) {
      alert("Please fill in your delivery details first!");
      return;
    }
    setTimeLeft(120);
    setShowGateway(true);
  };

  const handleProcessOrder = async () => {
    // 1. Validation for UPI
    if (paymentMethod === 'upi' && !screenshot) {
      alert("Please upload the payment screenshot for verification!");
      return;
    }

    // 2. Validation for Card
    if (paymentMethod === 'card') {
      if (!cardData.number || !cardData.expiry || !cardData.cvv) {
        alert("Please enter all card details!");
        return;
      }
    }

    setIsVerifying(true);

    try {
      // --- BACKEND INTEGRATION ---
      // This sends the data to your productRoutes.js 'order' endpoint
      await placeOrder({
        userId: userId || "GUEST",
        items: cartItems,
        totalAmount: total,
        paymentMethod: paymentMethod,
        address: address
      });

      // --- Success Flow ---
      setTimeout(() => {
        setIsVerifying(false);
        const orderId = "ICON" + Math.floor(Math.random() * 1000000);
        
        // Clear the cart globally (Context + LocalStorage)
        clearCart();
        
        // Redirect to MyOrders (Success State)
        navigate(`/my-orders?status=success&orderId=${orderId}&method=${paymentMethod}`);
      }, 4000); 

    } catch (error) {
      console.error("Order failed:", error);
      alert("Something went wrong while processing your order. Please try again.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="cart-page">
      {/* --- PAYMENT GATEWAY MODAL --- */}
      {showGateway && (
        <div className="payment-overlay">
          <div className="qr-container">
            {!isVerifying ? (
              <>
                {paymentMethod === 'upi' ? (
                  <>
                    <div className="timer-badge">
                      Session expires in: <span className={timeLeft < 30 ? "timer-red" : ""}>{formatTime(timeLeft)}</span>
                    </div>
                    {timeLeft > 0 ? (
                      <>
                        <h3>Scan to Pay via PhonePe</h3>
                        <p className="pay-amount-text">Amount to Pay: <strong>₹{total.toLocaleString()}</strong></p>
                        <img src="/phonepe-qr.png" alt="UPI QR Code" className="qr-img" />                        
                        <div className="upload-section">
                          <label>Upload Payment Screenshot:</label>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setScreenshot(e.target.files[0])} 
                            className="file-input"
                          />
                        </div>
                        <button className="complete-btn" onClick={handleProcessOrder}>Verify & Complete Order</button>
                      </>
                    ) : (
                      <div className="expired-state">
                        <div className="expired-icon">⚠️</div>
                        <h3>Session Expired</h3>
                        <button className="retry-btn" onClick={() => { setShowGateway(false); setTimeLeft(120); }}>Restart Checkout</button>
                      </div>
                    )}
                  </>
                ) : paymentMethod === 'card' ? (
                  <div className="card-payment-box">
                    <h3>Secure Card Payment</h3>
                    <div className="card-form">
                      <input 
                        type="text" 
                        placeholder="16-Digit Card Number" 
                        maxLength="16" 
                        className="cart-input"
                        onChange={(e) => setCardData({...cardData, number: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="Cardholder Name" 
                        className="cart-input"
                        onChange={(e) => setCardData({...cardData, name: e.target.value})}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          maxLength="5" 
                          className="cart-input"
                          onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                        />
                        <input 
                          type="password" 
                          placeholder="CVV" 
                          maxLength="3" 
                          className="cart-input"
                          onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                        />
                      </div>
                    </div>
                    <p style={{ marginTop: '15px' }}>Total: <strong>₹{total.toLocaleString()}</strong></p>
                    <button className="complete-btn" onClick={handleProcessOrder}>Pay & Confirm Order</button>
                  </div>
                ) : (
                  <div className="non-upi-payment">
                    <h3>Confirm COD Order</h3>
                    <div className="confirm-icon">🚚</div>
                    <p>Total Order Value: <strong>₹{total.toLocaleString()}</strong></p>
                    <button className="complete-btn" onClick={handleProcessOrder}>Place Order Now</button>
                  </div>
                )}
                <button className="cancel-link" onClick={() => setShowGateway(false)}>Cancel Payment</button>
              </>
            ) : (
              <div className="verification-loading">
                <div className="spinner"></div>
                <h3>{paymentMethod === 'upi' ? 'Authenticating Receipt...' : 'Processing Transaction...'}</h3>
                <p>Establishing secure connection. Do not refresh.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- LEFT SIDE: CART ITEMS --- */}
      <div className="cart-items">
        <h2>Your Shopping Cart ({cartItems.length})</h2>
        {cartItems.length === 0 ? (
          <div className="empty-msg">
            <div className="empty-cart-icon">🛒</div>
            <p>Your cart is empty. Start shopping!</p>
            <button className="shop-btn" onClick={() => navigate('/')}>Browse Products</button>
          </div>
        ) : (
          cartItems.map((item, index) => (
            <div className="cart-item" key={index}>
              <div className="item-img-container">
                <img src={item.image || "https://via.placeholder.com/80"} alt={item.name} className="cart-prod-img" />
              </div>
              <div className="item-details">
                <h4>{item.name}</h4>
                <p className="item-category">{item.category}</p>
              </div>
              <p className="item-price">₹{item.price.toLocaleString()}</p>
              <button className="remove-btn" onClick={() => removeFromCart(index)}>&times;</button>
            </div>
          ))
        )}
      </div>

      {/* --- RIGHT SIDE: SUMMARY --- */}
      <div className="cart-summary">
        <h3>Order Summary</h3>
        <div className="summary-row"><span>Subtotal:</span> <span>₹{subtotal.toLocaleString()}</span></div>
        <div className="summary-row"><span>GST (18%):</span> <span>₹{gst.toLocaleString()}</span></div>
        <hr />
        <div className="summary-row total"><span>Total:</span> <span>₹{total.toLocaleString()}</span></div>
        
        <div className="address-section">
          <h4>Delivery Address</h4>
          <input 
            type="text" 
            placeholder="Full Address (House, Street, Area)" 
            className="cart-input" 
            value={address.fullAddress}
            onChange={(e) => setAddress({...address, fullAddress: e.target.value})}
            required 
          />
          <input 
            type="text" 
            placeholder="PIN Code" 
            className="cart-input" 
            value={address.pinCode}
            onChange={(e) => setAddress({...address, pinCode: e.target.value})}
            required 
          />
        </div>

        <div className="payment-selection-box">
          <h4>Select Payment Method</h4>
          <div className="method-options">
            <label className={`method-item ${paymentMethod === 'upi' ? 'active' : ''}`}>
              <input type="radio" name="payMethod" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>UPI / QR Code</span>
            </label>
            <label className={`method-item ${paymentMethod === 'card' ? 'active' : ''}`}>
              <input type="radio" name="payMethod" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>Debit / Credit Card</span>
            </label>
            <label className={`method-item ${paymentMethod === 'cod' ? 'active' : ''}`}>
              <input type="radio" name="payMethod" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>Cash on Delivery</span>
            </label>
          </div>
        </div>

        <button 
          className="pay-btn" 
          disabled={cartItems.length === 0}
          onClick={handleOpenGateway}
        >
          {paymentMethod === 'upi' ? 'Proceed to QR Code' : `Place ${paymentMethod.toUpperCase()} Order`}
        </button>
      </div>
    </div>
  );
};

export default Cart;