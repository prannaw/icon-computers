import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';
import './AuthLayout.css';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post('/auth/login', formData);
            const userData = { ...(data.user || data), token: data.token };
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', data.token);

            // Using window.location.href instead of navigate('/') forces a 
            // full app refresh so App.jsx picks up the 'admin' role immediately.
            window.location.href = "/"; 
            
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-container">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>Welcome Back</h2>
                    <p className="auth-subtitle">Login to your account</p>
                    
                    {error && <p className="error-msg">{error}</p>}
                    
                    <div className="input-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            placeholder="name@example.com" 
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            placeholder="Enter password" 
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                            required 
                        />
                    </div>

                    <button type="submit" className="auth-btn">Login</button>
                    
                    <p className="auth-switch">
                        Don't have an account? <Link to="/signup">Sign Up</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
