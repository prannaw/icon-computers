import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordResetOtp, verifyPasswordResetOtp } from '../../api';
import './AuthLayout.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await requestPasswordResetOtp(email.trim());
      setMessage(data?.message || 'If your email is registered, an OTP has been sent.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await verifyPasswordResetOtp({
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      });
      setMessage(data?.message || 'Password reset successful. You can now login.');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <form className="auth-form" onSubmit={step === 1 ? handleRequestOtp : handleResetPassword}>
          <h2>Forgot Password</h2>
          <p className="auth-subtitle">
            {step === 1 ? 'Get OTP on your registered email' : 'Enter OTP and set a new password'}
          </p>

          {error && <p className="error-msg">{error}</p>}
          {message && <p className="success-msg">{message}</p>}

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={step === 2}
              required
            />
          </div>

          {step === 2 && (
            <>
              <div className="input-group">
                <label>OTP</label>
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <div className="input-group">
                <label>New Password (6-15 characters)</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  maxLength={15}
                  required
                />
              </div>
            </>
          )}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? (step === 1 ? 'Sending OTP...' : 'Resetting Password...') : (step === 1 ? 'Send OTP' : 'Reset Password')}
          </button>

          <p className="auth-switch">
            Remembered your password? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

