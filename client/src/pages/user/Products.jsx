import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../api';
import ProductCard from '../../components/ProductCard.jsx';
import '../../styles/Home.css';

const categories = [
  { name: 'LAPTOPS', img: '/cat-laptop.png', subs: ['Personal Laptops', 'Business Laptops', 'Gaming Laptops'] },
  { name: 'MONITORS', img: '/cat-monitor.png', subs: ['LED Monitors', 'OLED Monitors', 'LCD Monitors'] },
  { name: 'PRINTERS', img: '/cat-printer.png', subs: ['Inkjet Printers', 'Laser Printers'] },
  { name: 'WIFI ROUTERS', img: '/cat-wifi.png', subs: ['Wireless Routers', 'Wired Routers'] },
  { name: 'CPU ACC.', img: '/cat-cpu.png', subs: ['Hard Drives', 'Power Supplies', 'RAMs', 'Processors', 'GPUs', 'Motherboards'] },
  { name: 'MOUSE', img: '/cat-mouse.png', subs: ['Ergonomical Mouse', 'Gaming Mouse'] },
  { name: 'KEYBOARDS', img: '/cat-keyboard.png', subs: ['Mechanical Keyboards', 'Membrane Keyboards'] },
  { name: 'CABLES', img: '/cat-cable.png', subs: ['USB Cables', 'HDMI Cables', 'VGA Cables', 'DisplayPort Cables'] }
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('newest');

  const location = useLocation();
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(location.search);
      const category = params.get('category') || '';
      const search = params.get('search') || '';
      const response = await API.get(`/products?category=${category}&search=${search}&sort=${sortOption}`);
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Could not load products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [location.search, sortOption]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filterByCategory = (categoryName) => {
    const searchParams = new URLSearchParams(location.search);
    if (categoryName === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryName);
    }
    searchParams.delete('search');
    navigate({ pathname: '/products', search: searchParams.toString() });
  };

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
                  <li
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      filterByCategory(sub);
                    }}
                  >
                    {sub}
                  </li>
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
              <label htmlFor="sort">Sort By:</label>
              <select id="sort" value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="sort-dropdown">
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
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
