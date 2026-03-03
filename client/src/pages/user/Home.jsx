import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../api'; 
import ProductCard from '../../components/ProductCard.jsx';
import '../../styles/Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('newest');

  const location = useLocation();
  const navigate = useNavigate();

  /**
   * 1. Core Fetch Logic
   * The backend aggregation pipeline provides 'averageRating' and 'reviewCount'.
   * Because this is called on every URL change, navigating back from 
   * ProductDetails will trigger a fresh fetch with the new ratings.
   */
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(location.search);
      const category = params.get('category') || '';
      const search = params.get('search') || '';
      
      const response = await API.get(`/products?category=${category}&search=${search}&sort=${sortOption}`);
      
      setProducts(response.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Could not load products. Please check your connection.");
      setLoading(false);
    }
  };

  /**
   * The dependency array includes location.search. 
   * When you navigate back from a ProductDetails page, the URL changes 
   * (even if just the path), which triggers this effect.
   */
  useEffect(() => {
    fetchProducts();
  }, [location.search, sortOption]);

  // 2. Navigation Helper
  const filterByCategory = (categoryName) => {
    const searchParams = new URLSearchParams(location.search);
    
    if (categoryName === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryName);
    }
    
    searchParams.delete('search'); 
    navigate({ pathname: location.pathname, search: searchParams.toString() });
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const categories = [
    { name: "LAPTOPS", img: "/cat-laptop.png", subs: ["Personal Laptops", "Business Laptops", "Gaming Laptops"] },
    { name: "MONITORS", img: "/cat-monitor.png", subs: ["LED Monitors", "OLED Monitors", "LCD Monitors"] },
    { name: "PRINTERS", img: "/cat-printer.png", subs: ["Inkjet Printers", "Laser Printers"] },
    { name: "WIFI ROUTERS", img: "/cat-wifi.png", subs: ["Wireless Routers", "Wired Routers"] },
    { name: "CPU ACC.", img: "/cat-cpu.png", subs: ["Hard Drives", "Power Supplies", "RAMs", "Processors", "GPUs", "Motherboards"] },
    { name: "MOUSE", img: "/cat-mouse.png", subs: ["Ergonomical Mouse", "Gaming Mouse"] },
    { name: "KEYBOARDS", img: "/cat-keyboard.png", subs: ["Mechanical Keyboards", "Membrane Keyboards"] },
    { name: "CABLES", img: "/cat-cable.png", subs: ["USB Cables", "HDMI Cables", "VGA Cables", "DisplayPort Cables"] }
  ];

  const currentCategoryDisplay = new URLSearchParams(location.search).get('category') || 'All';

  return (
    <div className="home-container">
      <section className="quick-categories">
        {categories.map((cat, index) => {
          const root = cat.name.replace(/S$/i, '').toUpperCase(); 
          const activeCatUpper = currentCategoryDisplay.toUpperCase();
          const isActive = activeCatUpper.includes(root) && activeCatUpper !== 'ALL';

          return (
            <div className="category-item-wrapper" key={index} onClick={() => filterByCategory(cat.name)}>
              <div className={`category-item ${isActive ? 'active' : ''}`}>
                <div className="cat-img-box">
                  <img src={cat.img} alt={cat.name} />
                  <div className="cat-overlay">
                    <span>{cat.name}</span>
                  </div>
                </div>
              </div>
              <ul className="category-dropdown">
                {cat.subs.map((sub, i) => (
                  <li key={i} onClick={(e) => {
                    e.stopPropagation();
                    filterByCategory(sub);
                  }}>{sub}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <div className="home-layout">
        <main className="products-section">
          <div className="section-header">
            <h2 className="section-title">
              {currentCategoryDisplay.toUpperCase() === 'ALL' ? 'Our Products' : `Category: ${currentCategoryDisplay}`}
            </h2>
            
            <div className="filter-bar">
              <label htmlFor="sort">Sort By: </label>
              <select id="sort" value={sortOption} onChange={handleSortChange} className="sort-dropdown">
                <option value="newest">Newest Arrivals</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="topRated">Customer Ratings</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="status-message">Refreshing Catalog...</div>
          ) : error ? (
            <div className="status-message error">{error}</div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <p>No products found for "{currentCategoryDisplay}".</p>
              <button onClick={() => filterByCategory('All')}>Clear Filters</button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((item) => (
                // Item here contains averageRating and reviewCount from the backend
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;