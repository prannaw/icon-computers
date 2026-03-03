import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminUsers } from '../../api';
import '../../styles/Admin.css';

const ManageUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const { data } = await fetchAdminUsers();
        setUsers(data?.users || []);
      } catch (err) {
        console.error('Admin Users Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  return (
    <div className="admin-main">
      <div className="admin-header-row">
        <div>
          <h2>Registered Users</h2>
          <p className="admin-subtitle">View and monitor all user accounts</p>
        </div>
        <div className="admin-actions">
          <Link to="/admin-dashboard" className="admin-btn-secondary">Back to Dashboard</Link>
        </div>
      </div>

      {loading ? (
        <div className="chart-placeholder"><span>Loading users...</span></div>
      ) : users.length === 0 ? (
        <div className="chart-placeholder"><span>No users found.</span></div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Blocked</th>
              <th>Joined On</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.username || 'N/A'}</td>
                <td>{user.email || 'N/A'}</td>
                <td>{(user.role || 'user').toUpperCase()}</td>
                <td>{user.isVerified ? 'Yes' : 'No'}</td>
                <td>{user.isBlocked ? 'Yes' : 'No'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageUsers;
