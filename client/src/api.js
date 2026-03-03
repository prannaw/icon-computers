import axios from 'axios';

const rawApiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const normalizedApiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');

const API = axios.create({
  baseURL: normalizedApiBaseUrl,
  timeout: 20000
});

API.interceptors.request.use((req) => {
    const storageData = localStorage.getItem('user');
    const tokenFromStorage = localStorage.getItem('token');
    if (storageData) {
        const parsedData = JSON.parse(storageData);
        const token = parsedData?.token || parsedData?.result?.token || tokenFromStorage;
        if (token) {
            req.headers.Authorization = `Bearer ${token}`;
        }
    } else if (tokenFromStorage) {
        req.headers.Authorization = `Bearer ${tokenFromStorage}`;
    }
    return req;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.message;
        console.error("API Error:", message);
        return Promise.reject(error);
    }
);

export const login = (formData) => API.post('/auth/login', formData);
export const signup = (formData) => API.post('/auth/signup', formData);
export const fetchProfile = () => API.get('/auth/profile');
export const updateProfile = (profileData) => API.put('/auth/profile', profileData);

export const fetchProducts = (params) => API.get('/products', { params });
export const fetchProductDetails = (id) => API.get(`/products/${id}`);
export const addProduct = (productData) => API.post('/products', productData);
export const updateProduct = (id, updatedData) => API.put(`/products/${id}`, updatedData);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

export const placeOrder = (orderData) => API.post('/products/order', orderData);
export const fetchMyOrders = () => API.get('/products/orders/my');
export const cancelMyOrder = (orderId, reason) =>
  API.patch(`/products/orders/${orderId}/cancel`, { reason });

export const createCashfreeOrder = (paymentData) =>
  API.post('/products/payment/cashfree/create-order', paymentData);

export const verifyCashfreeOrder = (orderId) =>
  API.post('/products/payment/cashfree/verify', { orderId });

export const fetchReviews = (productId) => API.get(`/products/${productId}/reviews`);
export const postReview = (productId, reviewData) => API.post(`/products/${productId}/reviews`, reviewData);
export const deleteReview = (reviewId) => API.delete(`/products/delete/${reviewId}`);

export const fetchAdminStats = () => API.get('/products/admin/stats');
export const fetchAdminRevenueTrend = (months = 6) =>
  API.get('/products/admin/revenue-trend', { params: { months } });
export const fetchAdminOrders = () => API.get('/products/admin/orders');
export const updateAdminOrderTracking = (orderId, trackingStage) =>
  API.patch(`/products/admin/orders/${orderId}/tracking`, { trackingStage });
export const fetchAdminUsers = () => API.get('/products/admin/users');
export const fetchAdminVerifications = () => API.get('/products/admin/verifications');

export default API;
