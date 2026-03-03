import axios from 'axios';

// baseURL points to your backend server
const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Request Interceptor for Auth
API.interceptors.request.use((req) => {
    const storageData = localStorage.getItem('user');
    if (storageData) {
        const parsedData = JSON.parse(storageData);
        // Supports both structured { result, token } and flat { token } storage
        const token = parsedData?.token || parsedData?.result?.token;
        if (token) {
            req.headers.Authorization = `Bearer ${token}`;
        }
    }
    return req;
});

// Response Interceptor for cleaner error logging
API.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.message;
        console.error("API Error:", message);
        return Promise.reject(error);
    }
);

// --- Auth API ---
export const login = (formData) => API.post('/auth/login', formData);
export const signup = (formData) => API.post('/auth/signup', formData);

// --- Products API ---
/**
 * fetchProducts: Supports category, search, and sort params.
 */
export const fetchProducts = (params) => API.get('/products', { params });

/**
 * Single Product & Inventory Management
 */
export const fetchProductDetails = (id) => API.get(`/products/${id}`);
export const addProduct = (productData) => API.post('/products', productData);

// The core function for your "Modify" button
export const updateProduct = (id, updatedData) => API.put(`/products/${id}`, updatedData);

export const deleteProduct = (id) => API.delete(`/products/${id}`);

// --- Orders API (NEW) ---
/**
 * placeOrder: Sends order details (items, total, address) to the server.
 * This is what makes the "Revenue" count go up in the Dashboard.
 */
export const placeOrder = (orderData) => API.post('/products/order', orderData);

// --- Reviews API ---
export const fetchReviews = (productId) => API.get(`/products/${productId}/reviews`);
export const postReview = (productId, reviewData) => API.post(`/products/${productId}/reviews`, reviewData);
export const deleteReview = (reviewId) => API.delete(`/products/delete/${reviewId}`);

// --- Admin Stats API ---
/**
 * fetchAdminStats: Fetches dashboard data: Total Users, Revenue, Inventory Count, Top Category.
 */
export const fetchAdminStats = () => API.get('/products/admin/stats');

export default API;