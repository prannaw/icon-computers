import React, { useEffect, useState } from 'react';
import { fetchProfile, updateProfile } from '../../api';
import '../../styles/Profile.css';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    address: {
      fullAddress: '',
      city: '',
      state: '',
      country: 'India',
      pinCode: ''
    }
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const { data } = await fetchProfile();
        const user = data?.user || {};
        setFormData({
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
          address: {
            fullAddress: user.address?.fullAddress || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            country: user.address?.country || 'India',
            pinCode: user.address?.pinCode || ''
          }
        });
      } catch (err) {
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.username.trim()) {
      setError('Username is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        username: formData.username.trim(),
        phone: formData.phone.trim(),
        address: {
          fullAddress: formData.address.fullAddress.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          country: formData.address.country.trim(),
          pinCode: formData.address.pinCode.trim()
        }
      };

      const { data } = await updateProfile(payload);
      const updatedUser = data?.user || {};

      const localUser = JSON.parse(localStorage.getItem('user')) || {};
      localStorage.setItem('user', JSON.stringify({
        ...localUser,
        ...updatedUser,
        token: localUser?.token || localStorage.getItem('token') || ''
      }));
      window.dispatchEvent(new Event('user-updated'));

      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-page"><div className="profile-card">Loading profile...</div></div>;
  }

  return (
    <div className="profile-page">
      <form className="profile-card" onSubmit={handleSave}>
        <h2>My Profile</h2>
        <p className="profile-subtitle">Update your account details and default address.</p>

        {error && <p className="profile-error">{error}</p>}
        {message && <p className="profile-success">{message}</p>}

        <div className="profile-grid">
          <div className="profile-field">
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              required
            />
          </div>

          <div className="profile-field">
            <label>Email</label>
            <input type="email" value={formData.email} disabled />
          </div>

          <div className="profile-field">
            <label>Phone</label>
            <input
              type="tel"
              placeholder="10-digit phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div className="profile-field full-width">
            <label>Full Address</label>
            <textarea
              rows="3"
              value={formData.address.fullAddress}
              onChange={(e) => handleAddressChange('fullAddress', e.target.value)}
            ></textarea>
          </div>

          <div className="profile-field">
            <label>City</label>
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>State</label>
            <input
              type="text"
              value={formData.address.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Country</label>
            <input
              type="text"
              value={formData.address.country}
              onChange={(e) => handleAddressChange('country', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>PIN Code</label>
            <input
              type="text"
              value={formData.address.pinCode}
              onChange={(e) => handleAddressChange('pinCode', e.target.value)}
            />
          </div>
        </div>

        <button className="profile-save-btn" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
