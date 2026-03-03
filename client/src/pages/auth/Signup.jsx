import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api'; 
import './AuthLayout.css';

const Signup = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Clear old sessions to ensure a clean state
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        try {
            // 1. Call the updated signup route
            // The backend will now check the password length and send the OTP
            await API.post('/auth/signup', formData);
            
            // 2. SUCCESS: Redirect to OTP verification page
            // We pass the email in 'state' so the OTP page knows which user to verify
            navigate('/otp', { state: { email: formData.email } });
            
        } catch (err) {
            // Displays specific backend errors (e.g., "Password must be 6-15 characters")
            const serverMessage =
              err.response?.data?.msg ||
              err.response?.data?.message ||
              err.response?.data?.error ||
              (err.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : '');
            setError(serverMessage || 'Registration failed. Please try again.');
            
            console.error("Signup Error Details:", err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-container">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>Create Account</h2>
                    <p className="auth-subtitle">Join Icon Computers today</p>
                    
                    {error && (
                        <p className="error-msg">
                            {error}
                        </p>
                    )}
                    
                    <div className="input-group">
                        <label>Username</label>
                        <input 
                            type="text" 
                            placeholder="Enter username" 
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            placeholder="name@example.com" 
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label>Password (6-15 characters)</label>
                        <input 
                            type="password" 
                            placeholder="6 - 15 characters" 
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                            // Enforcement on the frontend side
                            minLength="6"
                            maxLength="15"
                            required 
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Sending OTP...' : 'Create Account'}
                    </button>
                    
                    <p className="auth-switch">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Signup;
