import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './TicketVerification.css';

export default function TicketVerification() {
    const { bookingCode } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch from the API, but we need an unauthenticated way, 
        // OR we can just try grabbing it using the token if the user is logged in on their phone,
        // BUT wait, on their phone they are likely NOT logged in.
        // Let's create an unauthenticated endpoint in the backend for ticket verification!
        const fetchTicket = async () => {
            try {
                // Let's hit the backend API (we will create this endpoint in a sec)
                // Note: we use the current hostname so it works on mobile
                const response = await fetch(`http://${window.location.hostname}:8000/api/bookings/verify_ticket/?code=${bookingCode}`);
                if (response.ok) {
                    const data = await response.json();
                    setTicket(data);
                }
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        fetchTicket();
    }, [bookingCode]);

    if (loading) {
        return <div className="tv-container"><p>Verifying Ticket...</p></div>;
    }

    if (!ticket) {
        return (
            <div className="tv-container">
                <div className="tv-card error-card">
                    <h2>Ticket Not Found</h2>
                    <p>We could not verify the ticket with code: {bookingCode}.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tv-container">
            <div className="tv-card success-card">
                <div className="tv-header">
                    <h2>Verified Ticket</h2>
                    <span className="tv-badge">Valid</span>
                </div>
                <div className="tv-content">
                    <h3 className="tv-movie">{ticket.movie_title}</h3>
                    <p className="tv-cinema">{ticket.cinema}</p>
                    
                    <div className="tv-grid">
                        <div className="tv-item">
                            <label>Date</label>
                            <span>{new Date(ticket.show_date).toLocaleDateString()}</span>
                        </div>
                        <div className="tv-item">
                            <label>Time</label>
                            <span>{ticket.show_time}</span>
                        </div>
                        <div className="tv-item">
                            <label>Seats</label>
                            <span>{ticket.seat_numbers}</span>
                        </div>
                        <div className="tv-item">
                            <label>Format</label>
                            <span>{ticket.format}</span>
                        </div>
                        <div className="tv-item">
                            <label>Booking ID</label>
                            <span>{ticket.booking_code}</span>
                        </div>
                    </div>
                </div>
                <div className="tv-footer">
                    <p>Enjoy your movie!</p>
                </div>
            </div>
        </div>
    );
}
