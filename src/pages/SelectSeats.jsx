import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BookNow.css';
import { getPosterUrl } from '../api/tmdb';
import Navbar from '../components/Navbar';
import { getTakenSeats } from '../api/backend';

const SEAT_CATEGORIES = [
    { key: 'recliner', label: 'Recliner', price: 450, rows: ['A', 'B'] },
    { key: 'premium', label: 'Premium', price: 320, rows: ['C', 'D', 'E'] },
    { key: 'classic', label: 'Classic', price: 200, rows: ['F', 'G', 'H'] },
];

const SEATS_PER_ROW = 12;
const AISLE_AFTER = [3, 8];
const MAX_SEATS = 8;



export default function SelectSeats() {
    const location = useLocation();
    const navigate = useNavigate();

    const { movie, selectedCinema, selectedShowtime, selectedDate, selectedSeats: initialSeats } = location.state || {};

    const [selectedSeats, setSelectedSeats] = useState(initialSeats || []);
    const [takenSeats, setTakenSeats] = useState(new Set());

    useEffect(() => {
        if (!movie || !selectedShowtime) return;

        const fetchSeats = async () => {
            try {
                const params = {
                    tmdb_movie_id: movie.id,
                    cinema: selectedCinema,
                    show_date: selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString(),
                    show_time: selectedShowtime.time,
                    movie_format: selectedShowtime.format
                };
                const fetchedTakenSeats = await getTakenSeats(params);
                setTakenSeats(new Set(fetchedTakenSeats));
            } catch (err) {
                console.error("Error fetching taken seats", err);
            }
        };

        fetchSeats();
    }, [movie, selectedCinema, selectedDate, selectedShowtime]);

    const seatPrice = useCallback((row) => {
        const cat = SEAT_CATEGORIES.find((c) => c.rows.includes(row));
        return cat ? cat.price : 0;
    }, []);

    const totalPrice = selectedSeats.reduce((sum, s) => sum + seatPrice(s[0]), 0);

    const toggleSeat = (seatId) => {
        if (takenSeats.has(seatId)) return;
        setSelectedSeats((prev) => {
            if (prev.includes(seatId)) return prev.filter((s) => s !== seatId);
            if (prev.length >= MAX_SEATS) return prev;
            return [...prev, seatId];
        });
    };

    const canProceed = selectedSeats.length > 0;

    // Guard: if navigated to directly without state, go back
    if (!movie || !selectedShowtime) {
        return (
            <div className="bn-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: '#a9a6b8' }}>No booking data found. Please start from the movie page.</p>
                <button className="bn-proceed-btn" onClick={() => navigate('/movies')}>Browse Movies</button>
            </div>
        );
    }

    const handlePayment = async () => {
        if (!localStorage.getItem('access_token')) {
            navigate('/login', { 
                state: { 
                    returnTo: '/seats', 
                    ...location.state, 
                    selectedSeats 
                } 
            });
            return;
        }

        const bookingData = {
            tmdb_movie_id: movie.id,
            movie_title: movie.title, 
            movie_poster: movie.poster_path || '', 
            cinema: selectedCinema,
            show_date: selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString(),
            show_time: selectedShowtime.time,
            format: selectedShowtime.format,
            seat_numbers: selectedSeats.slice().sort().join(','),
            amount: totalPrice,
            booking_code: `CV${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            status: 'upcoming'
        };
        
        // Navigate to payment page with booking data
        navigate('/payment', { state: { bookingData } });
    };

    return (
        <div className="bn-page">
            <Navbar />
            {/* MOVIE INFO HEADER */}
            <header className="bn-header">
                <button className="bn-back-btn" onClick={() => navigate(-1)}>
                    <IconArrowLeft />
                </button>
                <div className="bn-header-poster">
                    {movie.poster_path ? (
                        <img src={getPosterUrl(movie.poster_path)} alt={movie.title} />
                    ) : (
                        <div className="bn-poster-fallback"><IconFilm /></div>
                    )}
                </div>
                <div className="bn-header-info">
                    <h1>{movie.title}</h1>
                    <div className="bn-header-meta">
                        <span>{selectedCinema}</span>
                        <span className="dot">&bull;</span>
                        <span>{selectedShowtime.time} ({selectedShowtime.format})</span>
                    </div>
                </div>
            </header>

            <main className="bn-main-seats">
                {/* SEAT MAP */}
                <section className="bn-seat-map-wrap">
                    <div className="bn-screen-arc">
                        <div className="bn-screen-curve" />
                        <span>SCREEN THIS WAY</span>
                    </div>

                    <div className="bn-seat-map">
                        {SEAT_CATEGORIES.map((cat) => (
                            <div key={cat.key} className="bn-seat-category">
                                <div className="bn-category-label">
                                    <span>{cat.label}</span>
                                    <em>₹{cat.price}</em>
                                </div>
                                {cat.rows.map((row) => (
                                    <div key={row} className="bn-seat-row">
                                        <span className="bn-row-label">{row}</span>
                                        <div className="bn-seat-cells">
                                            {Array.from({ length: SEATS_PER_ROW }).map((_, i) => {
                                                const seatId = `${row}${i + 1}`;
                                                const isTaken = takenSeats.has(seatId);
                                                const isSelected = selectedSeats.includes(seatId);
                                                const isAisle = AISLE_AFTER.includes(i + 1);

                                                return (
                                                    <React.Fragment key={seatId}>
                                                        <button
                                                            className={`bn-seat ${isTaken ? 'taken' : isSelected ? 'selected' : ''}`}
                                                            disabled={isTaken}
                                                            onClick={() => toggleSeat(seatId)}
                                                            title={isTaken ? 'Taken' : `₹${cat.price}`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                        {isAisle && <span className="bn-aisle-gap" />}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* LEGEND */}
                    <div className="bn-legend">
                        <span><i className="bn-legend-swatch available" /> Available</span>
                        <span><i className="bn-legend-swatch selected" /> Selected</span>
                        <span><i className="bn-legend-swatch taken" /> Taken</span>
                    </div>
                </section>
            </main>

            {/* STICKY SUMMARY BAR */}
            <div className="bn-summary-bar">
                <div className="bn-summary-seats">
                    {selectedSeats.length === 0 ? (
                        <span className="bn-summary-hint">Select up to {MAX_SEATS} seats</span>
                    ) : (
                        <>
                            <span className="bn-summary-count">
                                {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}
                            </span>
                            <span className="bn-summary-ids">{selectedSeats.slice().sort().join(', ')}</span>
                        </>
                    )}
                </div>
                <div className="bn-summary-right">
                    <div className="bn-summary-total">
                        <span>Total</span>
                        <strong>₹{totalPrice}</strong>
                    </div>
                    <button
                        className="bn-proceed-btn"
                        disabled={!canProceed}
                        onClick={handlePayment}
                    >
                        Proceed to Pay <span>→</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------------- ICONS ---------------- */
function IconArrowLeft() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
        </svg>
    );
}
function IconFilm() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.18" />
            <line x1="8" y1="2" x2="8" y2="22" />
            <line x1="16" y1="2" x2="16" y2="22" />
        </svg>
    );
}
