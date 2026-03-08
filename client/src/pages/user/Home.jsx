import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Home.css';

const offerCards = [
  { title: 'Mega Build Week', note: 'Up to 35% OFF', detail: 'Laptops, Monitors and Accessories' },
  { title: 'Gaming Combo', note: 'Save Rs 2,000', detail: 'Keyboard + Mouse + Mousepad bundle' },
  { title: 'Free Express Dispatch', note: 'On prepaid orders', detail: 'Fast shipping on selected products' }
];

const Home = () => {
  const navigate = useNavigate();

  const goToProducts = (category = '') => {
    if (!category || category === 'All') {
      navigate('/products');
      return;
    }
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="home-container">
      <section className="hero-shell">
        <div className="hero-main">
          <p className="hero-kicker">Icon Computers</p>
          <h1>Build Your Setup With Trusted Hardware Deals</h1>
          <p className="hero-copy">
            Explore laptops, monitors, peripherals and components curated for students, creators and professionals.
            Better pricing, genuine products, and support you can count on.
          </p>
          <div className="hero-actions">
            <button className="hero-btn primary" onClick={() => goToProducts('All')}>Shop All Products</button>
            <button className="hero-btn secondary" onClick={() => goToProducts('LAPTOPS')}>View Laptop Offers</button>
          </div>
        </div>
        <div className="hero-offers">
          {offerCards.map((offer) => (
            <article key={offer.title} className="offer-card">
              <p className="offer-title">{offer.title}</p>
              <h3>{offer.note}</h3>
              <p>{offer.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-strip">
        <div><strong>100%</strong><span>Genuine Products</span></div>
        <div><strong>Secure</strong><span>Cashfree Payments</span></div>
        <div><strong>Quick</strong><span>Order Tracking & Support</span></div>
      </section>
    </div>
  );
};

export default Home;
