import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api';
import './AuthLayout.css';

const OTPVerify = () => {
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const navigate = useNavigate();
    const location = useLocation();
    const inputRefs = useRef([]);

    // Retrieve email passed from Signup.jsx state
    const email = location.state?.email || "";

    // Redirect if no email is found (prevents manual URL access)
    useEffect(() => {
        if (!email) {
            navigate('/signup');
        }
    }, [email, navigate]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Move to next input if value is entered
        if (element.value !== "" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        // Move to previous input on backspace if current is empty
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpString = otp.join("");
        
        if (otpString.length < 6) {
            setError("Please enter the full 6-digit code.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { data } = await API.post('/auth/verify-otp', { email, otp: otpString });
            
            // Success: Store data and redirect
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user)); 
            
            navigate('/');
            window.location.reload(); 
        } catch (err) {
            setError(err.response?.data?.msg || "Invalid or expired OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            setError("");
            setLoading(true);
            await API.post('/auth/signup', { email }); // Triggers resend logic in backend
            alert("A fresh OTP has been sent to your email.");
        } catch (err) {
            setError("Failed to resend OTP. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-container">
                <div className="auth-form" style={{ textAlign: 'center' }}>
                    <h2>Security Check</h2>
                    <p className="auth-subtitle">
                        We sent a 6-digit code to <br />
                        <span style={{ color: '#007bff', fontWeight: 'bold' }}>{email}</span>
                        <br />
                        {/* --- SPAM FOLDER CLARIFICATION --- */}
                        <small style={{ display: 'block', marginTop: '12px', color: '#888', fontStyle: 'italic' }}>
                            (If you don't see it, please check your <strong>Spam</strong> or <strong>Junk</strong> folder)
                        </small>
                    </p>

                    {error && <p className="error-msg" style={{ marginBottom: '20px' }}>{error}</p>}

                    <div className="otp-input-container">
                        {otp.map((data, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                className="otp-input-box"
                                type="text"
                                maxLength="1"
                                value={data}
                                onChange={(e) => handleChange(e.target, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                            />
                        ))}
                    </div>

                    <button 
                        className="auth-btn" 
                        onClick={handleVerify} 
                        disabled={loading}
                    >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>

                    <p className="auth-switch" style={{ marginTop: '20px' }}>
                        Didn't receive the code? <br />
                        <span 
                            className="resend-link" 
                            onClick={handleResend}
                        >
                            Resend OTP
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OTPVerify;