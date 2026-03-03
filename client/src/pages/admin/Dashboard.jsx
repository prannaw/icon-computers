import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { fetchAdminStats } from '../../api'; 
import '../../styles/Admin.css';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { label: "Total Users", value: "0", key: "userCount", color: "#00d2ff" },
    { label: "Inventory Items", value: "0", key: "inventoryCount", color: "#4caf50" },
    { label: "Revenue", value: "₹0", key: "revenue", color: "#ff9800" },
    { label: "Top Category", value: "None", key: "topCategory", color: "#e91e63" }
  ]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDashboardData = async () => {
      try {
        setLoading(true);
        // Calling the functional stats endpoint from productRoutes.js
        const { data } = await fetchAdminStats();
        
        setStats(prev => prev.map(item => {
          let displayValue = data[item.key];

          // Format Revenue with Currency Symbols and Commas
          if (item.key === "revenue") {
            displayValue = `₹${Number(data[item.key] || 0).toLocaleString('en-IN')}`;
          } 
          // Format User/Inventory counts to ensure they aren't undefined
          else if (item.key === "userCount" || item.key === "inventoryCount") {
            displayValue = data[item.key] || 0;
          }
          // Top Category Fallback
          else if (item.key === "topCategory") {
            displayValue = data[item.key] || "N/A";
          }

          return { ...item, value: displayValue };
        }));
      } catch (err) {
        console.error("Dashboard Stats Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    getDashboardData();
  }, []);

  return (
    <div className="admin-main">
      <div className="admin-header-row">
        <div>
          <h2>Business Overview</h2>
          <p className="admin-subtitle">Real-time performance metrics</p>
        </div>
        <div className="admin-actions">
           <Link to="/admin-add" className="admin-btn-primary">
             + Add Product
           </Link>
           <Link to="/admin-manage" className="admin-btn-secondary">
             Manage Inventory
           </Link>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s, index) => (
          <div key={index} className="stat-card" style={{ borderLeft: `5px solid ${s.color}` }}>
            <p className="stat-label">{s.label}</p>
            <h3 className={loading ? "pulse-loader" : ""}>{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="dashboard-insights">
        <div className="chart-section">
          <h3>Revenue & Growth</h3>
          <div className="chart-placeholder">
            {/* When you're ready, you can insert Recharts or Chart.js here */}
            <span>📊 Sales Analytics Visual (Live Data Active)</span>
          </div>
        </div>

        <div className="recent-activity">
          <h3>Quick Actions</h3>
          <div className="activity-list">
             <div className="activity-item">
                <span className="dot" style={{backgroundColor: '#4caf50'}}></span>
                <p>Check for new <strong>UPI Verification</strong> requests</p>
             </div>
             <div className="activity-item">
                <span className="dot" style={{backgroundColor: '#00d2ff'}}></span>
                <p>View recently registered <strong>Users</strong></p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;