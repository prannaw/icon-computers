import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { createCashfreeOrder, placeOrder } from '../../api';
import '../../styles/Cart.css';

const loadCashfreeScript = () => new Promise((resolve, reject) => {
  if (window.Cashfree) {
    resolve(window.Cashfree);
    return;
  }

  const existingScript = document.querySelector('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]');
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(window.Cashfree));
    existingScript.addEventListener('error', () => reject(new Error('Failed to load Cashfree SDK.')));
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
  script.async = true;
  script.onload = () => resolve(window.Cashfree);
  script.onerror = () => reject(new Error('Failed to load Cashfree SDK.'));
  document.body.appendChild(script);
});

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user')) || {};
  const userId = userData?.id || userData?._id || userData?.result?._id;

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [address, setAddress] = useState({
    fullAddress: userData?.address?.fullAddress || '',
    pinCode: userData?.address?.pinCode || '',
    phone: userData?.phone || ''
  });

  const subtotal = cartItems.reduce((acc, item) => acc + Number(item.price), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems.length, navigate]);

  const validateCheckout = () => {
    if (!address.fullAddress || !address.pinCode || !address.phone) {
      alert('Please fill full address, pin code, and phone number.');
      return false;
    }
    if (!/^\d{6}$/.test(String(address.pinCode).trim())) {
      alert('Please enter a valid 6-digit PIN code.');
      return false;
    }
    if (!/^\d{10}$/.test(String(address.phone).trim())) {
      alert('Please enter a valid 10-digit phone number.');
      return false;
    }
    return true;
  };

  const handleCodOrder = async () => {
    const customerPayload = {
      name: userData?.username || 'Icon Customer',
      email: userData?.email || 'customer@iconcomputers.local',
      phone: address.phone
    };

    await placeOrder({
      userId: userId || 'GUEST',
      items: cartItems,
      totalAmount: total,
      paymentMethod: 'cod',
      address,
      customer: customerPayload
    });

    clearCart();
    navigate('/my-orders?status=success&method=cod');
  };

  const handleCashfreeCheckout = async () => {
    const customerPayload = {
      name: userData?.username || 'Icon Customer',
      email: userData?.email || 'customer@iconcomputers.local',
      phone: address.phone
    };

    const { data } = await createCashfreeOrder({
      userId: userId || 'GUEST',
      items: cartItems,
      totalAmount: total,
      paymentMethod,
      address,
      customer: customerPayload
    });

    const Cashfree = await loadCashfreeScript();
    const cashfree = Cashfree({
      mode: data.cashfreeEnv === 'production' ? 'production' : 'sandbox'
    });

    await cashfree.checkout({
      paymentSessionId: data.paymentSessionId,
      redirectTarget: '_self'
    });

    navigate(`/my-orders?order_id=${encodeURIComponent(data.orderId)}&method=${encodeURIComponent(paymentMethod)}`);
  };

  const handleCheckout = async () => {
    if (!validateCheckout()) return;

    setIsProcessing(true);
    try {
      if (paymentMethod === 'cod') {
        await handleCodOrder();
      } else {
        await handleCashfreeCheckout();
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert(error?.response?.data?.message || 'Unable to process checkout right now.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <div className="checkout-header">
          <div>
            <h2 style={{ margin: 0 }}>Checkout Details</h2>
            <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '14px' }}>
              Fill delivery details and complete your payment securely.
            </p>
          </div>
          <button className="shop-btn" onClick={() => navigate('/cart')}>Back to Cart</button>
        </div>

        <div className="cart-summary" style={{ position: 'static', boxShadow: 'none', border: 'none', padding: 0, background: 'transparent' }}>
        <h3>Order & Payment</h3>
        <div className="summary-row"><span>Items:</span> <span>{cartItems.length}</span></div>
        <div className="summary-row"><span>Subtotal:</span> <span>Rs {subtotal.toLocaleString()}</span></div>
        <div className="summary-row"><span>GST (18%):</span> <span>Rs {gst.toLocaleString()}</span></div>
        <hr />
        <div className="summary-row total"><span>Total:</span> <span>Rs {total.toLocaleString()}</span></div>

        <div className="address-section">
          <h4>Delivery Address</h4>
          <input
            type="text"
            placeholder="Full Address (House, Street, Area)"
            className="cart-input"
            value={address.fullAddress}
            onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="PIN Code"
            className="cart-input"
            value={address.pinCode}
            onChange={(e) => setAddress({ ...address, pinCode: e.target.value })}
            required
          />
          <input
            type="tel"
            placeholder="Phone Number"
            className="cart-input"
            value={address.phone}
            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
            required
          />
        </div>

        <div className="payment-selection-box">
          <h4>Select Payment Method</h4>
          <div className="method-options">
            <label className={`method-item ${paymentMethod === 'upi' ? 'active' : ''}`}>
              <input type="radio" name="payMethod" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>UPI (Cashfree)</span>
            </label>
            <label className={`method-item ${paymentMethod === 'card' ? 'active' : ''}`}>
              <input type="radio" name="payMethod" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>Card (Cashfree)</span>
            </label>
            <label className={`method-item ${paymentMethod === 'cod' ? 'active' : ''}`}>
              <input type="radio" name="payMethod" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>Cash on Delivery</span>
            </label>
          </div>
        </div>

        <button
          className="pay-btn"
          disabled={cartItems.length === 0 || isProcessing}
          onClick={handleCheckout}
        >
          {isProcessing ? 'Processing...' : paymentMethod === 'cod' ? 'Place COD Order' : 'Pay Securely with Cashfree'}
        </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
