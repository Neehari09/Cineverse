import React, { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BookNow.css';
import { getPosterUrl } from '../api/tmdb';
import Navbar from '../components/Navbar';

/* ---------------- MOCK DATA (swap for real props/API later) ---------------- */

const FALLBACK_MOVIE = {
    id: 0,
    title: 'Selected Movie',
    poster_path: null,
    vote_average: 8.1,
    release_date: '2026-01-01',
    original_language: 'en',
    runtime: 128,
};

const CINEMAS_BY_LOCATION = {
    'Hyderabad': [
        { id: 'hyd1', name: 'CineVerse IMAX — Phoenix Mall', distance: '2.4 km' },
        { id: 'hyd2', name: 'CineVerse Prime — Infinity Mall', distance: '4.1 km' },
        { id: 'hyd3', name: 'PVR Inorbit Mall', distance: '5.2 km' },
        { id: 'hyd4', name: 'AMB Cinemas — Gachibowli', distance: '6.8 km' },
        { id: 'hyd5', name: 'Prasads IMAX', distance: '8.5 km' },
        { id: 'hyd6', name: 'Cinepolis — Mantra Mall', distance: '12 km' },
    ],
    'Warangal': [
        { id: 'war1', name: 'Asian Sridevi Mall', distance: '1.2 km' },
        { id: 'war2', name: 'Cinepolis — Urban Square', distance: '3.4 km' },
        { id: 'war3', name: 'PVR — Warangal', distance: '5.1 km' },
        { id: 'war4', name: 'Bhavani Theatre', distance: '2.8 km' },
        { id: 'war5', name: 'Ramappa Cinemas', distance: '6.0 km' },
    ],
    'Nizamabad': [
        { id: 'niz1', name: 'PVR — Nizamabad', distance: '1.5 km' },
        { id: 'niz2', name: 'Asian Cinemas', distance: '2.8 km' },
        { id: 'niz3', name: 'Natraj Theatre', distance: '3.2 km' },
        { id: 'niz4', name: 'Vijay Theatre', distance: '4.5 km' },
        { id: 'niz5', name: 'Venkateshwara Theatre', distance: '5.0 km' },
    ],
    'Karimnagar': [
        { id: 'kar1', name: 'Thirumala Theatre', distance: '2.0 km' },
        { id: 'kar2', name: 'Siva Theatre', distance: '2.5 km' },
        { id: 'kar3', name: 'Asian Cinemas', distance: '3.1 km' },
        { id: 'kar4', name: 'Geetha Bhavan', distance: '4.0 km' },
        { id: 'kar5', name: 'Srinivasa Theatre', distance: '5.5 km' },
    ],
    'Khammam': [
        { id: 'kha1', name: 'Aditya Theatre', distance: '1.0 km' },
        { id: 'kha2', name: 'Asian Srinivasa', distance: '2.5 km' },
        { id: 'kha3', name: 'Nartaki Theatre', distance: '3.5 km' },
        { id: 'kha4', name: 'Venkata Ramana', distance: '4.2 km' },
        { id: 'kha5', name: 'Sesh Mahal', distance: '5.0 km' },
    ],
    'Ramagundam': [
        { id: 'ram1', name: 'Annapurna Theatre', distance: '2.1 km' },
        { id: 'ram2', name: 'Srinivasa Theatre', distance: '3.0 km' },
        { id: 'ram3', name: 'Jyothi Theatre', distance: '4.1 km' },
        { id: 'ram4', name: 'Laxmi Theatre', distance: '5.5 km' },
        { id: 'ram5', name: 'Sri Ram Theatre', distance: '7.0 km' },
    ]
};

const getShowtimes = (cinemaId) => {
    return [
        { id: `${cinemaId}-t1`, time: '10:30 AM', format: '2D' },
        { id: `${cinemaId}-t2`, time: '01:45 PM', format: 'IMAX' },
        { id: `${cinemaId}-t3`, time: '05:15 PM', format: 'IMAX' },
        { id: `${cinemaId}-t4`, time: '09:00 PM', format: '2D' },
        { id: `${cinemaId}-t5`, time: '10:30 PM', format: '3D' },
    ];
};

const SEAT_CATEGORIES = [
    { key: 'recliner', label: 'Recliner', price: 450, rows: ['A', 'B'] },
    { key: 'premium', label: 'Premium', price: 320, rows: ['C', 'D', 'E'] },
    { key: 'classic', label: 'Classic', price: 200, rows: ['F', 'G', 'H'] },
];

const SEATS_PER_ROW = 12;
const AISLE_AFTER = [3, 8]; // visual gap after these seat indices

function buildSeatMap() {
    // deterministic-ish "taken" pattern so it doesn't reshuffle on every render
    const taken = new Set();
    let seed = 7;
    const rand = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
    SEAT_CATEGORIES.forEach((cat) => {
        cat.rows.forEach((row) => {
            for (let i = 1; i <= SEATS_PER_ROW; i++) {
                if (rand() < 0.18) taken.add(`${row}${i}`);
            }
        });
    });
    return taken;
}

function nextDates(count = 7) {
    const days = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push(d);
    }
    return days;
}

