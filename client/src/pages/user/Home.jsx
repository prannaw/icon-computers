import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Home.css';

const offerCards = [
  { title: 'Mega Build Week', note: 'Up to 35% OFF', detail: 'Laptops, monitors, and office setups' },
  { title: 'Gaming Combo', note: 'Save Rs 2,000', detail: 'Keyboard + mouse + pad bundle pricing' },
  { title: 'Creator Desk Deals', note: 'Flat 15% OFF', detail: 'Monitors, webcams, and audio gear' }
];

const highlights = [
  { label: '100% Genuine', value: 'Products' },
  { label: 'Secure', value: 'Cashfree Payments' },
  { label: 'Fast', value: 'Order Tracking' },
  { label: 'Real', value: 'Post-Sale Support' }
];

const whyChooseUs = [
  {
    title: 'Carefully Curated Catalog',
    body: 'Only practical computer accessories and hardware from trusted brands. No clutter, only useful options.'
  },
  {
    title: 'Student to Pro Ready',
    body: 'From entry-level study setups to creator and office builds, products are organized for real buying needs.'
  },
  {
    title: 'Transparent Pricing',
    body: 'Clear pricing with real offers, easy checkout, and order status visibility from placement to delivery.'
  }
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
          <h1>Technology That Fits Your Everyday Build</h1>
          <p className="hero-copy">
            A practical computer accessories store for students, professionals, gamers, and creators.
            Discover reliable products, active offers, and a smooth buying experience.
          </p>
          <div className="hero-actions">
            <button className="hero-btn primary" onClick={() => goToProducts('All')}>Browse Products</button>
          </div>
          <div className="hero-image-placeholder">Background Image Placeholder</div>
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

      <section className="highlight-strip">
        {highlights.map((item) => (
          <div key={item.label} className="highlight-item">
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </div>
        ))}
      </section>

      <section className="about-grid">
        <article className="about-card about-main">
          <p className="section-kicker">About Icon Computers</p>
          <h2>A focused hardware store with a modern buying flow</h2>
          <p>
            Icon Computers is built to help customers quickly find computer products that make sense for their use case.
            From browsing to payment and order tracking, every step is designed to be simple and dependable.
          </p>
          <button className="ghost-link" onClick={() => goToProducts('All')}>Explore Catalog</button>
        </article>

        <article className="about-card">
          <p className="section-kicker">What You Get</p>
          <ul className="value-list">
            <li>Prepaid and COD checkout options</li>
            <li>Dedicated orders page with live status</li>
            <li>Profile management and secure login</li>
            <li>Review-based product confidence</li>
          </ul>
        </article>
      </section>

      <section className="why-section">
        <div className="why-header">
          <p className="section-kicker">Why Choose Us</p>
          <h2>Built for clarity, speed, and trust</h2>
        </div>
        <div className="why-grid">
          {whyChooseUs.map((point) => (
            <article key={point.title} className="why-card">
              <h3>{point.title}</h3>
              <p>{point.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <div>
          <p className="section-kicker">Ready to Upgrade?</p>
          <h2>Open the Products page and start your next setup.</h2>
        </div>
        <button className="hero-btn primary" onClick={() => goToProducts('All')}>Shop Now</button>
      </section>
    </div>
  );
};

export default Home;
