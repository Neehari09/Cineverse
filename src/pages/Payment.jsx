import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRazorpay } from "react-razorpay";
import { createRazorpayOrder, verifyRazorpayPayment } from '../api/backend';
import Navbar from '../components/Navbar';
import './Payment.css';

export default function Payment() {
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingData } = location.state || {};
    const { Razorpay } = useRazorpay();

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!bookingData) {
            navigate('/movies');
        }
    }, [bookingData, navigate]);

    if (!bookingData) return null;

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            // 1. Create order on backend
            const orderData = await createRazorpayOrder(bookingData.amount);

            // 2. Initialize Razorpay checkout
            const options = {
                key: "rzp_test_TOlKJXNOTK4eAf", // Your Test Key ID
                amount: orderData.amount, // in paise
                currency: orderData.currency,
                name: "Cineverse",
                description: `Tickets for ${bookingData.movie_title}`,
                order_id: orderData.order_id,
                handler: async function (response) {
                    try {
                        // 3. Verify payment signature on backend
                        await verifyRazorpayPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            booking_data: bookingData
                        });
                        setIsSuccess(true);
                        setTimeout(() => {
                            navigate('/bookings');
                        }, 2000);
                    } catch (err) {
                        console.error("Verification failed", err);
                        alert("Payment verification failed. Please contact support.");
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: "Test User",
                    email: "test@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#e50914" // Cineverse red
                }
            };

            const rzp = new Razorpay(options);
            rzp.on("payment.failed", function (response) {
                console.error("Payment failed", response.error);
                alert("Payment failed: " + response.error.description);
                setIsProcessing(false);
            });
            rzp.open();

        } catch (error) {
            console.error("Failed to initiate payment", error);
            alert("Could not connect to payment gateway. Please try again.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="payment-page">
            <Navbar />
            <div className="payment-container">
                <div className="payment-summary">
                    <h2>Order Summary</h2>
                    <div className="summary-item">
                        <span>Movie</span>
                        <span>{bookingData.movie_title}</span>
                    </div>
                    <div className="summary-item">
                        <span>Cinema</span>
                        <span>{bookingData.cinema}</span>
                    </div>
                    <div className="summary-item">
                        <span>Date & Time</span>
                        <span>{new Date(bookingData.show_date).toLocaleDateString()} @ {bookingData.show_time}</span>
                    </div>
                    <div className="summary-item">
                        <span>Seats</span>
                        <span>{bookingData.seat_numbers}</span>
                    </div>
                    <hr className="summary-divider" />
                    <div className="summary-item total">
                        <span>Total Amount</span>
                        <span>₹{bookingData.amount}</span>
                    </div>
                </div>

                <div className="payment-form-container">
                    {isSuccess ? (
                        <div className="success-state">
                            <div className="checkmark-circle">
                                <div className="checkmark draw"></div>
                            </div>
                            <h2>Payment Successful!</h2>
                            <p>Your tickets have been booked.</p>
                            <p className="redirect-text">Redirecting to your bookings...</p>
                        </div>
                    ) : (
                        <div className="razorpay-checkout-section">
                            <h2>Complete Payment</h2>
                            <p className="payment-subtitle">Click the button below to proceed securely with Razorpay.</p>

                            <button onClick={handlePayment} className={`pay-btn ${isProcessing ? 'processing' : ''}`} disabled={isProcessing}>
                                {isProcessing ? <span className="spinner"></span> : `Pay ₹${bookingData.amount} with Razorpay`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
