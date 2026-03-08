import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import '../../styles/Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateCartQuantity } = useCart();
  const navigate = useNavigate();

  const totalUnits = cartItems.reduce((acc, item) => acc + Number(item.quantity || 1), 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (Number(item.price) * Number(item.quantity || 1)),
    0
  );
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  return (
    <div className="cart-page">
      <div className="cart-items">
        <h2>Your Shopping Cart ({totalUnits})</h2>
        {cartItems.length === 0 ? (
          <div className="empty-msg">
            <div className="empty-cart-icon">Cart</div>
            <p>Your cart is empty. Start shopping!</p>
            <button className="shop-btn" onClick={() => navigate('/products')}>Browse Products</button>
          </div>
        ) : (
          cartItems.map((item, index) => (
            <div className="cart-item" key={item.cartId || index}>
              <div className="item-img-container">
                <img src={item.image || 'https://via.placeholder.com/80'} alt={item.name} className="cart-prod-img" />
              </div>
              <div className="item-details">
                <h4>{item.name}</h4>
                <p className="item-category">{item.category}</p>
                <div className="quantity-control">
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => updateCartQuantity(index, Number(item.quantity || 1) - 1)}
                    disabled={Number(item.quantity || 1) <= 1}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="qty-value">{Number(item.quantity || 1)}</span>
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => updateCartQuantity(index, Number(item.quantity || 1) + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="item-price">
                Rs {(Number(item.price) * Number(item.quantity || 1)).toLocaleString()}
                <span className="unit-price">Rs {Number(item.price).toLocaleString()} each</span>
              </p>
              <button className="remove-btn" onClick={() => removeFromCart(index)}>&times;</button>
            </div>
          ))
        )}
      </div>

      <div className="cart-summary">
        <h3>Order Summary</h3>
        <div className="summary-row"><span>Subtotal:</span> <span>Rs {subtotal.toLocaleString()}</span></div>
        <div className="summary-row"><span>GST (18%):</span> <span>Rs {gst.toLocaleString()}</span></div>
        <hr />
        <div className="summary-row total"><span>Total:</span> <span>Rs {total.toLocaleString()}</span></div>
        <button
          className="pay-btn"
          disabled={cartItems.length === 0}
          onClick={() => navigate('/checkout')}
        >
          Proceed To Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;
