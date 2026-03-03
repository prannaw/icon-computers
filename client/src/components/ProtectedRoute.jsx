// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAdminRequired }) => {
  const user = JSON.parse(localStorage.getItem('user')); // We'll store user here after login

  if (!user) return <Navigate to="/login" />;
  
  if (isAdminRequired && user.role !== 'admin') {
    return <Navigate to="/" />; // Send non-admins back to home
  }

  return children;
};