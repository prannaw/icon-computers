import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminRevenueTrend, fetchAdminStats } from '../../api';
import '../../styles/Admin.css';

const CHART_WIDTH = 760;
const CHART_HEIGHT = 220;
const CHART_PAD_X = 30;
const CHART_PAD_Y = 20;

const formatRs = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const Dashboard = () => {
  const [stats, setStats] = useState([
    { label: 'Total Users', value: '0', key: 'userCount', color: '#00d2ff' },
    { label: 'Inventory Items', value: '0', key: 'inventoryCount', color: '#4caf50' },
    { label: 'Revenue', value: 'Rs 0', key: 'revenue', color: '#ff9800' },
    { label: 'Top Category', value: 'None', key: 'topCategory', color: '#e91e63' }
  ]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [growthSummary, setGrowthSummary] = useState({
    currentRevenue: 0,
    previousRevenue: 0,
    growthPercent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDashboardData = async () => {
      try {
        setLoading(true);
        const [{ data: statsData }, { data: trendData }] = await Promise.all([
          fetchAdminStats(),
          fetchAdminRevenueTrend(6)
        ]);

        setStats((prev) => prev.map((item) => {
          let displayValue = statsData[item.key];
          if (item.key === 'revenue') displayValue = formatRs(statsData[item.key]);
          if (item.key === 'userCount' || item.key === 'inventoryCount') displayValue = statsData[item.key] || 0;
          if (item.key === 'topCategory') displayValue = statsData[item.key] || 'N/A';
          return { ...item, value: displayValue };
        }));

        setRevenueTrend(Array.isArray(trendData?.points) ? trendData.points : []);
        setGrowthSummary(trendData?.summary || { currentRevenue: 0, previousRevenue: 0, growthPercent: 0 });
      } catch (err) {
        console.error('Dashboard Stats Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };

    getDashboardData();
  }, []);

  const chartPath = useMemo(() => {
    if (!revenueTrend.length) return '';
    const maxRevenue = Math.max(...revenueTrend.map((point) => point.revenue), 1);
    const stepX = revenueTrend.length > 1 ? (CHART_WIDTH - CHART_PAD_X * 2) / (revenueTrend.length - 1) : 0;

    const coords = revenueTrend.map((point, index) => {
      const x = CHART_PAD_X + (stepX * index);
      const y = CHART_HEIGHT - CHART_PAD_Y - ((point.revenue / maxRevenue) * (CHART_HEIGHT - CHART_PAD_Y * 2));
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    });

    return coords.join(' ');
  }, [revenueTrend]);

  const growthPositive = growthSummary.growthPercent >= 0;

  return (
    <div className="admin-main">
      <div className="admin-header-row">
        <div>
          <h2>Business Overview</h2>
          <p className="admin-subtitle">Real-time performance metrics</p>
        </div>
        <div className="admin-actions">
          <Link to="/admin-add" className="admin-btn-primary">Add Product</Link>
          <Link to="/admin-manage" className="admin-btn-secondary">Manage Inventory</Link>
          <Link to="/admin-orders" className="admin-btn-secondary">Manage Orders</Link>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s, index) => (
          s.key === 'userCount' ? (
            <Link
              key={index}
              to="/admin-users"
              className="stat-card stat-card-link"
              style={{ borderLeft: `5px solid ${s.color}` }}
            >
              <p className="stat-label">{s.label}</p>
              <h3 className={loading ? 'pulse-loader' : ''}>{s.value}</h3>
            </Link>
          ) : (
            <div key={index} className="stat-card" style={{ borderLeft: `5px solid ${s.color}` }}>
              <p className="stat-label">{s.label}</p>
              <h3 className={loading ? 'pulse-loader' : ''}>{s.value}</h3>
            </div>
          )
        ))}
      </div>

      <div className="chart-section">
        <h3>Revenue & Growth</h3>
        {revenueTrend.length > 0 ? (
          <>
            <div className="trend-summary-row">
              <div className="trend-pill">
                <span>This month</span>
                <strong>{formatRs(growthSummary.currentRevenue)}</strong>
              </div>
              <div className="trend-pill">
                <span>Last month</span>
                <strong>{formatRs(growthSummary.previousRevenue)}</strong>
              </div>
              <div className={`trend-pill ${growthPositive ? 'up' : 'down'}`}>
                <span>Growth</span>
                <strong>{growthPositive ? '+' : ''}{growthSummary.growthPercent}%</strong>
              </div>
            </div>
            <div className="line-chart-wrap">
              <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="line-chart-svg" role="img" aria-label="Revenue trend for last six months">
                <path d={chartPath} className="line-chart-path" />
              </svg>
              <div className="line-chart-labels">
                {revenueTrend.map((point) => (
                  <span key={point.key}>{point.label}</span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="chart-placeholder">
            <span>No paid orders yet. Revenue trend will appear after first successful order.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