const MAX_SEATS = 8;

/* ---------------- MAIN COMPONENT ---------------- */

export default function BookNow() {
    const location = useLocation();
    const navigate = useNavigate();
    const movie = location.state?.movie || FALLBACK_MOVIE;

    const isEvent = !!movie.isEvent;

    const dates = useMemo(() => {
        if (isEvent && movie.release_date) {
            return [new Date(movie.release_date)];
        }
        return nextDates(7);
    }, [isEvent, movie.release_date]);

    const [selectedDateIdx, setSelectedDateIdx] = useState(0);

    const [userLocation, setUserLocation] = React.useState(localStorage.getItem('user_location') || 'Hyderabad');

    React.useEffect(() => {
        const handleLocationChange = () => {
            setUserLocation(localStorage.getItem('user_location') || 'Hyderabad');
        };
        window.addEventListener('locationChange', handleLocationChange);
        return () => window.removeEventListener('locationChange', handleLocationChange);
    }, []);

    const cinemas = useMemo(() => {
        if (isEvent && movie.venue) {
            return [{ id: 'event_venue', name: movie.venue, distance: 'Event Venue' }];
        }
        return CINEMAS_BY_LOCATION[userLocation] || CINEMAS_BY_LOCATION['Hyderabad'];
    }, [isEvent, movie.venue, userLocation]);

    const showtimes = useMemo(() => {
        if (isEvent && movie.time) {
            return { 'event_venue': [{ id: 'event_time', time: movie.time, format: 'Event' }] };
        }
        const times = {};
        cinemas.forEach(c => {
            times[c.id] = getShowtimes(c.id);
        });
        return times;
    }, [cinemas, isEvent, movie.time]);

    const [selectedCinema, setSelectedCinema] = useState(cinemas[0]?.id);
    const [selectedShowtime, setSelectedShowtime] = useState(null);

    React.useEffect(() => {
        setSelectedCinema(cinemas[0]?.id);
        setSelectedShowtime(null);
    }, [cinemas]);

    return (
        <div className="bn-page">
            <Navbar />
            <BookNowHeader movie={movie} onBack={() => navigate(-1)} />

            <main className="bn-main">
                <DateStrip
                    dates={dates}
                    selectedIdx={selectedDateIdx}
                    onSelect={(i) => {
                        setSelectedDateIdx(i);
                        setSelectedShowtime(null);
                    }}
                />

                <CinemaList
                    cinemas={cinemas}
                    selectedCinema={selectedCinema}
                    onSelectCinema={(id) => {
                        setSelectedCinema(id);
                        setSelectedShowtime(null);
                    }}
                    showtimes={showtimes}
                    selectedShowtime={selectedShowtime}
                    onSelectShowtime={(t) => {
                        setSelectedShowtime(t);
                        const c = cinemas.find((cin) => cin.id === selectedCinema);
                        navigate('/seats', { 
                            state: { 
                                movie, 
                                selectedDate: dates[selectedDateIdx], 
                                selectedCinema: c.name, 
                                selectedShowtime: t 
                            } 
                        });
                    }}
                />
            </main>
        </div>
    );
}

/* ---------------- HEADER ---------------- */
function BookNowHeader({ movie, onBack }) {
    return (
        <header className="bn-header">
            <button className="bn-back-btn" onClick={onBack}>
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
                    <span className="bn-rating-pill">★ {movie.vote_average?.toFixed?.(1) ?? movie.vote_average}</span>
                    <span>{movie.original_language?.toUpperCase()}</span>
                    <span>{movie.release_date?.slice(0, 4)}</span>
                    {movie.runtime && <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>}
                </div>
            </div>
        </header>
    );
}

