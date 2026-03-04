import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminUsers, updateAdminUserRole } from '../../api';
import '../../styles/Admin.css';

const ManageUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [roleDrafts, setRoleDrafts] = useState({});
  const [message, setMessage] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const { data } = await fetchAdminUsers();
        const rows = data?.users || [];
        setUsers(rows);
        setRoleDrafts(
          rows.reduce((acc, user) => {
            acc[user._id] = String(user.role || 'user').toLowerCase();
            return acc;
          }, {})
        );
      } catch (err) {
        console.error('Admin Users Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleRoleUpdate = async (user) => {
    const draftRole = String(roleDrafts[user._id] || 'user').toLowerCase();
    const currentRole = String(user.role || 'user').toLowerCase();

    if (draftRole === currentRole) return;

    try {
      setMessage('');
      setUpdatingUserId(user._id);
      const { data } = await updateAdminUserRole(user._id, draftRole);
      const updatedUser = data?.user;
      setUsers((prev) => prev.map((row) => (row._id === updatedUser._id ? updatedUser : row)));
      setRoleDrafts((prev) => ({ ...prev, [user._id]: String(updatedUser.role || 'user').toLowerCase() }));
      setMessage('Role updated successfully.');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update role.';
      setMessage(errMsg);
    } finally {
      setUpdatingUserId('');
    }
  };

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
      {message ? <div className="orders-message">{message}</div> : null}

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
              <th>Actions</th>
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
                <td>
                  <div className="role-controls">
                    <select
                      className="tracking-select role-select"
                      value={roleDrafts[user._id] || 'user'}
                      onChange={(e) => setRoleDrafts((prev) => ({ ...prev, [user._id]: e.target.value }))}
                      disabled={updatingUserId === user._id}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="button"
                      className="admin-btn-primary role-save-btn"
                      onClick={() => handleRoleUpdate(user)}
                      disabled={
                        updatingUserId === user._id ||
                        (roleDrafts[user._id] || 'user') === String(user.role || 'user').toLowerCase()
                      }
                    >
                      {updatingUserId === user._id ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageUsers;
