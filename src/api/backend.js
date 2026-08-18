import axios from 'axios';

// This is the base URL of your Django server
const API = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'https://cineverse-backend-1k9l.onrender.com/api/',
});

// Register a new user
export const registerUser = async (username, email, password) => {
    const response = await API.post('auth/register/', { username, email, password });
    return response.data;
};

// Log a user in
export const loginUser = async (username, password) => {
    const response = await API.post('auth/login/', { username, password });
    // Save the token securely in localStorage so the user stays logged in
    if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
};

// Create a new Booking
export const createBooking = async (bookingData) => {
    const token = localStorage.getItem('access_token');
    const response = await API.post('bookings/', bookingData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Create a Razorpay Order
export const createRazorpayOrder = async (amount) => {
    const token = localStorage.getItem('access_token');
    const response = await API.post('bookings/create_order/', { amount }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Verify a Razorpay Payment and complete booking
export const verifyRazorpayPayment = async (paymentData) => {
    const token = localStorage.getItem('access_token');
    const response = await API.post('bookings/verify_payment/', paymentData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Get all Bookings for the user
export const getBookings = async () => {
    const token = localStorage.getItem('access_token');
    const response = await API.get('bookings/', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Get taken seats for a specific show
export const getTakenSeats = async (params) => {
    const response = await API.get('bookings/taken_seats/', { params });
    return response.data.taken_seats;
};