/* ---------------- DATE STRIP ---------------- */
function DateStrip({ dates, selectedIdx, onSelect }) {
    const weekday = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = (d) => d.getDate();
    const month = (d) => d.toLocaleDateString('en-US', { month: 'short' });

    return (
        <section className="bn-section">
            <h2 className="bn-section-title">Select Date</h2>
            <div className="bn-date-strip">
                {dates.map((d, i) => (
                    <button
                        key={i}
                        className={`bn-date-chip ${selectedIdx === i ? 'active' : ''}`}
                        onClick={() => onSelect(i)}
                    >
                        <span className="bn-date-weekday">{i === 0 ? 'Today' : weekday(d)}</span>
                        <span className="bn-date-num">{dayNum(d)}</span>
                        <span className="bn-date-month">{month(d)}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}

/* ---------------- CINEMA + SHOWTIMES ---------------- */
function CinemaList({ cinemas, selectedCinema, onSelectCinema, showtimes, selectedShowtime, onSelectShowtime }) {
    return (
        <section className="bn-section">
            <h2 className="bn-section-title">Select Cinema &amp; Showtime</h2>
            <div className="bn-cinema-list">
                {cinemas.map((c) => (
                    <div
                        key={c.id}
                        className={`bn-cinema-card ${selectedCinema === c.id ? 'active' : ''}`}
                        onClick={() => onSelectCinema(c.id)}
                    >
                        <div className="bn-cinema-info">
                            <h3>{c.name}</h3>
                            <span className="bn-cinema-distance"><IconPin /> {c.distance}</span>
                        </div>
                        <div className="bn-showtime-row">
                            {showtimes[c.id].map((t) => (
                                <button
                                    key={t.id}
                                    className={`bn-showtime-chip ${selectedShowtime?.id === t.id ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectCinema(c.id);
                                        onSelectShowtime(t);
                                    }}
                                >
                                    <span>{t.time}</span>
                                    <em>{t.format}</em>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* ---------------- SEAT SELECTION ---------------- */
function SeatSelection({ takenSeats, selectedSeats, onToggleSeat }) {
    return (
        <section className="bn-section bn-seat-section">
            <h2 className="bn-section-title">Select Seats</h2>

            <div className="bn-seat-map-wrap">
                <div className="bn-screen-wrap">
                    <div className="bn-screen" />
                    <span className="bn-screen-label">SCREEN THIS WAY</span>
                </div>

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
                                    {Array.from({ length: SEATS_PER_ROW }, (_, idx) => {
                                        const num = idx + 1;
                                        const seatId = `${row}${num}`;
                                        const isTaken = takenSeats.has(seatId);
                                        const isSelected = selectedSeats.includes(seatId);
                                        return (
                                            <React.Fragment key={seatId}>
                                                <button
                                                    className={`bn-seat ${isTaken ? 'taken' : ''} ${isSelected ? 'selected' : ''}`}
                                                    disabled={isTaken}
                                                    onClick={() => onToggleSeat(seatId)}
                                                    title={seatId}
                                                >
                                                    {num}
                                                </button>
                                                {AISLE_AFTER.includes(num) && <span className="bn-aisle-gap" />}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}

                <div className="bn-legend">
                    <span><i className="bn-legend-swatch available" /> Available</span>
                    <span><i className="bn-legend-swatch selected" /> Selected</span>
                    <span><i className="bn-legend-swatch taken" /> Taken</span>
                </div>
            </div>
        </section>
    );
}

/* ---------------- SUMMARY BAR ---------------- */
function SummaryBar({ seats, total, canProceed, onConfirm }) {
    return (
        <div className="bn-summary-bar">
            <div className="bn-summary-seats">
                {seats.length === 0 ? (
                    <span className="bn-summary-hint">Select up to {MAX_SEATS} seats</span>
                ) : (
                    <>
                        <span className="bn-summary-count">{seats.length} seat{seats.length > 1 ? 's' : ''}</span>
                        <span className="bn-summary-ids">{seats.slice().sort().join(', ')}</span>
                    </>
                )}
            </div>
            <div className="bn-summary-right">
                <div className="bn-summary-total">
                    <span>Total</span>
                    <strong>₹{total}</strong>
                </div>
                <button className="bn-proceed-btn" disabled={!canProceed} onClick={onConfirm}>
                    Proceed to Pay <span>→</span>
                </button>
            </div>
        </div>
    );
}

/* ---------------- ICONS ---------------- */
function IconArrowLeft() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>; }
function IconFilm() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="8" y1="2" x2="8" y2="22" /><line x1="16" y1="2" x2="16" y2="22" /></svg>; }
function IconPin() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>; }